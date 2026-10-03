import { describe, expect, test } from "bun:test";
import { FIXTURE_EVENTS, RELAYS, relaysForEvent } from "@nostrschool/fixtures";
import { applyFilters, eventAddress, type NostrEvent } from "@nostrschool/protocol";
import { signTestEvent } from "@nostrschool/test-relay/testing.ts";
import { createFixtureSource, latestVersions } from "./fixture-source.ts";
import { record } from "./recorder.test-util.ts";

const notes = [1, 2, 3].map((n) =>
  signTestEvent("alice", { kind: 1, created_at: n, content: `n${n}` }),
);
const [n1, n2, n3] = notes as [NostrEvent, NostrEvent, NostrEvent];
const A = "wss://a.example";
const B = "wss://b.example";

describe("createFixtureSource with fixture defaults", () => {
  test("serves real fixture events from the relays that hold them", async () => {
    const source = createFixtureSource({ latencyMs: 0 });
    expect(source.mode).toBe("fixture");
    expect(source.relays).toEqual(RELAYS.map((r) => r.url));
    const rec = record();
    source.subscribe([{ kinds: [1] }], rec.options);
    await rec.done;
    const events = rec.log.flatMap((e) => (e.type === "event" ? [e] : []));
    expect(events.length).toBeGreaterThan(0);
    for (const { id, relay } of events) expect(relaysForEvent(id)).toContain(relay);
    const unique = new Set(events.map((e) => e.id));
    expect([...unique].sort()).toEqual(
      applyFilters([{ kinds: [1] }], FIXTURE_EVENTS)
        .filter((e) => relaysForEvent(e.id).length > 0)
        .map((e) => e.id)
        .sort(),
    );
  });

  test("defaults to each fixture relay's latency, fastest relay first", async () => {
    const source = createFixtureSource();
    const rec = record();
    const started = performance.now();
    source.subscribe([{ limit: 1 }], rec.options);
    await rec.done;
    expect(performance.now() - started).toBeGreaterThanOrEqual(
      Math.max(...RELAYS.map((r) => r.latencyMs)) - 5,
    );
    const eoseOrder = rec.log.flatMap((e) => (e.type === "eose" ? [e.relay] : []));
    expect(eoseOrder).toEqual(
      [...RELAYS].sort((a, b) => a.latencyMs - b.latencyMs).map((r) => r.url),
    );
  });
});

describe("createFixtureSource with custom data", () => {
  test("emits the full NIP-01 conversation as raw frames", async () => {
    const source = createFixtureSource({ events: notes, relays: [A], latencyMs: 0 });
    const rec = record();
    const sub = source.subscribe([{ kinds: [1], limit: 2 }], rec.options);
    expect(sub.id).toBe("ns-1");
    expect(rec.log).toEqual([]); // callbacks are always async
    await rec.done;
    sub.close();
    expect(rec.frames()).toEqual([
      ["REQ", "ns-1", { kinds: [1], limit: 2 }],
      ["EVENT", "ns-1", n3],
      ["EVENT", "ns-1", n2],
      ["EOSE", "ns-1"],
      ["CLOSE", "ns-1"],
    ]);
    expect(rec.log.filter((e) => e.type !== "raw").map((e) => e.type)).toEqual([
      "event",
      "event",
      "eose",
      "all-eose",
    ]);
  });

  test("honors placement; unplaced events are on every relay", async () => {
    const source = createFixtureSource({
      events: notes,
      relays: [A, B],
      placement: { [n1.id]: [A], [n2.id]: [] },
      latencyMs: (url) => (url === A ? 20 : 0),
    });
    const rec = record();
    source.subscribe([{}], rec.options);
    await rec.done;
    expect(rec.log.filter((e) => e.type === "event" || e.type === "eose")).toEqual([
      { type: "event", relay: B, id: n3.id },
      { type: "eose", relay: B },
      { type: "event", relay: A, id: n3.id },
      { type: "event", relay: A, id: n1.id },
      { type: "eose", relay: A },
    ]);
  });

  test("per-subscription relays override the defaults (deduplicated)", async () => {
    const source = createFixtureSource({ events: notes, relays: [A], latencyMs: 0 });
    const rec = record([B, B]);
    source.subscribe([{ limit: 1 }], rec.options);
    await rec.done;
    expect(rec.log.filter((e) => e.type === "eose")).toEqual([{ type: "eose", relay: B }]);
  });

  test("no relays → onAllEose still fires", async () => {
    const rec = record([]);
    createFixtureSource({ events: notes, latencyMs: 0 }).subscribe([{}], rec.options);
    await rec.done;
    expect(rec.log).toEqual([{ type: "all-eose" }]);
  });

  test("close() before the relay answers stops callbacks; CLOSE only where REQ went out", async () => {
    const source = createFixtureSource({
      events: notes,
      relays: [A, B],
      latencyMs: (u) => (u === A ? 0 : 50),
    });
    const rec = record();
    const sub = source.subscribe([{}], rec.options);
    await rec.until((e) => e.type === "eose" && e.relay === A);
    sub.close();
    sub.close();
    await Bun.sleep(80);
    expect(rec.frames("out")).toEqual([
      ["REQ", "ns-1", {}],
      ["REQ", "ns-1", {}],
      ["CLOSE", "ns-1"],
      ["CLOSE", "ns-1"],
    ]);
    expect(rec.log.some((e) => e.type === "eose" && e.relay === B)).toBe(false);

    const early = record();
    source.subscribe([{}], early.options).close();
    await Bun.sleep(10);
    expect(early.log).toEqual([]);
  });

  test("dispose() closes every open subscription", async () => {
    const source = createFixtureSource({ events: notes, relays: [A], latencyMs: 30 });
    const rec = record();
    source.subscribe([{}], rec.options);
    await rec.until((e) => e.type === "raw");
    source.dispose();
    await Bun.sleep(50);
    expect(rec.frames()).toEqual([
      ["REQ", "ns-1", {}],
      ["CLOSE", "ns-1"],
    ]);
  });

  test("works without optional callbacks", async () => {
    const seen: string[] = [];
    createFixtureSource({ events: notes, relays: [A], latencyMs: 0 }).subscribe([{}], {
      onEvent: (e) => seen.push(e.id),
    });
    await Bun.sleep(10);
    expect(seen).toHaveLength(3);
  });
});

