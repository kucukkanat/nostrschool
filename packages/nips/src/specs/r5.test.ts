// Owner: spec author r5 (NIPs 80–99). Spec-specific checks on top of specs.test.ts and
// examples.test.ts: every example is clean (no errors AND no warnings), event examples still
// validate once signed by their fixture persona, and deliberately broken values are caught.
import { describe, expect, test } from "bun:test";
import {
  deriveSecretKey,
  type EventTemplate,
  getPublicKey,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";
import { defaultPartValue } from "../build.ts";
import type { EventShape, JsonValue, NipSpec, SpecPart, SpecPartKey } from "../spec.ts";
import { findSpecPart, specParts } from "../spec.ts";
import { type ValidationSeverity, validateAgainstSpec } from "../validate.ts";
import { NIP_SPECS } from "./index.ts";

const R5 = ["84", "85", "86", "87", "88", "89", "90", "92", "94", "96", "98", "99"] as const;
const FIXTURE_NOW = 1735689600;

const spec = (id: string): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};

const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));

const partOf = (s: NipSpec, key: SpecPartKey): SpecPart => {
  const p = findSpecPart(s, key);
  if (p === undefined) throw new Error(`NIP-${s.nip}: no part ${key.kind}:${key.id}`);
  return p;
};

const exampleIds = (p: SpecPart): readonly string[] =>
  p.part.examples.map((e: { readonly id: string }) => e.id);

const value = (p: SpecPart, exampleId?: string): JsonValue =>
  defaultPartValue(p, {
    createdAt: FIXTURE_NOW,
    ...(exampleId === undefined ? {} : { exampleId }),
  });

const issuesOf = (nip: string, key: SpecPartKey, v: unknown) => {
  const s = spec(nip);
  return validateAgainstSpec(v, partOf(s, key), { shapes: shapesOf(s) }).issues;
};

const codes = (nip: string, key: SpecPartKey, v: unknown, severity: ValidationSeverity = "error") =>
  issuesOf(nip, key, v)
    .filter((i) => i.severity === severity)
    .map((i) => i.code);

// ── Value surgery for the broken variants (pure; examples are never mutated) ──────────────────

type Tags = readonly Tag[];
type Ev = EventTemplate;

const asEvent = (v: JsonValue): Ev => v as unknown as Ev;

const example = (nip: string, id: string, exampleId?: string): Ev =>
  asEvent(value(partOf(spec(nip), { kind: "event", id }), exampleId));

const setTag = (ev: Ev, i: number, tag: Tag): Ev => ({
  ...ev,
  tags: ev.tags.map((t, k) => (k === i ? tag : t)),
});
const dropTag = (ev: Ev, name: string): Ev => ({
  ...ev,
  tags: ev.tags.filter((t) => t[0] !== name),
});
const addTag = (ev: Ev, tag: Tag): Ev => ({ ...ev, tags: [...ev.tags, tag] });

const ev = (id: string): SpecPartKey => ({ kind: "event", id });
const http = (id: string): SpecPartKey => ({ kind: "http", id });

const httpExample = (nip: string, id: string, exampleId?: string) =>
  value(partOf(spec(nip), http(id)), exampleId) as unknown as {
    readonly url: string;
    readonly headers: { readonly [k: string]: string };
    readonly body?: JsonValue;
  };

/** The kind 27235 event inside a "Nostr <base64>" Authorization header. */
const authEventOf = (header: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(header.replace(/^Nostr /, ""), "base64").toString("utf8"));
const toHeader = (event: unknown): string =>
  `Nostr ${Buffer.from(JSON.stringify(event)).toString("base64")}`;

const PERSONA_PUBKEYS: { readonly [id: string]: string } = {
  alice: "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
  bob: "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183",
  carol: "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4",
  dave: "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148",
  erin: "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb",
  frank: "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8",
  grace: "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812",
};
/** Same derivation as @nostrschool/fixtures (not a dependency of this package). */
const personaKey = (persona: string): Uint8Array =>
  deriveSecretKey(`nostrschool:persona:${persona}`);

// ── Every example is clean ─────────────────────────────────────────────────────────────────────

