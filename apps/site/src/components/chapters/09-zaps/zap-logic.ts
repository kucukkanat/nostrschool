/**
 * Pure NIP-57 teaching helpers for chapter 09. Everything runs on fixture data with real
 * Schnorr signatures, so the receipt checks below are the same checks a real client runs.
 */
import {
  eventsByKind,
  getPersona,
  type Persona,
  ZAP_SERVICES,
  type ZapFixture,
  type ZapService,
} from "@nostrschool/fixtures";
import {
  deriveSecretKey,
  fail,
  getTagValues,
  type Hex,
  type NostrEvent,
  ok,
  type ProtocolError,
  parseEventJson,
  parseJson,
  type Result,
  signEvent,
  type Tag,
  verifyEvent,
} from "@nostrschool/protocol";

/* ---------- lud16 (LUD-16 Lightning address) ---------- */

export type Lud16ErrorCode = "empty" | "format" | "name" | "domain";
export type Lud16Error = ProtocolError<Lud16ErrorCode>;
export interface Lud16 {
  readonly name: string;
  readonly domain: string;
  /** LUD-16: `https://<domain>/.well-known/lnurlp/<name>` */
  readonly url: string;
}

/** Parses `name@domain` into the LNURL-pay endpoint an app fetches (LUD-16). */
export const parseLud16 = (input: string): Result<Lud16, Lud16Error> => {
  const value = input.trim().toLowerCase();
  if (value === "") return fail("empty", "empty address");
  const parts = value.split("@");
  const [name, domain] = parts;
  if (parts.length !== 2 || name === undefined || domain === undefined || name === "")
    return fail("format", "expected exactly one @ with a name before it");
  if (!/^[a-z0-9\-_.]+$/.test(name)) return fail("name", "name allows only a-z 0-9 - _ .");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) return fail("domain", "domain needs a dot");
  return ok({ name, domain, url: `https://${domain}/.well-known/lnurlp/${name}` });
};

/* ---------- BOLT11 amounts ---------- */

export type InvoiceErrorCode = "invalid-invoice" | "no-amount";
export type InvoiceError = ProtocolError<InvoiceErrorCode>;

// BOLT11 amounts are BTC with an SI multiplier; 1 BTC = 1e11 msat.
const MSAT_PER_UNIT: Readonly<Record<string, number>> = { m: 1e8, u: 1e5, n: 100, p: 0.1 };
const HRP = /^ln(?:bcrt|bc|tbs|tb)(\d+)?([munp])?$/;

const splitHrp = (invoice: string): Result<RegExpExecArray, InvoiceError> => {
  // bech32 data never contains "1", so the last "1" separates the human-readable part.
  const sep = invoice.lastIndexOf("1");
  const match = sep > 0 ? HRP.exec(invoice.slice(0, sep).toLowerCase()) : null;
  return match === null ? fail("invalid-invoice", "not a bolt11 invoice") : ok(match);
};

/** Amount encoded in a BOLT11 invoice's prefix, in millisats (e.g. `lnbc21000n…` → 2 100 000). */
export const bolt11AmountMsats = (invoice: string): Result<number, InvoiceError> => {
  const hrp = splitHrp(invoice);
  if (!hrp.ok) return hrp;
  const [, digits, unit] = hrp.value;
  if (digits === undefined) return fail("no-amount", "invoice has no amount");
  const msats = Number(digits) * (unit === undefined ? 1e11 : (MSAT_PER_UNIT[unit] ?? 1e11));
  return Number.isInteger(msats) ? ok(msats) : fail("invalid-invoice", "sub-millisat amount");
};

/** Multiplies the amount in an invoice prefix — what a cheater would do to brag about a bigger zap. */
export const inflateInvoice = (invoice: string, factor: number): Result<string, InvoiceError> => {
  const hrp = splitHrp(invoice);
  if (!hrp.ok) return hrp;
  const [prefix, digits] = hrp.value;
  if (digits === undefined) return fail("no-amount", "invoice has no amount");
  const inflated = prefix.replace(digits, String(Number(digits) * factor));
  return ok(inflated + invoice.slice(prefix.length));
};

