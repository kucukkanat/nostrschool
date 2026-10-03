import { describe, expect, test } from "bun:test";
import { verifyEvent } from "nostr-tools/pure";
import raw from "./data/events.json" with { type: "json" };
import { parseFixtureFile } from "./event-utils.ts";
import { getPersona } from "./personas.ts";
import { buildFixtures, fakeBolt11 } from "./script.ts";

const committed = (() => {
  const r = parseFixtureFile(raw);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
})();

describe("buildFixtures", () => {
  const { refs, ...file } = buildFixtures();

  test("committed events.json is up to date (run `bun run generate` if this fails)", () => {
    expect(file).toEqual(committed);
    expect(refs["deletion"]?.tags[0]).toEqual(["e", refs["mistake"]?.id ?? ""]);
  });

  test("is pure: two runs are byte-identical, and every event verifies", () => {
    expect(JSON.stringify(buildFixtures())).toBe(JSON.stringify({ ...file, refs }));
    for (const e of file.events) {
      expect(verifyEvent({ ...e, tags: e.tags.map((t) => [...t]) })).toBe(true);
    }
  });

  const frank = getPersona("frank").pubkey;
  const address = `30023:${frank}:protocols-not-platforms`;

  test("NIP-18: the naddr mention in Frank's announcement is cited with a q tag", () => {
    const tags = refs["frankAnnounce"]?.tags ?? [];
    expect(tags).toContainEqual(["q", address, "wss://relay.beta.example"]);
    expect(tags.some((t) => t[0] === "a")).toBe(false);
  });

  test("NIP-25: the reaction to Frank's article carries its a coordinate", () => {
    const article = refs["frankArticle"];
    const reaction = file.events.find(
      (e) => e.kind === 7 && e.tags.some((t) => t[0] === "e" && t[1] === article?.id),
    );
    expect(reaction?.tags).toContainEqual(["a", address, "wss://relay.beta.example"]);
    expect(reaction?.tags).toContainEqual(["k", "30023"]);
  });
});

test("fakeBolt11 encodes the amount and uses the bech32 charset", () => {
  const inv = fakeBolt11(21, "seed");
  expect(inv).toMatch(/^lnbc210n1p[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{64}$/);
  expect(fakeBolt11(21, "seed")).toBe(inv);
});
