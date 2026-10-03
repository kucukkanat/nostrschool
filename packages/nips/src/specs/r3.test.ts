/**
 * Spec tests for range r3 (NIPs 40–59), against the real validator and real signatures:
 * every example validates without errors (as a template, and signed with its persona's demo
 * key), every encrypted example decrypts with the demo keys to a plaintext that matches the
 * spec, embedded signed events verify, and deliberately broken variants produce the expected
 * diagnostics.
 */
import { describe, expect, test } from "bun:test";
import { getNipStrings } from "@nostrschool/i18n";
import {
  BECH32_CHARSET,
  computeEventId,
  deriveSecretKey,
  getPublicKey,
  hexToBytes,
  type NostrEvent,
  nip44ConversationKey,
  nip44Decrypt,
  sha256Hex,
  signEvent,
  type Tag,
  unwrap,
} from "@nostrschool/protocol";
import type { EventExample, EventShape, JsonValue, NipSpec, SpecPart } from "../spec.ts";
import { findSpecPart, specParts, specTextKeys } from "../spec.ts";
import {
  type ValidationCode,
  type ValidationReport,
  validateAgainstSpec,
  validateSchema,
} from "../validate.ts";
import { NIP_SPECS } from "./index.ts";

const R3 = [
  "40",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
] as const;
type R3Id = (typeof R3)[number];

const FIXTURE_NOW = 1735689600; // @nostrschool/fixtures FIXTURE_NOW (nips does not depend on fixtures)
const AUX = new Uint8Array(32);

const spec = (id: R3Id): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};

const secretOf = (persona: string): Uint8Array => deriveSecretKey(`nostrschool:persona:${persona}`);
const pubkeyOf = (persona: string): string => unwrap(getPublicKey(secretOf(persona)));

const toTags = (tags: readonly (readonly string[])[]): readonly Tag[] =>
  tags.map(([name = "", ...values]) => [name, ...values]);

const signExample = (x: EventExample): NostrEvent =>
  unwrap(
    signEvent(
      {
        kind: x.template.kind,
        created_at: x.template.created_at ?? FIXTURE_NOW,
        tags: toTags(x.template.tags),
        content: x.template.content,
      },
      secretOf(x.signer ?? "alice"),
      { auxRand: AUX },
    ),
  ).event;

const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));

const errors = (r: ValidationReport) => r.issues.filter((i) => i.severity === "error");
const codes = (r: ValidationReport): readonly ValidationCode[] => r.issues.map((i) => i.code);

/** Every example of a part as the value the editor would validate. */
const exampleValues = (
  p: SpecPart,
): readonly { readonly id: string; readonly value: unknown }[] => {
  switch (p.kind) {
    case "event":
      // The editor fills a missing created_at with FIXTURE_NOW.
      return p.part.examples.map((x) => ({
        id: x.id,
        value: { created_at: FIXTURE_NOW, ...x.template },
      }));
    case "message":
      return p.part.examples.map((x) => ({ id: x.id, value: x.message }));
    case "document":
      return p.part.examples.map((x) => ({ id: x.id, value: x.value }));
    case "http":
      return p.part.examples.map((x) => ({
        id: x.id,
        value: {
          url: x.url,
          headers: x.headers,
          ...(x.body === undefined ? {} : { body: x.body }),
        },
      }));
    case "encoding":
      return p.part.examples.map((x) => ({ id: x.id, value: x.inputs }));
  }
};

const eventPart = (id: R3Id, shape: string): EventShape => {
  const p = findSpecPart(spec(id), { kind: "event", id: shape });
  if (p?.kind !== "event") throw new Error(`NIP-${id} has no event shape ${shape}`);
  return p.part;
};

const example = (id: R3Id, shape: string, ex: string): EventExample => {
  const x = eventPart(id, shape).examples.find((e) => e.id === ex);
  if (x === undefined) throw new Error(`NIP-${id} ${shape} has no example ${ex}`);
  return x;
};