describe("r5 examples are clean", () => {
  for (const nip of R5)
    test(`NIP-${nip}: no errors or warnings in any example`, () => {
      const s = spec(nip);
      expect(s.todo).toBeUndefined();
      for (const p of specParts(s))
        for (const id of exampleIds(p)) {
          const bad = validateAgainstSpec(value(p, id), p, { shapes: shapesOf(s) })
            .issues.filter((i) => i.severity !== "info")
            .map((i) => `${i.severity} ${i.code} ${JSON.stringify(i.path)}`);
          expect(bad, `${p.kind}:${p.part.id} "${id}"`).toEqual([]);
        }
    });

  test("fixture persona keys match the pubkeys used in the specs", () => {
    for (const [persona, pubkey] of Object.entries(PERSONA_PUBKEYS)) {
      const derived = getPublicKey(personaKey(persona));
      expect(derived.ok && derived.value).toBe(pubkey);
    }
  });

  for (const nip of R5)
    test(`NIP-${nip}: event examples validate once signed by their persona`, () => {
      const s = spec(nip);
      for (const shape of s.events ?? [])
        for (const x of shape.examples) {
          const template = asEvent(value({ kind: "event", part: shape }, x.id));
          const signed = signEvent(template, personaKey(x.signer ?? "alice"));
          expect(signed.ok).toBe(true);
          if (!signed.ok) continue;
          const issues = validateAgainstSpec(
            signed.value.event,
            { kind: "event", part: shape },
            { shapes: shapesOf(s) },
          ).issues.filter((i) => i.severity !== "info");
          expect(issues, `${shape.id} "${x.id}"`).toEqual([]);
        }
    });

  test("every r5 spec explains itself in 3–6 steps and lists related NIPs", () => {
    for (const nip of R5) {
      const s = spec(nip);
      expect(s.howItWorks.length, `NIP-${nip}`).toBeGreaterThanOrEqual(3);
      expect(s.howItWorks.length, `NIP-${nip}`).toBeLessThanOrEqual(6);
      expect(s.related.length, `NIP-${nip}`).toBeGreaterThan(0);
    }
  });
});

// ── Unrecommended NIPs point at what to use instead ────────────────────────────────────────────

describe("unrecommended NIPs", () => {
  test("NIP-96 is replaced by NIP-B7 (Blossom) and says so first", () => {
    const s = spec("96");
    expect(s.related).toContainEqual(
      expect.objectContaining({ nip: "B7", relation: "replaced-by" }),
    );
    expect(s.howItWorks[0]?.id).toBe("status");
  });

  test("NIP-90 opens its walkthrough with the unrecommended notice", () => {
    expect(spec("90").howItWorks[0]?.id).toBe("status");
  });
});

// ── Broken variants are caught ────────────────────────────────────────────────────────────────

describe("NIP-84 highlights", () => {
  const base = example("84", "highlight", "nostr-article");
  test("a broken address and an unknown r marker", () => {
    expect(codes("84", ev("highlight"), setTag(base, 0, ["a", "not-an-address"]))).toContain(
      "invalid-addr",
    );
    expect(
      codes("84", ev("highlight"), addTag(base, ["r", "https://x.example", "sauce"])),
    ).toContain("invalid-enum");
  });
  test("wrong kind", () => {
    expect(codes("84", ev("highlight"), { ...base, kind: 1 })).toContain("wrong-kind");
  });
});

describe("NIP-85 trusted assertions", () => {
  const base = example("85", "user", "rank-alice");
  test("rank must be 0–100 and the subject a pubkey", () => {
    expect(codes("85", ev("user"), setTag(base, 1, ["rank", "101"]))).toContain("out-of-range");
    expect(codes("85", ev("user"), setTag(base, 0, ["d", "alice"]))).toContain("invalid-pubkey");
    expect(codes("85", ev("user"), dropTag(base, "d"))).toContain("missing-tag");
  });
  test("content must stay empty", () => {
    expect(codes("85", ev("user"), { ...base, content: "hi" }, "warning")).toContain(
      "content-not-empty",
    );
  });
  test("a provider list entry with an unknown result is flagged", () => {
    const list = example("85", "providers");
    const key = PERSONA_PUBKEYS["dave"] ?? "";
    expect(
      codes(
        "85",
        ev("providers"),
        addTag(list, ["30382:bogus", key, "wss://r.example"]),
        "warning",
      ),
    ).toContain("unknown-tag");
    expect(
      codes("85", ev("providers"), addTag(list, ["30382:rank", "nope", "wss://r.example"])),
    ).toContain("invalid-pubkey");
  });
});