/* ---------- the flow ---------- */

export const ZAP_LANES = ["client", "server", "lightning", "relays"] as const;
export type ZapLane = (typeof ZAP_LANES)[number];
export type ZapStepId =
  | "profile"
  | "lnurlp"
  | "params"
  | "sign"
  | "callback"
  | "invoice"
  | "pay"
  | "settle"
  | "receipt"
  | "tally";

export interface ZapStepDef {
  readonly id: ZapStepId;
  readonly lane: ZapLane;
  readonly to?: ZapLane;
  /** Only relay traffic is a Nostr wire message; the rest is HTTP or Lightning. */
  readonly packet?: "EVENT";
  readonly icon: string;
}

export const ZAP_STEPS: readonly ZapStepDef[] = [
  { id: "profile", lane: "relays", to: "client", packet: "EVENT", icon: "🪪" },
  { id: "lnurlp", lane: "client", to: "server", icon: "🚪" },
  { id: "params", lane: "server", to: "client", icon: "🤝" },
  { id: "sign", lane: "client", icon: "✍️" },
  { id: "callback", lane: "client", to: "server", icon: "📨" },
  { id: "invoice", lane: "server", to: "client", icon: "🧾" },
  { id: "pay", lane: "client", to: "lightning", icon: "⚡" },
  { id: "settle", lane: "lightning", to: "server", icon: "✅" },
  { id: "receipt", lane: "server", to: "relays", packet: "EVENT", icon: "📣" },
  { id: "tally", lane: "relays", to: "client", packet: "EVENT", icon: "🎉" },
];

export interface LnurlPayResponse {
  readonly callback: string;
  readonly minSendable: number;
  readonly maxSendable: number;
  readonly metadata: string;
  readonly tag: "payRequest";
  readonly allowsNostr: true;
  readonly nostrPubkey: Hex;
}

export interface ZapFlow {
  readonly zap: ZapFixture;
  readonly sender: Persona;
  readonly recipient: Persona;
  readonly lud16: Lud16;
  /** Parsed `content` of the recipient's newest kind 0. */
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly payResponse: LnurlPayResponse;
  readonly callbackUrl: string;
  /** Total verified msats zapped to the same target (post, or profile if no `e` tag). */
  readonly tallyMsats: number;
  readonly tallyCount: number;
}

export type ZapErrorCode = Lud16ErrorCode | "unknown-wallet" | "missing-profile";
export type ZapError = ProtocolError<ZapErrorCode>;

const ZEROS = new Uint8Array(32);
const ROGUE_KEY = deriveSecretKey("nostrschool:rogue-zapper");

/** The (fixture) wallet server behind a Lightning address: it signs that user's receipts. */
export const walletFor = (lud16: string): Result<ZapService, ZapError> => {
  const parsed = parseLud16(lud16);
  if (!parsed.ok) return parsed;
  const service = ZAP_SERVICES.find((s) => s.domain === parsed.value.domain);
  return service === undefined
    ? fail("unknown-wallet", `no wallet server for ${parsed.value.domain}`)
    : ok(service);
};

const isRecord = (x: unknown): x is Readonly<Record<string, unknown>> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** Parsed content of a persona's newest kind 0 (where the lud16 lives). */
export const profileMetadata = (
  pubkey: Hex,
): Result<Readonly<Record<string, unknown>>, ZapError> => {
  const event = eventsByKind(0).find((e) => e.pubkey === pubkey);
  if (event === undefined) return fail("missing-profile", `no kind 0 for ${pubkey}`);
  const content = parseJson(event.content);
  return content.ok && isRecord(content.value)
    ? ok(content.value)
    : fail("missing-profile", "kind 0 content is not a JSON object");
};

