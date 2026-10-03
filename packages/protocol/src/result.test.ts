import { describe, expect, test } from "bun:test";
import { bytesToHex, hexToBytes, isHex, utf8Decode, utf8Encode } from "./encoding.ts";
import { classifyKind, getKindInfo, KINDS, nipUrl } from "./kinds.ts";
import { err, fail, flatMapResult, isErr, isOk, mapResult, ok, unwrap } from "./result.ts";
import { eventAddress, getTag, getTagValues } from "./tags.ts";

describe("Result", () => {
  test("constructors and guards", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err("x"))).toBe(true);
    expect(fail("bad", "msg")).toEqual({ ok: false, error: { code: "bad", message: "msg" } });
  });
  test("map / flatMap / unwrap", () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(mapResult(err("e"), (n: number) => n * 2)).toEqual(err("e"));
    expect(flatMapResult(ok(2), (n) => (n > 1 ? ok(n) : err("small")))).toEqual(ok(2));
    expect(unwrap(ok("v"))).toBe("v");
    expect(() => unwrap(err("boom"))).toThrow("boom");
  });
});

describe("encoding", () => {
  test("hex round trip and validation", () => {
    expect(bytesToHex(Uint8Array.of(0, 15, 255))).toBe("000fff");
    expect(hexToBytes("000fff")).toEqual(ok(Uint8Array.of(0, 15, 255)));
    expect(hexToBytes("zz").ok).toBe(false);
    expect(hexToBytes("00", 2).ok).toBe(false);
    expect(isHex("ab", 1)).toBe(true);
    expect(utf8Decode(utf8Encode("héllo 🤙"))).toBe("héllo 🤙");
  });
});

describe("kinds", () => {
  test("NIP-01 ranges", () => {
    expect([0, 1, 3, 7, 1059, 10002, 20001, 30023, 40000].map(classifyKind)).toEqual([
      "replaceable",
      "regular",
      "replaceable",
      "regular",
      "regular",
      "replaceable",
      "ephemeral",
      "addressable",
      "regular",
    ]);
  });
  test("registry is sorted, unique and self-consistent", () => {
    const nums = KINDS.map((k) => k.kind);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    for (const k of KINDS) {
      expect(k.category).toBe(classifyKind(k.kind));
      expect(k.i18nKey).toBe(`k${k.kind}`);
    }
    expect(getKindInfo(1)?.name).toBe("Short text note");
    expect(getKindInfo(1)?.nip).toBe("10");
    // NIP-58: profile badges moved to replaceable 10008; 30008 is now a badge set.
    expect(getKindInfo(10008)).toMatchObject({ name: "Profile badges", category: "replaceable" });
    expect(getKindInfo(30008)?.name).toBe("Badge set");
    const flagged = KINDS.filter((k) => k.unrecommended).map((k) => k.kind);
    expect(flagged).toEqual([4, 40, 41, 42, 1040, 7000, 34550]);
    expect(getKindInfo(1)?.unrecommended).toBeUndefined();
    expect(getKindInfo(123456)).toBeUndefined();
    expect(nipUrl("01")).toBe("https://github.com/nostr-protocol/nips/blob/master/01.md");
  });
});

describe("tags", () => {
  const e = {
    kind: 30023,
    pubkey: "ab",
    tags: [["d", "post"], ["p", "x"], ["p", "y"], ["t"]] as const,
  };
  test("lookup", () => {
    expect(getTag(e, "d")).toEqual(["d", "post"]);
    expect(getTagValues(e, "p")).toEqual(["x", "y"]);
    expect(getTagValues(e, "t")).toEqual([]);
    expect(eventAddress(e)).toBe("30023:ab:post");
    expect(eventAddress({ ...e, tags: [] })).toBe("30023:ab:");
  });
});
