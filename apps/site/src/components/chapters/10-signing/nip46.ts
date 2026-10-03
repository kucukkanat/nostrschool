/**
 * NIP-46 (remote signing / "bunker") with real crypto: every request and response is a kind 24133
 * event whose content is NIP-44 encrypted JSON-RPC. Pure functions; relays are the caller's job.
 * Spec: https://github.com/nostr-protocol/nips/blob/master/46.md
 */
import {
  type EventTemplate,
  fail,
  type Hex,
  isValidPublicKey,
  type Keypair,
  type NostrEvent,
  nip44ConversationKey,
  nip44Decrypt,
  nip44Encrypt,
  ok,
  type ProtocolError,
  parseJson,
  type RelayUrl,
  type Result,
  signEvent,
  validateEventShape,
  verifyEvent,
} from "@nostrschool/protocol";

export const NIP46_KIND = 24133;

export const NIP46_METHODS = [
  "connect",
  "sign_event",
  "ping",
  "get_public_key",
  "nip04_encrypt",
  "nip04_decrypt",
  "nip44_encrypt",
  "nip44_decrypt",
  "switch_relays",
  "logout",
] as const;
export type Nip46Method = (typeof NIP46_METHODS)[number];

export interface Nip46Request {
  readonly id: string;
  readonly method: Nip46Method;
  readonly params: readonly string[];
}

export interface Nip46Response {
  readonly id: string;
  readonly result: string;
  readonly error?: string;
}

export type Nip46ErrorCode =
  | "invalid-url"
  | "invalid-key"
  | "crypto"
  | "bad-event"
  | "invalid-json"
  | "invalid-message";
export type Nip46Error = ProtocolError<Nip46ErrorCode>;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isMethod = (v: unknown): v is Nip46Method =>
  typeof v === "string" && (NIP46_METHODS as readonly string[]).includes(v);

export const parseNip46Request = (x: unknown): Result<Nip46Request, Nip46Error> => {
  if (!isRecord(x) || typeof x["id"] !== "string" || !isMethod(x["method"]))
    return fail("invalid-message", "A request needs a string id and a known method");
  const params = x["params"];
  if (!Array.isArray(params) || !params.every((p): p is string => typeof p === "string"))
    return fail("invalid-message", "params must be an array of strings");
  return ok({ id: x["id"], method: x["method"], params });
};

export const parseNip46Response = (x: unknown): Result<Nip46Response, Nip46Error> => {
  if (!isRecord(x) || typeof x["id"] !== "string" || typeof x["result"] !== "string")
    return fail("invalid-message", "A response needs a string id and a string result");
  const error = x["error"];
  if (error !== undefined && typeof error !== "string")
    return fail("invalid-message", "error must be a string when present");
  return ok(
    error === undefined
      ? { id: x["id"], result: x["result"] }
      : { id: x["id"], result: x["result"], error },
  );
};

export interface BunkerPointer {
  readonly pubkey: Hex;
  readonly relays: readonly RelayUrl[];
  readonly secret?: string;
}

/** `bunker://<remote-signer-pubkey>?relay=wss://…&relay=…&secret=…` */
export const parseBunkerUrl = (raw: string): Result<BunkerPointer, Nip46Error> => {
  const match = /^bunker:\/\/([0-9a-f]{64})(?:\?(.*))?$/.exec(raw.trim());
  const pubkey = match?.[1];
  if (pubkey === undefined || !isValidPublicKey(pubkey))
    return fail("invalid-url", "Expected bunker://<64-hex remote-signer pubkey>?relay=…");
  const query = new URLSearchParams(match?.[2] ?? "");
  const relays = query.getAll("relay");
  if (relays.length === 0 || !relays.every((r) => /^wss?:\/\/\S+$/.test(r)))
    return fail("invalid-url", "A bunker URL needs at least one ws:// or wss:// relay");
  const secret = query.get("secret");
  return ok(secret === null ? { pubkey, relays } : { pubkey, relays, secret });
};