describe("NIP-86 relay management", () => {
  const base = httpExample("86", "rpc", "banpubkey");
  test("missing Authorization and a wrong Content-Type", () => {
    expect(
      codes("86", http("rpc"), {
        ...base,
        headers: { "Content-Type": "application/nostr+json+rpc" },
      }),
    ).toContain("missing-field");
    expect(
      codes("86", http("rpc"), {
        ...base,
        headers: { ...base.headers, "Content-Type": "text/plain" },
      }),
    ).toContain("invalid-enum");
  });
  test("a tampered auth event fails its id check", () => {
    const event = authEventOf(base.headers["Authorization"] ?? "");
    const tampered = {
      ...event,
      tags: [
        ["u", "https://evil.example/"],
        ["method", "POST"],
        ["payload", "00".repeat(32)],
      ],
    };
    expect(
      codes("86", http("rpc"), {
        ...base,
        headers: { ...base.headers, Authorization: toHeader(tampered) },
      }),
    ).toContain("id-mismatch");
  });
  test("an unknown method is a warning, a missing params is an error", () => {
    expect(
      codes("86", http("rpc"), { ...base, body: { method: "nuke", params: [] } }, "warning"),
    ).toContain("invalid-enum");
    expect(codes("86", http("rpc"), { ...base, body: { method: "banpubkey" } })).toContain(
      "missing-field",
    );
  });
});

describe("NIP-87 mint discovery", () => {
  test("recommendation k must name a mint kind", () => {
    const base = example("87", "recommendation", "recommend-cashu");
    expect(codes("87", ev("recommendation"), setTag(base, 0, ["k", "1"]))).toContain(
      "kind-not-allowed",
    );
  });
  test("network, nuts and invite codes are checked", () => {
    const cashu = example("87", "cashu-mint");
    expect(codes("87", ev("cashu-mint"), setTag(cashu, 3, ["n", "moon"]))).toContain(
      "invalid-enum",
    );
    expect(codes("87", ev("cashu-mint"), setTag(cashu, 2, ["nuts", "a,b"]))).toContain(
      "pattern-mismatch",
    );
    const fed = example("87", "fedimint");
    expect(codes("87", ev("fedimint"), setTag(fed, 1, ["u", "https://not-an-invite"]))).toContain(
      "pattern-mismatch",
    );
  });
});

describe("NIP-88 polls", () => {
  const poll = example("88", "poll", "single");
  test("a poll needs options and a valid polltype/endsAt", () => {
    expect(codes("88", ev("poll"), dropTag(poll, "option"))).toContain("missing-tag");
    expect(codes("88", ev("poll"), setTag(poll, 4, ["polltype", "ranked"]))).toContain(
      "invalid-enum",
    );
    expect(codes("88", ev("poll"), setTag(poll, 5, ["endsAt", "soon"]))).toContain(
      "invalid-timestamp",
    );
    expect(codes("88", ev("poll"), { ...poll, content: "" })).toContain("content-required");
  });
  test("a vote must point at a poll", () => {
    const vote = example("88", "response", "vote-yay");
    expect(codes("88", ev("response"), dropTag(vote, "e"))).toContain("missing-tag");
    expect(codes("88", ev("response"), setTag(vote, 0, ["e", "xyz"]))).toContain(
      "invalid-event-id",
    );
  });
});

describe("NIP-89 app handlers", () => {
  test("handler kinds and recommendation addresses are checked", () => {
    const handler = example("89", "handler");
    expect(codes("89", ev("handler"), setTag(handler, 1, ["k", "abc"]))).toContain("invalid-kind");
    const rec = example("89", "recommendation");
    const pk = PERSONA_PUBKEYS["frank"] ?? "";
    expect(codes("89", ev("recommendation"), setTag(rec, 1, ["a", `1:${pk}:x`]))).toContain(
      "kind-not-allowed",
    );
    expect(codes("89", ev("handler"), setTag(handler, 2, ["web", "ftp://x/<bech32>"]))).toContain(
      "pattern-mismatch",
    );
  });
});

describe("NIP-90 data vending machines", () => {
  test("kind ranges, feedback statuses and the embedded request", () => {
    const req = example("90", "job-request", "translate");
    expect(codes("90", ev("job-request"), { ...req, kind: 4999 })).toContain("wrong-kind");
    expect(codes("90", ev("job-request"), setTag(req, 0, ["i", "x", "telepathy"]))).toContain(
      "invalid-enum",
    );
    const fb = example("90", "job-feedback");
    expect(codes("90", ev("job-feedback"), setTag(fb, 0, ["status", "done"]))).toContain(
      "invalid-enum",
    );
    const result = example("90", "job-result");
    expect(codes("90", ev("job-result"), setTag(result, 0, ["request", "{not json"]))).toContain(
      "invalid-json-string",
    );
    const embedded = JSON.parse(result.tags[0]?.[1] ?? "{}") as Record<string, unknown>;
    expect(
      codes(
        "90",
        ev("job-result"),
        setTag(result, 0, ["request", JSON.stringify({ ...embedded, content: "x" })]),
      ),
    ).toContain("id-mismatch");
  });
  test("the result example embeds the request example, id included", () => {
    const req = example("90", "job-request", "translate");
    const result = example("90", "job-result");
    const embedded = JSON.parse(result.tags[0]?.[1] ?? "{}") as Ev & { readonly id: string };
    expect({ kind: embedded.kind, tags: embedded.tags, created_at: embedded.created_at }).toEqual({
      kind: req.kind,
      tags: req.tags,
      created_at: req.created_at,
    });
    expect(result.tags[1]?.[1]).toBe(embedded.id);
    expect(result.kind).toBe(req.kind + 1000);
  });
});

