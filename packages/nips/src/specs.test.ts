import { describe, expect, test } from "bun:test";
import { getDictionary, getNipStrings, LOCALES } from "@nostrschool/i18n";
import { NIP_CORPUS } from "./corpus.ts";
import type { NipSpec } from "./spec.ts";
import {
  findSpecPart,
  kindSelected,
  NIP_SPEC_VARIANTS,
  specParts,
  specTextKeys,
  tagSpecId,
} from "./spec.ts";
import { getSpec, listNips, NIP_SPECS } from "./specs/index.ts";
import { VALIDATION_CODES } from "./validate.ts";

const collection = (spec: NipSpec): readonly unknown[] =>
  spec.variant === "event"
    ? spec.events
    : spec.variant === "message"
      ? spec.messages
      : spec.variant === "document"
        ? spec.documents
        : spec.variant === "encoding"
          ? spec.encodings
          : spec.variant === "http"
            ? spec.http
            : spec.process.steps;

describe("every NIP has a spec", () => {
  test("one spec per corpus id, keyed and labelled consistently", () => {
    const ids = NIP_CORPUS.nips.map((n) => n.id);
    expect(Object.keys(NIP_SPECS).sort()).toEqual([...ids].sort());
    for (const [id, spec] of Object.entries(NIP_SPECS)) {
      expect(spec.nip).toBe(id);
      expect(NIP_SPEC_VARIANTS).toContain(spec.variant);
    }
    expect(getSpec("57")?.nip).toBe("57");
    expect(getSpec("ZZ")).toBeUndefined();
  });

  test("specs are plain JSON (they become island props and URL state)", () => {
    for (const spec of Object.values(NIP_SPECS))
      expect(JSON.parse(JSON.stringify(spec))).toEqual(spec);
  });

  test("finished specs fill their variant and explain how the NIP works", () => {
    for (const spec of Object.values(NIP_SPECS).filter((s) => s.todo !== true)) {
      expect(collection(spec).length, `NIP-${spec.nip} ${spec.variant}`).toBeGreaterThan(0);
      expect(spec.howItWorks.length, `NIP-${spec.nip} howItWorks`).toBeGreaterThan(0);
    }
  });

  test("part ids are unique per kind, and every focus/flow/process ref resolves", () => {
    for (const spec of Object.values(NIP_SPECS)) {
      const parts = specParts(spec);
      const keys = parts.map((p) => `${p.kind}:${p.part.id}`);
      expect(new Set(keys).size, `NIP-${spec.nip} part ids`).toBe(keys.length);
      const refs = [
        ...spec.howItWorks.flatMap((s) => (s.focus === undefined ? [] : [s.focus.part])),
        ...(spec.flows ?? []).flatMap((f) => f.steps.map((s) => s.part)),
        ...(spec.process?.steps ?? []).flatMap((s) => (s.part === undefined ? [] : [s.part])),
      ];
      for (const ref of refs)
        expect(findSpecPart(spec, ref), `NIP-${spec.nip} → ${ref.kind}:${ref.id}`).toBeDefined();
      for (const e of spec.events ?? []) {
        const tagIds = e.tags.map(tagSpecId);
        expect(new Set(tagIds).size, `NIP-${spec.nip} ${e.id} tag ids`).toBe(tagIds.length);
        for (const x of e.examples)
          expect(kindSelected(e.kinds, x.template.kind), `NIP-${spec.nip} ${x.id} kind`).toBe(true);
        const replacedBy = e.deprecated?.replacedBy;
        if (replacedBy !== undefined)
          expect(
            findSpecPart(spec, { kind: "event", id: replacedBy }),
            `NIP-${spec.nip} ${e.id} replacedBy`,
          ).toBeDefined();
      }
    }
  });
});

describe("strings", () => {
  test("every NIP has strings in every locale", () => {
    for (const locale of LOCALES)
      for (const id of Object.keys(NIP_SPECS))
        expect(getNipStrings(locale, id), `${locale} NIP-${id}`).toBeDefined();
  });

  test("every TextKey a spec uses has English text, and no English text is unused", () => {
    for (const spec of Object.values(NIP_SPECS)) {
      const text = getNipStrings("en", spec.nip)?.text ?? {};
      const used = specTextKeys(spec);
      expect(
        used.filter((k) => text[k] === undefined),
        `NIP-${spec.nip} missing`,
      ).toEqual([]);
      expect(
        Object.keys(text).filter((k) => !used.includes(k)),
        `NIP-${spec.nip} unused`,
      ).toEqual([]);
    }
  });

  test("every validation code has a message, and only those", () => {
    for (const locale of LOCALES)
      expect(Object.keys(getDictionary(locale).nips.issues).sort()).toEqual(
        [...VALIDATION_CODES].sort(),
      );
  });

  test("listNips joins metadata with the spec variant", () => {
    const listing = listNips();
    expect(listing.length).toBe(NIP_CORPUS.nips.length);
    const n57 = listing.find((n) => n.id === "57");
    expect(n57?.variant).toBe(getSpec("57")?.variant ?? "process");
    expect(typeof n57?.todo).toBe("boolean");
  });
});

