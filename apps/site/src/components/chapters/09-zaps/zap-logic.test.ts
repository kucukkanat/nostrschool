import { describe, expect, test } from "bun:test";
import { getPersona, ZAP_SERVICES, type ZapFixture, zaps } from "@nostrschool/fixtures";
import { getTagValues, type NostrEvent, unwrap, verifyEvent } from "@nostrschool/protocol";
import {
  allPassed,
  bolt11AmountMsats,
  buildZapFlow,
  checkReceipt,
  forgeReceipt,
  inflateInvoice,
  parseLud16,
  profileMetadata,
  RECEIPT_CHECKS,
  SCENARIOS,
  stepPayload,
  walletFor,
  ZAP_STEPS,
  zapTally,
  zapTarget,
} from "./zap-logic.ts";

const all = zaps();
const first = (): ZapFixture => {
  const z = all[0];
  if (z === undefined) throw new Error("fixtures have no zaps");
  return z;
};
const wallet = () => unwrap(walletFor(getPersona(first().recipient).lud16));
const pattern = (checks: ReturnType<typeof checkReceipt>) =>
  checks.map((c) => (c.passed ? 1 : 0)).join("");

describe("parseLud16", () => {
  test("turns name@domain into the LUD-16 well-known URL (trimmed, lowercased)", () => {
    expect(unwrap(parseLud16("  Erin@Wallet.Alpha.Example "))).toEqual({
      name: "erin",
      domain: "wallet.alpha.example",
      url: "https://wallet.alpha.example/.well-known/lnurlp/erin",
    });
  });
  test.each([
    ["", "empty"],
    ["   ", "empty"],
    ["erin", "format"],
    ["a@b@c.com", "format"],
    ["@wallet.example", "format"],
    ["er in@wallet.example", "name"],
    ["erin@localhost", "domain"],
    ["erin@", "domain"],
  ])("%p → %s", (input, code) => {
    const r = parseLud16(input);
    expect(r.ok ? "ok" : r.error.code).toBe(code);
  });
});

describe("bolt11AmountMsats", () => {
  test.each([
    ["lnbc21000n1pabc", 2_100_000],
    ["lnbc2500u1pabc", 250_000_000],
    ["lnbc1m1pabc", 100_000_000],
    ["lnbc10p1pabc", 1],
    ["lnbc11pvjluez", 100_000_000_000],
    ["LNTB5U1PABC", 500_000],
    ["lnbcrt7n1qq", 700],
  ])("%s → %d msat", (invoice, msats) => {
    expect(unwrap(bolt11AmountMsats(invoice))).toBe(msats);
  });
  test("decodes the fixture invoices to the zapped amount", () => {
    for (const z of all) expect(unwrap(bolt11AmountMsats(z.bolt11))).toBe(z.amountMsats);
  });
  test.each([
    ["", "invalid-invoice"],
    ["hello1world", "invalid-invoice"],
    ["lnxx10n1abc", "invalid-invoice"],
    ["lnbc15p1abc", "invalid-invoice"],
    ["lnbc1qqqq", "no-amount"],
    ["lnbc1pvjluez", "no-amount"],
  ])("%p fails with %s", (invoice, code) => {
    const r = bolt11AmountMsats(invoice);
    expect(r.ok ? "ok" : r.error.code).toBe(code);
  });
});

describe("inflateInvoice", () => {
  test("multiplies only the amount and keeps the rest", () => {
    const out = unwrap(inflateInvoice("lnbc21000n1pxyz", 10));
    expect(out).toBe("lnbc210000n1pxyz");
    expect(unwrap(bolt11AmountMsats(out))).toBe(21_000_000);
  });
  test("fails on garbage or amountless invoices", () => {
    expect(inflateInvoice("nope", 2).ok).toBe(false);
    const r = inflateInvoice("lnbc1qqqq", 2);
    expect(r.ok ? "" : r.error.code).toBe("no-amount");
  });
});

