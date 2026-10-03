import { describe, expect, test } from "bun:test";
import { eventsByKind } from "@nostrschool/fixtures";
import { computeEventId, KINDS, type NostrEvent, verifyEvent } from "@nostrschool/protocol";
import { exampleFor } from "./examples.ts";

const example = (kind: number) => {
  const r = exampleFor(kind);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

describe("exampleFor", () => {
  test("every documented kind has a valid example of that kind", () => {
    for (const { kind } of KINDS) {
      const { source, event } = example(kind);
      expect(event.kind).toBe(kind);
      if (source === "rumor") {
        expect("sig" in event).toBe(false);
        expect(computeEventId(event).id).toBe(event.id);
      } else {
        expect(verifyEvent(event as NostrEvent).ok).toBe(true);
      }
    }
  });
  test("prefers real fixture events", () => {
    expect(example(1)).toEqual({ source: "fixture", event: eventsByKind(1)[0] as NostrEvent });
    expect(example(13).source).toBe("fixture");
    expect(example(14).source).toBe("rumor");
    expect(example(15).source).toBe("rumor");
    expect(example(9).source).toBe("signed");
  });
  test("is memoized and deterministic", () => {
    expect(example(30009)).toBe(example(30009));
  });
  test("unknown kinds get a generic signed template", () => {
    const { source, event } = example(4321);
    expect(source).toBe("signed");
    expect(event.content).toContain("4321");
  });
});