describe("NIP-92 imeta", () => {
  test("imeta must start with a url entry and content is required", () => {
    const base = example("92", "attachment", "photo");
    expect(codes("92", ev("attachment"), setTag(base, 0, ["imeta", "m image/png"]))).toContain(
      "pattern-mismatch",
    );
    expect(codes("92", ev("attachment"), { ...base, content: "" })).toContain("content-required");
  });
});

describe("NIP-94 file metadata", () => {
  const base = example("94", "file", "image");
  test("hashes, url, dimensions and magnet links are checked", () => {
    expect(codes("94", ev("file"), setTag(base, 2, ["x", "abc"]))).toContain("invalid-hex");
    expect(codes("94", ev("file"), dropTag(base, "url"))).toContain("missing-tag");
    expect(codes("94", ev("file"), setTag(base, 5, ["dim", "big"]))).toContain("pattern-mismatch");
    const torrent = example("94", "file", "torrent");
    expect(codes("94", ev("file"), setTag(torrent, 4, ["magnet", "https://x.example"]))).toContain(
      "invalid-url",
    );
  });
});

describe("NIP-96 file storage", () => {
  test("server info needs api_url; uploads need auth", () => {
    const doc: SpecPartKey = { kind: "document", id: "server-info" };
    expect(codes("96", doc, { download_url: "https://x.example" })).toContain("missing-field");
    expect(
      codes("96", doc, {
        api_url: "https://x.example",
        plans: { free: { file_expiration: "forever" } },
      }),
    ).toContain("wrong-type");
    const upload = httpExample("96", "upload");
    expect(codes("96", http("upload"), { ...upload, headers: {} })).toContain("missing-field");
    expect(
      codes("96", http("upload"), { ...upload, headers: { Authorization: "Nostr %%%" } }),
    ).toContain("invalid-base64");
  });
  test("the upload auth event carries the file hash used for download", () => {
    const upload = httpExample("96", "upload");
    const download = httpExample("96", "download");
    const auth = authEventOf(upload.headers["Authorization"] ?? "") as { readonly tags: Tags };
    const payload = auth.tags.find((t) => t[0] === "payload")?.[1] ?? "";
    expect(download.url).toContain(payload);
  });
});

describe("NIP-98 HTTP auth", () => {
  test("auth events need u and method, and headers must carry a valid event", () => {
    const auth = example("98", "auth", "auth-get");
    expect(codes("98", ev("auth"), dropTag(auth, "u"))).toContain("missing-tag");
    expect(codes("98", ev("auth"), setTag(auth, 1, ["method", "get it"]), "warning")).toContain(
      "invalid-enum",
    );
    const req = httpExample("98", "request", "get");
    const event = authEventOf(req.headers["Authorization"] ?? "");
    expect(
      codes("98", http("request"), {
        ...req,
        headers: { Authorization: toHeader({ ...event, created_at: 1 }) },
      }),
    ).toContain("id-mismatch");
  });
  test("each header's u and method match its own request", () => {
    for (const id of ["get", "post"]) {
      const req = httpExample("98", "request", id);
      const event = authEventOf(req.headers["Authorization"] ?? "") as { readonly tags: Tags };
      expect(event.tags.find((t) => t[0] === "u")?.[1]).toBe(req.url);
      expect(event.tags.find((t) => t[0] === "method")?.[1]).toBe(
        req.body === undefined ? "GET" : "POST",
      );
    }
  });
});

describe("NIP-99 classified listings", () => {
  const base = example("99", "listing", "camera");
  test("price, kind and duplicate d tags", () => {
    expect(codes("99", ev("listing"), setTag(base, 5, ["price", "cheap", "EUR"]))).toContain(
      "invalid-number",
    );
    expect(codes("99", ev("listing"), { ...base, kind: 30404 })).toContain("wrong-kind");
    expect(codes("99", ev("listing"), addTag(base, ["d", "again"]))).toContain("duplicate-tag");
  });
  test("drafts use the same shape as kind 30403", () => {
    expect(codes("99", ev("listing"), { ...base, kind: 30403 })).toEqual([]);
  });
});
