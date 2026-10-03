import { describe, expect, test } from "bun:test";
import { getDictionary, getNipStrings, NIP_RANGES, nipRange, nipStringsKey } from "./index.ts";

describe("NIP string ranges", () => {
  test("ids map to the documented range files", () => {
    expect(["01", "19", "20", "39", "40", "59", "60", "79", "80", "99"].map(nipRange)).toEqual([
      "r1",
      "r1",
      "r2",
      "r2",
      "r3",
      "r3",
      "r4",
      "r4",
      "r5",
      "r5",
    ]);
    expect(["5A", "7D", "A0", "C7", "EE"].map(nipRange)).toEqual(["r6", "r6", "r6", "r6", "r6"]);
    expect(nipStringsKey("7D")).toBe("n7D");
  });

  test("every entry sits in the range file its id maps to", () => {
    for (const range of NIP_RANGES)
      for (const key of Object.keys(getDictionary("en").nips[range]))
        expect(nipRange(key.slice(1)), key).toBe(range);
  });

  test("getNipStrings resolves per locale and is undefined for unknown ids", () => {
    expect(getNipStrings("en", "01")?.title).toBe("Basic protocol flow description");
    expect(getNipStrings("es", "7D")?.title.length).toBeGreaterThan(0);
    expect(getNipStrings("en", "ZZ")).toBeUndefined();
  });
});
