import { describe, expect, test } from "bun:test";
import { keypairFromSecret, nip19Decode, signEvent, unwrap } from "@nostrschool/protocol";
import {
  allSafe,
  bitsOf,
  byteRangeOfWord,
  circlePoint,
  encodeTrack,
  hexBytes,
  judgeShare,
  maskSecret,
  partialEncoding,
  SHARE_REQUESTS,
  sampleKeypair,
  stampStillValid,
  toyBruteForce,
  toyHops,
  toyPublic,
  wordFrames,
  wordWindow,
} from "./keys-logic.ts";

const kp = sampleKeypair();
// Test vectors straight from the NIP-19 text.
const NIP19_SK = "67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa";
const NIP19_NSEC = "nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5";
const NIP19_PK = "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e";
const NIP19_NPUB = "npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg";

describe("sample keypair", () => {
  test("is deterministic and valid", () => {
    expect(sampleKeypair()).toEqual(kp);
    expect(kp.publicKey).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("bits and bytes", () => {
  test("bitsOf is MSB-first, 8 bits per byte", () => {
    expect(bitsOf(Uint8Array.of(0x80, 0x01))).toBe("1000000000000001");
  });
  test("byteRangeOfWord spans at most two bytes and clamps at the end", () => {
    expect(byteRangeOfWord(0, 32)).toEqual([0, 0]);
    expect(byteRangeOfWord(1, 32)).toEqual([0, 1]);
    expect(byteRangeOfWord(51, 32)).toEqual([31, 31]);
  });
  test("hexBytes splits into pairs", () => {
    expect(hexBytes("a1b2c3")).toEqual(["a1", "b2", "c3"]);
    expect(hexBytes("")).toEqual([]);
  });
});

describe("encodeTrack", () => {
  test("npub frames spell exactly the NIP-19 test vector", () => {
    const track = unwrap(encodeTrack({ ...kp, publicKey: NIP19_PK }, "npub"));
    const expected = NIP19_NPUB;
    expect(track.steps.encoded).toBe(expected);
    expect(track.frames).toHaveLength(58); // 52 data words + 6 checksum words
    expect(`npub1${track.frames.map((f) => f.char).join("")}`).toBe(expected);
    expect(track.frames.filter((f) => f.checksum)).toHaveLength(6);
    expect(track.frames[0]?.bytes).toEqual([0, 0]);
    expect(track.frames.at(-1)?.bytes).toBeUndefined();
  });
  test("nsec round-trips back to the secret key", () => {
    const vector = unwrap(keypairFromSecret(NIP19_SK));
    const track = unwrap(encodeTrack(vector, "nsec"));
    expect(track.steps.encoded).toBe(NIP19_NSEC);
    const decoded = unwrap(nip19Decode(track.steps.encoded)).entity;
    expect(decoded.type === "nsec" ? decoded.data : undefined).toEqual(vector.secretKey);
  });
  test("surfaces encoder errors", () => {
    const bad = { ...kp, publicKey: "zz" };
    const r = encodeTrack(bad, "npub");
    expect(r.ok).toBe(false);
  });
  test("partialEncoding grows one char per word and never goes negative", () => {
    const { steps } = unwrap(encodeTrack(kp, "npub"));
    expect(partialEncoding(steps, 0)).toBe("npub1");
    expect(partialEncoding(steps, -3)).toBe("npub1");
    expect(partialEncoding(steps, 3)).toBe(`npub1${steps.dataChars.slice(0, 3)}`);
    expect(partialEncoding(steps, 999)).toBe(steps.encoded);
  });
});

describe("wordWindow", () => {
  const { steps, frames } = unwrap(encodeTrack(kp, "npub"));
  test("the highlighted 5 bits equal the word", () => {
    for (const frame of frames.filter((f) => !f.checksum)) {
      const win = wordWindow(frame, steps.dataBytes);
      expect(win?.bits.slice(win.start, win.start + 5)).toBe(frame.bits);
    }
  });
  test("the last word is zero-padded", () => {
    const last = frames.find((f) => f.index === 51);
    const win = last === undefined ? undefined : wordWindow(last, steps.dataBytes);
    expect(win?.padding).toBe(4);
  });
  test("checksum words have no window", () => {
    const checksum = frames.find((f) => f.checksum);
    expect(
      checksum === undefined ? "missing" : wordWindow(checksum, steps.dataBytes),
    ).toBeUndefined();
  });
  test("wordFrames numbers checksum words after data words", () => {
    expect(wordFrames(steps).at(-1)?.index).toBe(57);
  });
});

describe("maskSecret", () => {
  test("keeps the edges", () => {
    expect(maskSecret("abcdefghijkl")).toBe("abcd••••ijkl");
    expect(maskSecret("abcdefghijkl", 2)).toBe("ab••••••••kl");
  });
  test("short secrets are fully masked", () => {
    expect(maskSecret("abc")).toBe("•••");
  });
});

describe("toy clock group", () => {
  test("public spot is k·g mod n", () => {
    expect(unwrap(toyPublic(7))).toBe((7 * 17) % 61);
  });
  test("hops visit k positions and end at the public spot", () => {
    const hops = unwrap(toyHops(3));
    expect(hops).toEqual([17, 34, 51]);
  });
  test("rejects out-of-range secrets", () => {
    for (const k of [0, 61, 1.5, -1]) {
      expect(toyPublic(k).ok).toBe(false);
      expect(toyHops(k).ok).toBe(false);
    }
  });
  test("brute force needs exactly k guesses", () => {
    for (const k of [1, 7, 42, 60]) {
      const target = unwrap(toyPublic(k));
      expect(unwrap(toyBruteForce(target))).toHaveLength(k);
    }
  });
  test("brute force validates the target and reports unreachable spots", () => {
    expect(toyBruteForce(0).ok).toBe(false);
    expect(toyBruteForce(2.5).ok).toBe(false);
    // Stride 2 on an even clock never reaches odd spots: not a cyclic group.
    const r = toyBruteForce(3, { n: 10, g: 2 });
    expect(r.ok ? "ok" : r.error.code).toBe("out-of-range");
  });
  test("circlePoint starts at 12 o'clock", () => {
    const p = circlePoint(0, 4, 10, 50);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(40);
    const q = circlePoint(1, 4, 10, 50);
    expect(q.x).toBeCloseTo(60);
    expect(q.y).toBeCloseTo(50);
  });
});

describe("share sorter", () => {
  test("verdicts", () => {
    expect(judgeShare("npub", "share")).toBe("safe");
    expect(judgeShare("npub", "refuse")).toBe("overcautious");
    expect(judgeShare("nsec", "refuse")).toBe("safe");
    expect(judgeShare("nsec", "share")).toBe("danger");
  });
  test("allSafe only when every request is safe", () => {
    expect(allSafe({})).toBe(false);
    const all = Object.fromEntries(SHARE_REQUESTS.map((r) => [r.id, "safe" as const]));
    expect(allSafe(all)).toBe(true);
    expect(allSafe({ ...all, friend: "overcautious" })).toBe(false);
  });
});

describe("stampStillValid", () => {
  const signed = unwrap(
    signEvent({ kind: 1, created_at: 1735689600, tags: [], content: "gm" }, kp.secretKey),
  ).event;
  test("valid for the signed content", () => {
    expect(stampStillValid(signed, "gm")).toBe(true);
  });
  test("invalid after any edit", () => {
    expect(stampStillValid(signed, "gM")).toBe(false);
  });
});