describe("walletFor / profileMetadata", () => {
  test("finds the fixture wallet server by domain", () => {
    expect(wallet().domain).toBe("wallet.alpha.example");
    expect(ZAP_SERVICES.map((s) => s.pubkey)).toContain(wallet().pubkey);
  });
  test("fails for invalid addresses and unknown domains", () => {
    const bad = walletFor("nope");
    expect(bad.ok ? "" : bad.error.code).toBe("format");
    const unknown = walletFor("erin@wallet.zeta.example");
    expect(unknown.ok ? "" : unknown.error.code).toBe("unknown-wallet");
  });
  test("reads lud16 from the newest kind 0, or fails when there is none", () => {
    const erin = getPersona("erin");
    expect(unwrap(profileMetadata(erin.pubkey))["lud16"]).toBe(erin.lud16);
    const r = profileMetadata("00".repeat(32));
    expect(r.ok ? "" : r.error.code).toBe("missing-profile");
  });
});

describe("buildZapFlow + stepPayload", () => {
  test("builds a flow for every fixture zap", () => {
    for (const z of all) {
      const flow = unwrap(buildZapFlow(z, all));
      expect(flow.payResponse.allowsNostr).toBe(true);
      expect(flow.payResponse.nostrPubkey).toBe(z.receipt.pubkey);
      expect(flow.lud16.url).toContain("/.well-known/lnurlp/");
      // The callback carries the URI-encoded request, which round-trips exactly.
      const nostr = new URL(flow.callbackUrl).searchParams.get("nostr");
      expect(JSON.parse(nostr ?? "")).toEqual(z.request);
      expect(flow.tallyMsats).toBeGreaterThanOrEqual(z.amountMsats);
    }
  });
  test("every step has a payload with highlight paths", () => {
    const flow = unwrap(buildZapFlow(first(), all));
    const byId = Object.fromEntries(ZAP_STEPS.map((s) => [s.id, stepPayload(flow, s.id)]));
    expect(Object.keys(byId)).toHaveLength(10);
    for (const p of Object.values(byId)) expect(p.highlight.length).toBeGreaterThan(0);
    expect(byId["profile"]?.value).toMatchObject({ lud16: getPersona("erin").lud16 });
    expect(byId["sign"]?.value).toBe(first().request);
    expect(byId["receipt"]?.value).toEqual(["EVENT", first().receipt]);
    expect(byId["invoice"]?.value).toEqual({ pr: first().bolt11, routes: [] });
    expect(byId["settle"]?.value).toMatchObject({ paid: true });
    expect(byId["tally"]?.value).toMatchObject({ zaps: 1, msats: first().amountMsats });
    expect(byId["callback"]?.value).toMatchObject({ query: { nostr: first().request } });
    expect(byId["lnurlp"]?.value).toMatchObject({ method: "GET" });
    expect(byId["params"]?.value).toMatchObject({ allowsNostr: true });
    expect(byId["pay"]?.value).toMatchObject({ amount_msat: first().amountMsats });
  });
  test("settle shows null when a receipt has no preimage", () => {
    const z = first();
    const noPreimage = {
      ...z,
      receipt: { ...z.receipt, tags: z.receipt.tags.filter((t) => t[0] !== "preimage") },
    };
    const flow = unwrap(buildZapFlow(noPreimage, all));
    expect(stepPayload(flow, "settle").value).toEqual({ paid: true, preimage: null });
  });
  test("only relay hops are Nostr EVENT packets", () => {
    expect(ZAP_STEPS.filter((s) => s.packet === "EVENT").map((s) => s.id)).toEqual([
      "profile",
      "receipt",
      "tally",
    ]);
  });
});