/** Validates an event template derived from an example, with `edit` applied to a copy. */
const checkEvent = (
  id: R3Id,
  shape: string,
  ex: string,
  edit: (t: { kind: number; created_at: number; tags: string[][]; content: string }) => void,
): ValidationReport => {
  const t = example(id, shape, ex).template;
  const copy = {
    kind: t.kind,
    created_at: t.created_at ?? FIXTURE_NOW,
    tags: t.tags.map((tag) => [...tag]),
    content: t.content,
  };
  edit(copy);
  return validateAgainstSpec(
    copy,
    { kind: "event", part: eventPart(id, shape) },
    { shapes: shapesOf(spec(id)) },
  );
};

const checkPart = (id: R3Id, p: SpecPart, value: unknown): ValidationReport => {
  const options = { shapes: shapesOf(spec(id)) };
  switch (p.kind) {
    case "event":
      return validateAgainstSpec(value, { kind: "event", part: p.part }, options);
    case "message":
      return validateAgainstSpec(value, { kind: "message", part: p.part }, options);
    case "document":
      return validateAgainstSpec(value, { kind: "document", part: p.part }, options);
    case "http":
      return validateAgainstSpec(value, { kind: "http", part: p.part }, options);
    case "encoding":
      return validateAgainstSpec(value, { kind: "encoding", part: p.part }, options);
  }
};

const partOf = (id: R3Id, kind: SpecPart["kind"], partId: string): SpecPart => {
  const p = findSpecPart(spec(id), { kind, id: partId });
  if (p === undefined) throw new Error(`NIP-${id} has no ${kind} ${partId}`);
  return p;
};

/** A message example with `edit` applied to a deep copy. */
const checkMessage = (id: R3Id, partId: string, ex: string, edit: (m: JsonValue[]) => void) => {
  const p = partOf(id, "message", partId);
  if (p.kind !== "message") throw new Error("not a message");
  const m = p.part.examples.find((x) => x.id === ex)?.message;
  const copy = JSON.parse(JSON.stringify(m)) as JsonValue[];
  edit(copy);
  return checkPart(id, p, copy);
};

const checkEncoding = (id: R3Id, partId: string, inputs: { readonly [k: string]: string }) =>
  checkPart(id, partOf(id, "encoding", partId), inputs);

// ── Structure and strings ──────────────────────────────────────────────────────────────────────

describe("r3 specs are complete", () => {
  test.each([...R3])(
    "NIP-%s: finished, with steps, related NIPs and examples in every part",
    (id) => {
      const s = spec(id);
      expect(s.todo).toBeUndefined();
      expect(s.howItWorks.length).toBeGreaterThanOrEqual(3);
      expect(s.howItWorks.length).toBeLessThanOrEqual(6);
      expect(s.related.length).toBeGreaterThan(0);
      for (const p of specParts(s))
        expect(exampleValues(p).length, `${p.kind}:${p.part.id}`).toBeGreaterThan(0);
    },
  );

  test.each([...R3])("NIP-%s: every text key has English and Spanish text, none unused", (id) => {
    const s = spec(id);
    const used = specTextKeys(s);
    const en = getNipStrings("en", id);
    const es = getNipStrings("es", id);
    expect(used.filter((k) => en?.text[k] === undefined)).toEqual([]);
    expect(Object.keys(en?.text ?? {}).filter((k) => !used.includes(k))).toEqual([]);
    expect(Object.keys(es?.text ?? {}).sort()).toEqual(Object.keys(en?.text ?? {}).sort());
    expect(en?.summary).not.toMatch(/unlock|dive in|seamless|journey/i);
    // Plain text only: the UI renders strings verbatim.
    for (const v of Object.values(en?.text ?? {})) expect(v).not.toContain("`");
  });

  test("variants match what each NIP defines", () => {
    expect(Object.fromEntries(R3.map((id) => [id, spec(id).variant]))).toEqual({
      "40": "event",
      "42": "message",
      "43": "event",
      "44": "encoding",
      "45": "message",
      "46": "event",
      "47": "event",
      "48": "event",
      "49": "encoding",
      "50": "message",
      "51": "event",
      "52": "event",
      "53": "event",
      "54": "event",
      "55": "process",
      "56": "event",
      "57": "event",
      "58": "event",
      "59": "event",
    });
  });

  test("NIP-55 process steps only use declared actors", () => {
    const process = spec("55").process;
    const actors = new Set(process?.actors.map((a) => a.id));
    for (const step of process?.steps ?? []) {
      expect(actors.has(step.from), step.id).toBe(true);
      if (step.to !== undefined) expect(actors.has(step.to), step.id).toBe(true);
    }
  });
});