/** What a zap is "for": the zapped post, or the recipient's profile when no `e` tag is set. */
export const zapTarget = (request: Pick<NostrEvent, "tags">): string => {
  const e = getTagValues(request, "e")[0];
  return e === undefined ? `p:${getTagValues(request, "p")[0] ?? ""}` : `e:${e}`;
};

/** Sums only receipts that pass every client-side check — fake receipts never inflate a counter. */
export const zapTally = (
  all: readonly ZapFixture[],
  target: string,
): { readonly msats: number; readonly count: number } =>
  all
    .filter((z) => zapTarget(z.request) === target)
    .flatMap((z) => {
      const wallet = walletFor(getPersona(z.recipient).lud16);
      if (!wallet.ok) return [];
      const checks = checkReceipt(z.receipt, wallet.value.pubkey);
      return allPassed(checks) ? [z.amountMsats] : [];
    })
    .reduce((acc, msats) => ({ msats: acc.msats + msats, count: acc.count + 1 }), {
      msats: 0,
      count: 0,
    });

export const buildZapFlow = (
  zap: ZapFixture,
  all: readonly ZapFixture[],
): Result<ZapFlow, ZapError> => {
  const sender = getPersona(zap.sender);
  const recipient = getPersona(zap.recipient);
  const lud16 = parseLud16(recipient.lud16);
  if (!lud16.ok) return lud16;
  const wallet = walletFor(recipient.lud16);
  if (!wallet.ok) return wallet;
  const metadata = profileMetadata(recipient.pubkey);
  if (!metadata.ok) return metadata;
  const { name, domain } = lud16.value;
  const callback = `https://${domain}/lnurlp/${name}/callback`;
  const tally = zapTally(all, zapTarget(zap.request));
  return ok({
    zap,
    sender,
    recipient,
    lud16: lud16.value,
    metadata: metadata.value,
    payResponse: {
      callback,
      minSendable: 1000,
      maxSendable: 100_000_000_000,
      metadata: JSON.stringify([
        ["text/plain", `Zap ${recipient.displayName}`],
        ["text/identifier", recipient.lud16],
      ]),
      tag: "payRequest",
      allowsNostr: true,
      nostrPubkey: wallet.value.pubkey,
    },
    callbackUrl: `${callback}?amount=${zap.amountMsats}&nostr=${encodeURIComponent(JSON.stringify(zap.request))}`,
    tallyMsats: tally.msats,
    tallyCount: tally.count,
  });
};

export interface StepPayload {
  readonly value: unknown;
  /** JsonView paths to emphasize. */
  readonly highlight: readonly string[];
}

/** The data that actually travels on a step, shaped for display. */
export const stepPayload = (flow: ZapFlow, id: ZapStepId): StepPayload => {
  const { zap } = flow;
  switch (id) {
    case "profile":
      return { value: flow.metadata, highlight: ["lud16"] };
    case "lnurlp":
      return { value: { method: "GET", url: flow.lud16.url }, highlight: ["url"] };
    case "params":
      return { value: flow.payResponse, highlight: ["allowsNostr", "nostrPubkey"] };
    case "sign":
      return { value: zap.request, highlight: ["kind", "sig"] };
    case "callback":
      return {
        value: {
          method: "GET",
          url: flow.payResponse.callback,
          query: { amount: String(zap.amountMsats), nostr: zap.request },
        },
        highlight: ["query.nostr"],
      };
    case "invoice":
      return { value: { pr: zap.bolt11, routes: [] }, highlight: ["pr"] };
    case "pay":
      return {
        value: { invoice: zap.bolt11, amount_msat: zap.amountMsats },
        highlight: ["amount_msat"],
      };
    case "settle":
      return {
        value: { paid: true, preimage: getTagValues(zap.receipt, "preimage")[0] ?? null },
        highlight: ["preimage"],
      };
    case "receipt":
      return { value: ["EVENT", zap.receipt], highlight: ["1.kind", "1.pubkey"] };
    case "tally":
      return {
        value: { target: zapTarget(zap.request), zaps: flow.tallyCount, msats: flow.tallyMsats },
        highlight: ["msats"],
      };
  }
};