describe("zapTarget / zapTally", () => {
  test("targets the post when an e tag exists, else the profile", () => {
    const z = first();
    expect(zapTarget(z.request)).toBe(`e:${getTagValues(z.request, "e")[0]}`);
    expect(zapTarget({ tags: [["p", "ab"]] })).toBe("p:ab");
    expect(zapTarget({ tags: [] })).toBe("p:");
  });
  test("sums only receipts that pass every check", () => {
    const z = first();
    const forged: ZapFixture = { ...z, receipt: { ...z.receipt, sig: "00".repeat(64) } };
    const target = zapTarget(z.request);
    expect(zapTally([z], target)).toEqual({ msats: z.amountMsats, count: 1 });
    expect(zapTally([z, forged], target)).toEqual({ msats: z.amountMsats, count: 1 });
    expect(zapTally([z], "e:none")).toEqual({ msats: 0, count: 0 });
    const ghost: ZapFixture = { ...z, recipient: "erin" };
    expect(zapTally([ghost], target).count).toBe(1);
  });
});

describe("checkReceipt + forgeReceipt", () => {
  test("fixture receipts pass every check", () => {
    for (const z of all) {
      const w = unwrap(walletFor(getPersona(z.recipient).lud16));
      expect(allPassed(checkReceipt(z.receipt, w.pubkey))).toBe(true);
    }
  });
  test("scenarios produce the expected check patterns", () => {
    const w = wallet();
    const results = Object.fromEntries(
      SCENARIOS.map((s) => [
        s,
        pattern(checkReceipt(unwrap(forgeReceipt(first(), s, w.secretKey)), w.pubkey)),
      ]),
    );
    expect(results).toEqual({
      honest: "11111",
      tampered: "01110",
      impostor: "10110",
      // The whole point: a lying wallet's receipt is indistinguishable from an honest one.
      liar: "11111",
    });
  });
  test("forged receipts are real, reproducible signatures", () => {
    const w = wallet();
    for (const s of ["impostor", "liar"] as const) {
      const a = unwrap(forgeReceipt(first(), s, w.secretKey));
      const b = unwrap(forgeReceipt(first(), s, w.secretKey));
      expect(a).toEqual(b);
      expect(verifyEvent(a).ok).toBe(true);
    }
    const liar = unwrap(forgeReceipt(first(), "liar", w.secretKey));
    expect(getTagValues(liar, "preimage")).toEqual([]);
  });
  test("forging fails loudly on a bad wallet key or invoice", () => {
    const badKey = forgeReceipt(first(), "liar", new Uint8Array(32));
    expect(badKey.ok ? "" : badKey.error.code).toBe("sign-failed");
    const noAmount = forgeReceipt(
      { ...first(), bolt11: "lnbc1qqqq" },
      "impostor",
      wallet().secretKey,
    );
    expect(noAmount.ok ? "" : noAmount.error.code).toBe("no-amount");
  });
  test("malformed receipts fail the dependent checks", () => {
    const w = wallet();
    const base: NostrEvent = first().receipt;
    const noDescription = { ...base, tags: base.tags.filter((t) => t[0] !== "description") };
    expect(pattern(checkReceipt(noDescription, w.pubkey))).toBe("01000");
    const wrongKind = { ...base, kind: 1 };
    expect(pattern(checkReceipt(wrongKind, w.pubkey))[0]).toBe("0");
    const notARequest = {
      ...base,
      tags: base.tags.map((t) =>
        t[0] === "description" ? ["description", JSON.stringify(base)] : t,
      ),
    } as NostrEvent;
    expect(pattern(checkReceipt(notARequest, w.pubkey))).toBe("01000");
    expect(RECEIPT_CHECKS).toHaveLength(5);
  });
  test("a request without an amount tag skips the amount match (NIP-57: 'if present')", () => {
    const w = wallet();
    const req = { ...first().request, tags: first().request.tags.filter((t) => t[0] !== "amount") };
    const receipt = {
      ...first().receipt,
      tags: first().receipt.tags.map((t) =>
        t[0] === "description" ? ["description", JSON.stringify(req)] : t,
      ),
    } as NostrEvent;
    // Editing the request breaks its id too, so "embedded" also fails.
    expect(pattern(checkReceipt(receipt, w.pubkey)).slice(2)).toBe("011");
  });
});