// ── Examples validate ──────────────────────────────────────────────────────────────────────────

describe("every r3 example validates against its own spec", () => {
  const cases = R3.flatMap((id) =>
    specParts(spec(id)).flatMap((p) =>
      exampleValues(p).map((x) => ({ id, p, x, name: `NIP-${id} ${p.kind}:${p.part.id} ${x.id}` })),
    ),
  );

  test.each(cases)("$name", ({ id, p, x }) => {
    const report = checkPart(id, p, x.value);
    expect(errors(report)).toEqual([]);
    expect(report.valid).toBe(true);
  });

  const events = R3.flatMap((id) =>
    (spec(id).events ?? []).flatMap((shape) =>
      shape.examples.map((x) => ({ id, shape, x, name: `NIP-${id} ${shape.id} ${x.id}` })),
    ),
  );

  test.each(events)("$name, signed with its persona's demo key", ({ id, shape, x }) => {
    const signed = signExample(x);
    // A rumor has an id but no signature.
    const value =
      shape.signature === "none"
        ? { ...signed, sig: undefined, id: computeEventId(signed).id }
        : signed;
    const report = validateAgainstSpec(
      JSON.parse(JSON.stringify(value)),
      { kind: "event", part: shape },
      { shapes: shapesOf(spec(id)) },
    );
    expect(errors(report)).toEqual([]);
    expect(codes(report)).not.toContain("unsigned");
    // Only the deliberately deprecated examples may warn.
    const warnings = report.issues.filter((i) => i.severity === "warning").map((i) => i.code);
    expect(warnings.filter((c) => c !== "deprecated")).toEqual([]);
  });
});

// ── Encrypted examples are real ────────────────────────────────────────────────────────────────