export const buildBunkerUrl = (p: BunkerPointer): string => {
  const query = new URLSearchParams();
  for (const r of p.relays) query.append("relay", r);
  if (p.secret !== undefined) query.set("secret", p.secret);
  return `bunker://${p.pubkey}?${query.toString()}`;
};

export interface SealedRpc {
  /** The JSON-RPC text before encryption — only the two endpoints ever see this. */
  readonly plaintext: string;
  /** The kind 24133 event a relay sees: opaque ciphertext + a `p` tag. */
  readonly event: NostrEvent;
}

/** Encrypts an RPC message to `recipient` and wraps it in a signed kind 24133 event. */
export const sealRpc = (
  message: Nip46Request | Nip46Response,
  sender: Keypair,
  recipient: Hex,
  createdAt: number,
): Result<SealedRpc, Nip46Error> => {
  const key = nip44ConversationKey(sender.secretKey, recipient);
  if (!key.ok) return fail("invalid-key", key.error.message);
  const plaintext = JSON.stringify(message);
  const enc = nip44Encrypt(plaintext, key.value);
  if (!enc.ok) return fail("crypto", enc.error.message);
  const template: EventTemplate = {
    kind: NIP46_KIND,
    created_at: createdAt,
    tags: [["p", recipient]],
    content: enc.value.payload,
  };
  const signed = signEvent(template, sender.secretKey);
  return signed.ok
    ? ok({ plaintext, event: signed.value.event })
    : fail("invalid-key", signed.error.message);
};

/** Verifies, decrypts and JSON-parses a kind 24133 event addressed to `recipient`. */
export const openRpc = (event: NostrEvent, recipient: Keypair): Result<unknown, Nip46Error> => {
  if (event.kind !== NIP46_KIND) return fail("bad-event", `Expected kind ${NIP46_KIND}`);
  const verified = verifyEvent(event);
  if (!verified.ok) return fail("bad-event", verified.error.message);
  const key = nip44ConversationKey(recipient.secretKey, event.pubkey);
  if (!key.ok) return fail("invalid-key", key.error.message);
  const dec = nip44Decrypt(event.content, key.value);
  if (!dec.ok) return fail("crypto", dec.error.message);
  const json = parseJson(dec.value.plaintext);
  return json.ok ? json : fail("invalid-json", "Decrypted content is not JSON");
};

export interface BunkerPolicy {
  /** The user's key: lives only inside the bunker. */
  readonly user: Keypair;
  /** One-time connection secret from the bunker URL (if any). */
  readonly secret?: string;
  /** Did the human tap "Approve" for this request? */
  readonly approve: boolean;
}

const isTags = (v: unknown): v is EventTemplate["tags"] =>
  Array.isArray(v) &&
  v.every((t) => Array.isArray(t) && t.length > 0 && t.every((x) => typeof x === "string"));

const parseTemplate = (raw: string | undefined): EventTemplate | undefined => {
  const json = parseJson(raw ?? "");
  const x = json.ok ? json.value : undefined;
  return isRecord(x) &&
    typeof x["kind"] === "number" &&
    typeof x["created_at"] === "number" &&
    typeof x["content"] === "string" &&
    isTags(x["tags"])
    ? { kind: x["kind"], created_at: x["created_at"], content: x["content"], tags: x["tags"] }
    : undefined;
};

/** What a bunker answers. The user's secret key is used here and never returned. */
export const answerRequest = (req: Nip46Request, policy: BunkerPolicy): Nip46Response => {
  const reply = (result: string, error?: string): Nip46Response =>
    error === undefined ? { id: req.id, result } : { id: req.id, result, error };
  if (!policy.approve) return reply("", "user rejected the request");
  switch (req.method) {
    case "connect":
      return policy.secret === undefined || req.params[1] === policy.secret
        ? reply("ack")
        : reply("", "invalid secret");
    case "ping":
      return reply("pong");
    case "get_public_key":
      return reply(policy.user.publicKey);
    case "sign_event": {
      const template = parseTemplate(req.params[0]);
      if (template === undefined) return reply("", "invalid event template");
      const signed = signEvent(template, policy.user.secretKey);
      return signed.ok
        ? reply(JSON.stringify(signed.value.event))
        : reply("", signed.error.message);
    }
    default:
      return reply("", `method ${req.method} not supported by this demo bunker`);
  }
};