/* ---------- client-side receipt checks ---------- */

export const RECEIPT_CHECKS = ["signature", "signer", "embedded", "recipient", "amount"] as const;
export type ReceiptCheckId = (typeof RECEIPT_CHECKS)[number];
export interface ReceiptCheck {
  readonly id: ReceiptCheckId;
  readonly passed: boolean;
}

/**
 * NIP-57 "Appendix F": what a client verifies before showing a zap. Every check runs (no
 * short-circuit) so the UI can show all failures at once.
 */
export const checkReceipt = (receipt: NostrEvent, nostrPubkey: Hex): readonly ReceiptCheck[] => {
  const request = parseEventJson(getTagValues(receipt, "description")[0] ?? "");
  const req = request.ok && request.value.kind === 9734 ? request.value : undefined;
  const amountTag = req === undefined ? undefined : getTagValues(req, "amount")[0];
  const invoiceAmount = bolt11AmountMsats(getTagValues(receipt, "bolt11")[0] ?? "");
  const passed: Record<ReceiptCheckId, boolean> = {
    signature: receipt.kind === 9735 && verifyEvent(receipt).ok,
    signer: receipt.pubkey === nostrPubkey,
    embedded: req !== undefined && verifyEvent(req).ok,
    recipient:
      req !== undefined &&
      getTagValues(receipt, "p")[0] !== undefined &&
      getTagValues(receipt, "p")[0] === getTagValues(req, "p")[0],
    // Appendix F only demands a match "if present": the amount tag is optional (Appendix A),
    // so a request without one passes this check (the signer check still applies).
    amount:
      req !== undefined &&
      (amountTag === undefined || (invoiceAmount.ok && invoiceAmount.value === Number(amountTag))),
  };
  return RECEIPT_CHECKS.map((id) => ({ id, passed: passed[id] }));
};

export const allPassed = (checks: readonly ReceiptCheck[]): boolean =>
  checks.every((c) => c.passed);

export const SCENARIOS = ["honest", "tampered", "impostor", "liar"] as const;
export type Scenario = (typeof SCENARIOS)[number];

const replaceTag = (tags: readonly Tag[], name: string, value: string): readonly Tag[] =>
  tags.map((t) => (t[0] === name ? ([name, value] as const) : t));

export type ForgeError = InvoiceError | ProtocolError<"sign-failed">;

const sign = (receipt: NostrEvent, tags: readonly Tag[], key: Uint8Array, dt: number) => {
  // Fixed aux randomness keeps the forged receipts byte-for-byte reproducible.
  const signed = signEvent(
    { kind: 9735, created_at: receipt.created_at + dt, tags, content: receipt.content },
    key,
    { auxRand: ZEROS },
  );
  return signed.ok ? ok(signed.value.event) : fail("sign-failed", signed.error.message);
};

/** Builds the receipt for a checker scenario, with real signatures where the scenario signs. */
export const forgeReceipt = (
  zap: ZapFixture,
  scenario: Scenario,
  walletSecretKey: Uint8Array,
): Result<NostrEvent, ForgeError> => {
  const { receipt } = zap;
  if (scenario === "honest") return ok(receipt);
  if (scenario === "liar")
    // Same shape as an honest receipt, signed by the real wallet — minus any real payment.
    return sign(
      receipt,
      receipt.tags.filter((t) => t[0] !== "preimage"),
      walletSecretKey,
      60,
    );
  const inflated = inflateInvoice(zap.bolt11, 10);
  if (!inflated.ok) return inflated;
  const tags = replaceTag(receipt.tags, "bolt11", inflated.value);
  return scenario === "tampered" ? ok({ ...receipt, tags }) : sign(receipt, tags, ROGUE_KEY, 0);
};