describe("encrypted examples decrypt with the demo keys to spec-conforming plaintext", () => {
  const encrypted = R3.flatMap((id) =>
    (spec(id).events ?? []).flatMap((shape) =>
      shape.content.format === "encrypted"
        ? shape.examples.map((x) => ({ id, shape, x, name: `NIP-${id} ${shape.id} ${x.id}` }))
        : [],
    ),
  );

  test("there is something to check", () => expect(encrypted.length).toBeGreaterThanOrEqual(10));

  test.each(encrypted)("$name", ({ id, shape, x }) => {
    const signer = x.signer ?? "alice";
    // Lists encrypt to the author themselves, a seal to its (deliberately untagged) recipient
    // Bob, everything else to the p-tagged counterpart.
    const pTag = x.template.tags.find((t) => t[0] === "p")?.[1];
    const counterpart =
      shape.id === "seal"
        ? pubkeyOf("bob")
        : id === "51" || pTag === undefined
          ? pubkeyOf(signer)
          : pTag;
    const key = unwrap(nip44ConversationKey(secretOf(signer), counterpart));
    const plaintext = unwrap(nip44Decrypt(x.template.content, key)).plaintext;
    const inner = shape.content.format === "encrypted" ? shape.content.plaintext : undefined;
    if (inner?.format !== "json") throw new Error("r3 encrypted examples carry JSON");
    const issues = validateSchema(JSON.parse(plaintext), inner.schema, [], {
      shapes: shapesOf(spec(id)),
    });
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  test("NIP-59: wrap → seal → rumor opens layer by layer as Bob", () => {
    const wrap = example("59", "gift-wrap", "to-bob");
    const sealEx = example("59", "seal", "alice-to-bob");
    const rumorEx = example("59", "rumor", "party");
    const bob = secretOf("bob");
    const sealJson = unwrap(
      nip44Decrypt(wrap.template.content, unwrap(nip44ConversationKey(bob, pubkeyOf("grace")))),
    ).plaintext;
    const seal = JSON.parse(sealJson) as NostrEvent;
    expect(seal).toEqual(signExample(sealEx));
    const rumor = JSON.parse(
      unwrap(nip44Decrypt(seal.content, unwrap(nip44ConversationKey(bob, seal.pubkey)))).plaintext,
    ) as NostrEvent;
    expect(rumor.pubkey).toBe(seal.pubkey);
    expect(rumor.content).toBe(rumorEx.template.content);
    expect(rumor.created_at).toBe(FIXTURE_NOW);
    expect("sig" in rumor).toBe(false);
  });

  test("NIP-47: the response's e tag is the id of the pay request as Bob signs it", () => {
    const request = signExample(example("47", "request", "pay-invoice"));
    const response = example("47", "response", "paid").template;
    expect(response.tags.find((t) => t[0] === "e")?.[1]).toBe(request.id);
  });

  test("NIP-57: the receipt's bolt11 is a checksummed invoice committing to the request", () => {
    const tags = example("57", "zap-receipt", "receipt").template.tags;
    const tag = (name: string) => tags.find((t) => t[0] === name)?.[1] ?? "";
    const invoice = tag("bolt11");
    const sep = invoice.lastIndexOf("1");
    const hrp = invoice.slice(0, sep);
    const words = [...invoice.slice(sep + 1)].map((c) => BECH32_CHARSET.indexOf(c));
    // BIP-173 checksum: polymod over expanded hrp + data must equal 1.
    const polymod = (values: readonly number[]) =>
      values.reduce((chk, v) => {
        const top = chk >>> 25;
        const next = ((chk & 0x1ffffff) << 5) ^ v;
        return [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3].reduce(
          (acc, gen, i) => ((top >>> i) & 1 ? acc ^ gen : acc),
          next,
        );
      }, 1);
    const codes = [...hrp].map((c) => c.charCodeAt(0));
    expect(polymod([...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31), ...words])).toBe(
      1,
    );
    // Tagged fields sit between the 7-word timestamp and the 104-word signature + 6-word checksum.
    const data = words.slice(7, -110);
    const toHex = (ws: readonly number[]) =>
      (
        ws
          .map((w) => w.toString(2).padStart(5, "0"))
          .join("")
          .match(/.{8}/g) ?? []
      )
        .map((b) => Number.parseInt(b, 2).toString(16).padStart(2, "0"))
        .join("");
    const fields = new Map<string, string>();
    for (let i = 0; i < data.length; ) {
      const len = (data[i + 1] ?? 0) * 32 + (data[i + 2] ?? 0);
      fields.set(BECH32_CHARSET[data[i] ?? 0] ?? "", toHex(data.slice(i + 3, i + 3 + len)));
      i += 3 + len;
    }
    // 21000n = 21000 * 100 msats, the zap request's amount tag.
    expect(hrp).toBe("lnbc21000n");
    const request = JSON.parse(tag("description")) as NostrEvent;
    expect(request.tags.find((t) => t[0] === "amount")?.[1]).toBe("2100000");
    expect(fields.get("h")).toBe(sha256Hex(tag("description")));
    expect(fields.get("p")).toBe(sha256Hex(unwrap(hexToBytes(tag("preimage"), 32))));
  });

  test("NIP-58: profile badges point at the award as Alice signs it", () => {
    const award = signExample(example("58", "award", "bob-and-grace"));
    const shown = example("58", "profile-badges", "bob-shows").template;
    expect(shown.tags.find((t) => t[0] === "e")?.[1]).toBe(award.id);
  });

  test("NIP-57: the receipt embeds a correctly signed zap request matching its tags", () => {
    const receipt = example("57", "zap-receipt", "receipt").template;
    const description = receipt.tags.find((t) => t[0] === "description")?.[1] ?? "";
    const request = JSON.parse(description) as NostrEvent;
    expect(request.kind).toBe(9734);
    expect(request.pubkey).toBe(pubkeyOf("alice"));
    expect(receipt.tags.find((t) => t[0] === "P")?.[1]).toBe(request.pubkey);
    expect(receipt.tags.find((t) => t[0] === "p")?.[1]).toBe(
      request.tags.find((t) => t[0] === "p")?.[1],
    );
  });
});

// ── Broken variants produce the expected diagnostics ──────────────────────────────────────────

const setTag = (tags: string[][], name: string, index: number, value: string) => {
  const tag = tags.find((t) => t[0] === name);
  if (tag === undefined) throw new Error(`no ${name} tag`);
  tag[index] = value;
};
const dropTag = (tags: string[][], name: string) => {
  const i = tags.findIndex((t) => t[0] === name);
  if (i < 0) throw new Error(`no ${name} tag`);
  tags.splice(i, 1);
};

describe("broken variants", () => {
  test("NIP-40: expiration must be present and in seconds", () => {
    expect(
      codes(checkEvent("40", "expiring", "announcement", (t) => dropTag(t.tags, "expiration"))),
    ).toContain("missing-tag");
    expect(
      codes(
        checkEvent("40", "expiring", "announcement", (t) =>
          setTag(t.tags, "expiration", 1, "1735776000000"),
        ),
      ),
    ).toContain("invalid-timestamp");
  });

  test("NIP-42: challenge tag, message type and signature are checked", () => {
    expect(codes(checkEvent("42", "auth", "alice", (t) => dropTag(t.tags, "challenge")))).toContain(
      "missing-tag",
    );
    expect(
      codes(
        checkEvent("42", "auth", "alice", (t) => setTag(t.tags, "relay", 1, "https://x.example")),
      ),
    ).toContain("invalid-relay-url");
    const tampered = checkMessage("42", "auth-event", "signed", (m) => {
      const ev = m[1] as { [k: string]: JsonValue };
      ev["sig"] = `${"0".repeat(127)}1`;
    });
    expect(codes(tampered)).toContain("bad-signature");
    expect(
      codes(checkMessage("42", "auth-challenge", "challenge", (m) => (m[0] = "CHALLENGE"))),
    ).toContain("wrong-message-type");
    expect(codes(checkMessage("42", "closed", "dms-need-auth", (m) => (m[2] = "nope")))).toContain(
      "pattern-mismatch",
    );
  });

  test("NIP-43: protected tag and role colour range", () => {
    expect(codes(checkEvent("43", "add-user", "add-grace", (t) => dropTag(t.tags, "-")))).toContain(
      "missing-tag",
    );
    expect(
      codes(checkEvent("43", "role", "moderator", (t) => setTag(t.tags, "color", 1, "400"))),
    ).toContain("out-of-range");
    expect(
      codes(checkEvent("43", "join-request", "grace-joins", (t) => dropTag(t.tags, "claim"))),
    ).toContain("missing-tag");
  });

  test("NIP-44: encoding inputs are typed", () => {
    expect(codes(checkEncoding("44", "payload-v2", { sender: "xyz", recipient: "xyz" }))).toEqual(
      expect.arrayContaining(["invalid-pubkey", "missing-field"]),
    );
  });

  test("NIP-45: counts are non-negative integers and hll is 256 bytes", () => {
    const count = checkMessage("45", "count-response", "exact", (m) => {
      m[2] = { count: -1 };
    });
    expect(codes(count)).toContain("out-of-range");
    const hll = checkMessage("45", "count-response", "hll", (m) => {
      m[2] = { count: 1, hll: "00ff" };
    });
    expect(codes(hll)).toContain("invalid-hex");
  });

  test("NIP-46: content must be NIP-44 ciphertext", () => {
    const r = checkEvent("46", "request", "sign-event", (t) => {
      t.content = '{"id":"1","method":"ping","params":[]}';
    });
    expect(codes(r)).toContain("content-not-encrypted");
    expect(codes(checkEvent("46", "response", "ack", (t) => dropTag(t.tags, "p")))).toContain(
      "missing-tag",
    );
  });

  test("NIP-47: encryption scheme and info content", () => {
    expect(
      codes(
        checkEvent("47", "request", "pay-invoice", (t) => setTag(t.tags, "encryption", 1, "aes")),
      ),
    ).toContain("invalid-enum");
    expect(codes(checkEvent("47", "info", "wallet", (t) => (t.content = "")))).toContain(
      "content-required",
    );
  });

  test("NIP-48: unknown protocols only warn", () => {
    const r = checkEvent("48", "bridged", "activitypub", (t) => setTag(t.tags, "proxy", 2, "nntp"));
    expect(codes(r)).toContain("invalid-enum");
    expect(r.valid).toBe(true);
    expect(
      codes(checkEvent("48", "bridged", "activitypub", (t) => dropTag(t.tags, "proxy"))),
    ).toContain("missing-tag");
  });

  test("NIP-49: key security byte and cost are checked", () => {
    const r = checkEncoding("49", "ncryptsec", {
      "secret-key": "abc",
      password: "nostr",
      "log-n": "sixteen",
      "key-security": "3",
    });
    expect(codes(r)).toEqual(
      expect.arrayContaining(["invalid-hex", "invalid-number", "invalid-enum"]),
    );
  });

  test("NIP-50: filters are still NIP-01 filters", () => {
    const r = checkMessage("50", "search-req", "plain", (m) => {
      m[2] = { search: "nostr", limit: -5 };
    });
    expect(codes(r)).toContain("out-of-range");
  });

  test("NIP-51: words are lowercase, sets need d, legacy lists are flagged", () => {
    expect(
      codes(
        checkEvent("51", "mute-list", "public-and-private", (t) =>
          setTag(t.tags, "word", 1, "GIVEAWAY"),
        ),
      ),
    ).toContain("pattern-mismatch");
    expect(codes(checkEvent("51", "sets", "follow-set", (t) => dropTag(t.tags, "d")))).toContain(
      "missing-tag",
    );
    const legacy = checkEvent("51", "legacy-lists", "old-bookmarks", () => undefined);
    expect(codes(legacy)).toContain("deprecated");
    expect(legacy.valid).toBe(true);
  });

  test("NIP-52: dates, statuses and required tags", () => {
    expect(
      codes(
        checkEvent("52", "date-based", "vacation", (t) => setTag(t.tags, "start", 1, "2025/02/10")),
      ),
    ).toContain("pattern-mismatch");
    expect(
      codes(checkEvent("52", "rsvp", "bob-accepts", (t) => setTag(t.tags, "status", 1, "maybe"))),
    ).toContain("invalid-enum");
    expect(codes(checkEvent("52", "time-based", "meetup", (t) => dropTag(t.tags, "D")))).toContain(
      "missing-tag",
    );
  });

  test("NIP-53: chat needs the activity, hand flag is 0 or 1", () => {
    expect(codes(checkEvent("53", "chat", "question", (t) => dropTag(t.tags, "a")))).toContain(
      "missing-tag",
    );
    expect(
      codes(checkEvent("53", "presence", "hand-up", (t) => setTag(t.tags, "hand", 1, "2"))),
    ).toContain("invalid-enum");
    expect(
      codes(checkEvent("53", "chat", "question", (t) => setTag(t.tags, "a", 1, "30023:abc:x"))),
    ).toContain("invalid-addr");
  });

  test("NIP-54: d tags are normalised, merge requests need a source", () => {
    expect(
      codes(checkEvent("54", "article", "relay", (t) => setTag(t.tags, "d", 1, "Wiki Article"))),
    ).toContain("pattern-mismatch");
    const noSource = checkEvent("54", "merge-request", "bob-to-alice", (t) => {
      t.tags = t.tags.filter((tag) => tag[3] !== "source");
    });
    expect(codes(noSource)).toContain("missing-tag");
  });

  test("NIP-56: report types are a closed list", () => {
    expect(
      codes(checkEvent("56", "report", "spam-note", (t) => setTag(t.tags, "e", 2, "rude"))),
    ).toContain("invalid-enum");
    expect(codes(checkEvent("56", "report", "spam-note", (t) => dropTag(t.tags, "p")))).toContain(
      "missing-tag",
    );
  });

  test("NIP-57: one recipient, valid lnurl, untampered description", () => {
    expect(
      codes(
        checkEvent("57", "zap-request", "note-zap", (t) => {
          t.tags.push(["p", pubkeyOf("bob")]);
        }),
      ),
    ).toContain("duplicate-tag");
    expect(
      codes(
        checkEvent("57", "zap-request", "note-zap", (t) => setTag(t.tags, "lnurl", 1, "lnurl1abc")),
      ),
    ).toContain("invalid-bech32");
    const tampered = checkEvent("57", "zap-receipt", "receipt", (t) => {
      const tag = t.tags.find((x) => x[0] === "description");
      if (tag !== undefined) tag[1] = (tag[1] ?? "").replace("Love the ostrich!", "Love the emu!");
    });
    expect(codes(tampered)).toContain("id-mismatch");
    expect(
      codes(
        checkEvent("57", "zap-receipt", "receipt", (t) =>
          setTag(t.tags, "bolt11", 1, "lnbc21000n1puxwn89p777k06hrw33k6jxfrmwydd6h90xravlene785"),
        ),
      ),
    ).toContain("pattern-mismatch");
  });

  test("NIP-58: awards need recipients, image sizes are WxH", () => {
    expect(
      codes(
        checkEvent(
          "58",
          "award",
          "bob-and-grace",
          (t) => (t.tags = t.tags.filter((x) => x[0] !== "p")),
        ),
      ),
    ).toContain("missing-tag");
    expect(
      codes(
        checkEvent("58", "definition", "first-relay", (t) => setTag(t.tags, "image", 2, "big")),
      ),
    ).toContain("pattern-mismatch");
    expect(codes(checkEvent("58", "legacy-profile-badges", "legacy", () => undefined))).toContain(
      "deprecated",
    );
  });

  test("NIP-59: seals have no tags, rumors no signature, wraps real ciphertext", () => {
    expect(
      codes(checkEvent("59", "seal", "alice-to-bob", (t) => t.tags.push(["p", pubkeyOf("bob")]))),
    ).toContain("unknown-tag");
    // NIP-17 disappearing messages: the seal SHOULD repeat the wrap's expiration (only that tag).
    const expiring = checkEvent("59", "seal", "alice-to-bob", (t) =>
      t.tags.push(["expiration", String(FIXTURE_NOW + 86400)]),
    );
    expect(expiring.issues.filter((i) => i.severity !== "info")).toEqual([]);
    expect(
      codes(checkEvent("59", "seal", "alice-to-bob", (t) => t.tags.push(["expiration", "soon"]))),
    ).toContain("invalid-timestamp");
    const rumor = validateAgainstSpec(
      { ...signExample(example("59", "rumor", "party")) },
      { kind: "event", part: eventPart("59", "rumor") },
    );
    expect(codes(rumor)).toContain("signature-not-allowed");
    expect(codes(checkEvent("59", "gift-wrap", "to-bob", (t) => (t.content = "")))).toContain(
      "content-not-encrypted",
    );
  });
});