export interface Nip46Hop {
  readonly id:
    | "connect-req"
    | "connect-res"
    | "pubkey-req"
    | "pubkey-res"
    | "sign-req"
    | "sign-res";
  readonly direction: "to-bunker" | "to-app";
  readonly rpc: Nip46Request | Nip46Response;
  readonly sealed: SealedRpc;
}

export interface Nip46Session {
  readonly bunkerUrl: string;
  /** Learned via get_public_key: the key the bunker signs with, which may differ from its own. */
  readonly userPubkey: Hex;
  readonly hops: readonly Nip46Hop[];
  /** The signed note the app got back (undefined when the user rejected). */
  readonly event?: NostrEvent;
  readonly error?: string;
}

export interface SessionInput {
  /** Throwaway keypair the app creates just to talk to the bunker. */
  readonly client: Keypair;
  /** The bunker's own communication keypair (may differ from the user's). */
  readonly bunker: Keypair;
  readonly user: Keypair;
  readonly relay: RelayUrl;
  readonly secret: string;
  readonly template: EventTemplate;
  readonly approve: boolean;
}

/**
 * The full connect → get_public_key → sign_event exchange, both sides played for real: the app encrypts to the
 * bunker, the bunker decrypts, decides, signs with the user key and encrypts the answer back.
 */
export const runNip46Session = (s: SessionInput): Result<Nip46Session, Nip46Error> => {
  const at = s.template.created_at;
  const bunkerUrl = buildBunkerUrl({
    pubkey: s.bunker.publicKey,
    relays: [s.relay],
    secret: s.secret,
  });
  const hops: Nip46Hop[] = [];

  const roundTrip = (
    req: Nip46Request,
    ids: readonly [Nip46Hop["id"], Nip46Hop["id"]],
    approve: boolean,
  ): Result<Nip46Response, Nip46Error> => {
    const out = sealRpc(req, s.client, s.bunker.publicKey, at);
    if (!out.ok) return out;
    hops.push({ id: ids[0], direction: "to-bunker", rpc: req, sealed: out.value });
    // Bunker side: it only ever sees the encrypted event.
    const received = openRpc(out.value.event, s.bunker);
    if (!received.ok) return received;
    const parsed = parseNip46Request(received.value);
    if (!parsed.ok) return parsed;
    const res = answerRequest(parsed.value, { user: s.user, secret: s.secret, approve });
    const back = sealRpc(res, s.bunker, s.client.publicKey, at);
    if (!back.ok) return back;
    hops.push({ id: ids[1], direction: "to-app", rpc: res, sealed: back.value });
    // App side: decrypt the answer.
    const opened = openRpc(back.value.event, s.client);
    return opened.ok ? parseNip46Response(opened.value) : opened;
  };

  const connect = roundTrip(
    { id: "c1", method: "connect", params: [s.bunker.publicKey, s.secret, "sign_event:1"] },
    ["connect-req", "connect-res"],
    true,
  );
  if (!connect.ok) return connect;
  // The bunker URL names the remote-signer pubkey, not the user's: NIP-46 says to ask after connecting.
  const pubkey = roundTrip(
    { id: "p1", method: "get_public_key", params: [] },
    ["pubkey-req", "pubkey-res"],
    true,
  );
  if (!pubkey.ok) return pubkey;
  const userPubkey = pubkey.value.result;
  const sign = roundTrip(
    { id: "s1", method: "sign_event", params: [JSON.stringify(s.template)] },
    ["sign-req", "sign-res"],
    s.approve,
  );
  if (!sign.ok) return sign;
  if (sign.value.error !== undefined)
    return ok({ bunkerUrl, userPubkey, hops, error: sign.value.error });
  const json = parseJson(sign.value.result);
  const event = validateEventShape(json.ok ? json.value : undefined);
  return event.ok
    ? ok({ bunkerUrl, userPubkey, hops, event: event.value })
    : fail("invalid-message", "sign_event result is not a signed event");
};