describe("specTextKeys walks every structure", () => {
  test("collects keys from all part kinds, schemas and fields", () => {
    const schemaKeys = {
      type: "object",
      explain: "s.obj",
      properties: {
        a: { type: "array", items: { type: "string", explain: "s.arr-item" } },
        t: {
          type: "tuple",
          items: [{ type: "number", explain: "s.tuple0" }],
          rest: { type: "boolean", explain: "s.rest" },
        },
        e: {
          type: "string",
          field: { type: "enum", values: [{ value: "x", explain: "s.enum-x" }, { value: "y" }] },
        },
        j: { type: "string", field: { type: "json", schema: { type: "null", explain: "s.json" } } },
        o: { type: "any-of", options: [{ type: "filter", explain: "s.any0" }] },
      },
      additionalProperties: { type: "any", explain: "s.extra" },
    } as const;
    const spec: NipSpec = {
      nip: "99",
      variant: "process",
      howItWorks: [{ id: "h", title: "how.t", body: "how.b" }],
      related: [{ nip: "01", relation: "depends-on", explain: "rel" }],
      flows: [
        {
          id: "f",
          label: "flow.l",
          explain: "flow.e",
          steps: [{ part: { kind: "event", id: "e" }, explain: "flow.s" }],
        },
      ],
      events: [
        {
          id: "e",
          label: "ev.l",
          explain: "ev.e",
          deprecated: { explain: "ev.dep", replacedBy: "e" },
          kinds: [1, { from: 2, to: 3 }],
          content: {
            format: "encrypted",
            explain: "c.enc",
            scheme: "nip44",
            plaintext: { format: "json", explain: "c.json", schema: schemaKeys },
          },
          tags: [
            {
              name: "x",
              explain: "tag.x",
              presence: "optional",
              repeatable: true,
              fields: [
                { name: "v", type: { type: "pubkey" }, explain: "tag.x.v" },
                {
                  name: "w",
                  type: { type: "relay-url", literals: [{ value: "ALL", explain: "tag.x.all" }] },
                  explain: "tag.x.w",
                },
              ],
              rest: { name: "r", type: { type: "text" }, explain: "tag.x.rest" },
            },
          ],
          examples: [
            {
              id: "x",
              label: "ex.l",
              explain: "ex.e",
              template: { kind: 1, tags: [], content: "" },
            },
          ],
        },
        {
          id: "t",
          label: "ev2",
          explain: "ev2.e",
          kinds: [1],
          content: {
            format: "text",
            explain: "c.text",
            field: { type: "enum", values: [{ value: "+", explain: "c.plus" }] },
          },
          tags: [],
          examples: [],
        },
      ],
      messages: [
        {
          id: "m",
          label: "m.l",
          explain: "m.e",
          direction: "client-to-relay",
          type: "REQ",
          elements: [{ name: "f", explain: "m.el", schema: { type: "filter" } }],
          examples: [{ id: "mx", label: "m.ex", message: ["REQ", "s", {}] }],
        },
      ],
      documents: [
        {
          id: "d",
          label: "d.l",
          explain: "d.e",
          mediaType: "application/json",
          urlTemplate: "https://<domain>/",
          requestHeaders: [
            { name: "Accept", explain: "d.h", value: { type: "text" }, required: true },
          ],
          schema: { type: "object", properties: {}, explain: "d.s" },
          examples: [{ id: "dx", label: "d.ex", value: { label: "not a key", body: "not a key" } }],
        },
      ],
      http: [
        {
          id: "r",
          label: "r.l",
          explain: "r.e",
          method: "POST",
          urlTemplate: "/upload",
          headers: [
            {
              name: "Authorization",
              explain: "r.h",
              value: { type: "base64", of: "event" },
              required: true,
            },
          ],
          body: { mediaType: "application/json", schema: { type: "any", explain: "r.body" } },
          responses: [
            { status: 200, explain: "r.200", schema: { type: "any", explain: "r.200s" } },
            { status: 401, explain: "r.401" },
          ],
          examples: [{ id: "rx", label: "r.ex", url: "https://x", headers: {}, body: "not a key" }],
        },
      ],
      encodings: [
        {
          id: "n",
          label: "n.l",
          explain: "n.e",
          codec: "npub",
          inputs: [{ name: "pubkey", type: { type: "pubkey" }, explain: "n.in" }],
          output: "n.out",
          examples: [{ id: "nx", label: "n.ex", inputs: { label: "not a key" } }],
        },
      ],
      process: {
        actors: [{ id: "a", label: "p.a", kind: "client" }],
        steps: [{ id: "s", from: "a", label: "p.s.l", explain: "p.s.e" }],
      },
    };
    const keys = specTextKeys(spec);
    expect(keys).not.toContain("not a key");
    expect(keys).toEqual(
      expect.arrayContaining([
        "how.t",
        "how.b",
        "rel",
        "flow.l",
        "flow.s",
        "ev.l",
        "ev.dep",
        "tag.x.all",
        "c.enc",
        "c.json",
        "s.obj",
        "s.arr-item",
        "s.tuple0",
        "s.rest",
        "s.enum-x",
        "s.json",
        "s.any0",
        "s.extra",
        "tag.x.v",
        "tag.x.rest",
        "ex.e",
        "c.text",
        "c.plus",
        "m.el",
        "m.ex",
        "d.h",
        "d.s",
        "d.ex",
        "r.h",
        "r.body",
        "r.200",
        "r.200s",
        "r.401",
        "r.ex",
        "n.in",
        "n.out",
        "n.ex",
        "p.a",
        "p.s.e",
      ]),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(findSpecPart(spec, { kind: "message", id: "m" })?.part.id).toBe("m");
    expect(findSpecPart(spec, { kind: "event", id: "nope" })).toBeUndefined();
    expect(kindSelected([{ from: 2, to: 3 }], 3)).toBe(true);
    expect(kindSelected([1], 2)).toBe(false);
    expect(specParts(spec).map((p) => p.kind)).toEqual([
      "event",
      "event",
      "message",
      "document",
      "http",
      "encoding",
    ]);
  });
});