describe("latestVersions (NIP-01 relay storage)", () => {
  const p1 = signTestEvent("alice", { kind: 0, created_at: 1, content: "old" });
  const p2 = signTestEvent("alice", { kind: 0, created_at: 2, content: "new" });
  const bob = signTestEvent("bob", { kind: 0, created_at: 1, content: "bob" });
  const a1 = signTestEvent("alice", { kind: 30023, created_at: 5, tags: [["d", "x"]] });
  const a2 = signTestEvent("alice", { kind: 30023, created_at: 3, tags: [["d", "x"]] });
  const other = signTestEvent("alice", { kind: 30023, created_at: 1, tags: [["d", "y"]] });
  const tieA = signTestEvent("carol", { kind: 3, created_at: 9, content: "a" });
  const tieB = signTestEvent("carol", { kind: 3, created_at: 9, content: "b" });
  const ephemeral = signTestEvent("alice", { kind: 20001 });

  test("keeps regular events and only the newest version per address", () => {
    expect(latestVersions([n1, p1, bob, p2, a1, a2, other, ephemeral, n2])).toEqual([
      n1,
      bob,
      p2,
      a1,
      other,
      n2,
    ]);
  });

  test("breaks created_at ties by lowest id", () => {
    const winner = tieA.id < tieB.id ? tieA : tieB;
    expect(latestVersions([tieA, tieB])).toEqual([winner]);
    expect(latestVersions([tieB, tieA])).toEqual([winner]);
  });

  test("fixture mode never returns superseded versions", async () => {
    const source = createFixtureSource({ events: [p1, p2], relays: [A], latencyMs: 0 });
    const rec = record();
    source.subscribe([{ kinds: [0] }], rec.options);
    await rec.done;
    const ids = rec.log.flatMap((e) => (e.type === "event" ? [e.id] : []));
    expect(ids).toEqual([p2.id]);
  });

  test("default fixtures serve one version per address per relay", async () => {
    const source = createFixtureSource({ latencyMs: 0 });
    const rec = record();
    source.subscribe([{ kinds: [0, 3, 30023] }], rec.options);
    await rec.done;
    const byRelay = new Map<string, string[]>();
    for (const e of rec.log) {
      if (e.type !== "event") continue;
      const event = FIXTURE_EVENTS.find((f) => f.id === e.id);
      if (event === undefined) throw new Error(`unknown fixture ${e.id}`);
      byRelay.set(e.relay, [...(byRelay.get(e.relay) ?? []), eventAddress(event)]);
    }
    expect(byRelay.size).toBeGreaterThan(0);
    for (const addresses of byRelay.values())
      expect(new Set(addresses).size).toBe(addresses.length);
  });
});
