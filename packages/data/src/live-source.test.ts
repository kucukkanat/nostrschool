/**
 * Integration: LiveRelaySource against the real in-memory test relay over real sockets.
 * No mocks — misbehaving relays are real Bun servers that send real bad frames.
 */
import { afterEach, describe, expect, test } from "bun:test";
import type { NostrEvent } from "@nostrschool/protocol";
import { startTestRelay, type TestRelay } from "@nostrschool/test-relay";
import { connectRawClient, signTestEvent } from "@nostrschool/test-relay/testing.ts";
import { WebSocket as BunWebSocket } from "ws";
import { createLiveRelaySource } from "./live-source.ts";
import { type Entry, record } from "./recorder.test-util.ts";
import type { DataSource } from "./types.ts";

const notes = [1, 2, 3].map((n) =>
  signTestEvent("bob", { kind: 1, created_at: n, content: `n${n}` }),
);
const [n1, n2, n3] = notes as [NostrEvent, NostrEvent, NostrEvent];

const cleanup: (() => unknown)[] = [];
afterEach(async () => {
  for (const f of cleanup.splice(0).reverse()) await f();
});
const relay = async (options: Parameters<typeof startTestRelay>[0] = {}): Promise<TestRelay> => {
  const r = await startTestRelay({ seed: notes, ...options });
  cleanup.push(() => r.stop());
  return r;
};
const source = (options: Parameters<typeof createLiveRelaySource>[0]): DataSource => {
  const s = createLiveRelaySource(options);
  cleanup.push(() => s.dispose());
  return s;
};

/** A real Bun WebSocket server that answers every REQ with scripted raw frames. */
const scriptedRelay = (reply: (subId: string) => readonly string[]): string => {
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: (req, srv) => (srv.upgrade(req) ? undefined : undefined),
    websocket: {
      message: (ws, raw) => {
        const [type, subId] = JSON.parse(String(raw)) as [string, string];
        if (type === "REQ") for (const frame of reply(subId)) ws.send(frame);
      },
    },
  });
  cleanup.push(() => server.stop(true));
  return `ws://127.0.0.1:${server.port}`;
};

const errors = (log: readonly Entry[]) =>
  log.flatMap((e) => (e.type === "error" ? [e.error.code] : []));
const eventIds = (log: readonly Entry[]) => log.flatMap((e) => (e.type === "event" ? [e.id] : []));

describe("createLiveRelaySource", () => {
  test("defaults to the public relays without connecting until subscribe", () => {
    const s = createLiveRelaySource();
    expect(s.mode).toBe("live");
    expect(s.relays).toEqual(["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]);
    s.dispose();
  });

  test("REQ → verified EVENTs → EOSE → CLOSE over a real socket", async () => {
    const r = await relay();
    const s = source({ relays: [r.url] });
    const rec = record();
    const sub = s.subscribe([{ kinds: [1], limit: 2 }], rec.options);
    await rec.done;
    expect(eventIds(rec.log)).toEqual([n3.id, n2.id]);
    sub.close();
    sub.close();
    await Bun.sleep(30);
    expect(rec.frames()).toEqual([
      ["REQ", sub.id, { kinds: [1], limit: 2 }],
      ["EVENT", sub.id, n3],
      ["EVENT", sub.id, n2],
      ["EOSE", sub.id],
      ["CLOSE", sub.id],
    ]);
    expect(r.received()).toEqual([
      ["REQ", sub.id, { kinds: [1], limit: 2 }],
      ["CLOSE", sub.id],
    ]);
  });

  test("delivers live events after EOSE and stops after close()", async () => {
    const r = await relay();
    const rec = record();
    const sub = source({ relays: [r.url] }).subscribe([{ kinds: [1], since: 10 }], rec.options);
    await rec.done;
    const writer = await connectRawClient(r.url);
    cleanup.push(() => writer.close());
    const fresh = signTestEvent("carol", { kind: 1, created_at: 20, content: "live!" });
    writer.send(["EVENT", fresh]);
    await rec.until((e) => e.type === "event");
    expect(eventIds(rec.log)).toEqual([fresh.id]);
    sub.close();
    const later = signTestEvent("carol", { kind: 1, created_at: 21 });
    writer.send(["EVENT", later]);
    await writer.waitFor((f) => f[0] === "OK" && f[1] === later.id);
    await Bun.sleep(20);
    expect(eventIds(rec.log)).toEqual([fresh.id]);
  });

  test("events from several relays arrive once per relay; dedupes repeats per relay", async () => {
    const [a, b] = [await relay(), await relay()];
    const rec = record();
    source({ relays: [a.url, b.url, a.url] }).subscribe([{ ids: [n1.id] }], rec.options);
    await rec.done;
    const perRelay = rec.log.flatMap((e) => (e.type === "event" ? [e.relay] : []));
    expect(perRelay.sort()).toEqual([a.url, b.url].sort());

    const dup = JSON.stringify(["EVENT", "SUB", n1]);
    const url = scriptedRelay((id) => [
      dup.replace("SUB", id),
      dup.replace("SUB", id),
      `["EOSE","${id}"]`,
    ]);
    const rec2 = record();
    source({ relays: [url] }).subscribe([{}], rec2.options);
    await rec2.done;
    expect(eventIds(rec2.log)).toEqual([n1.id]);
  });

  test("drops forged, non-matching and foreign-subscription events, reporting why", async () => {
    const forged = { ...n1, content: "tampered" };
    const url = scriptedRelay((id) => [
      JSON.stringify(["EVENT", id, forged]),
      JSON.stringify(["EVENT", id, forged]),
      JSON.stringify(["EVENT", id, signTestEvent("x", { kind: 7 })]),
      JSON.stringify(["EVENT", "someone-else", n2]),
      JSON.stringify(["EVENT", id, n3]),
      `["EOSE","other"]`,
      `["EOSE","${id}"]`,
    ]);
    const rec = record();
    source({ relays: [url] }).subscribe([{ kinds: [1] }], rec.options);
    await rec.done;
    expect(eventIds(rec.log)).toEqual([n3.id]);
    expect(errors(rec.log)).toEqual(["invalid-event", "invalid-event", "invalid-event"]);
  });

  test("reports invalid frames and NOTICEs; ignores OK/COUNT/AUTH and foreign CLOSED", async () => {
    const r = await relay();
    const url = scriptedRelay((id) => [
      "not json",
      `["NOTICE","slow down"]`,
      `["OK","${n1.id}",true,""]`,
      `["COUNT","${id}",{"count":1}]`,
      `["AUTH","challenge"]`,
      `["CLOSED","other","nope"]`,
      `["EOSE","${id}"]`,
    ]);
    const rec = record();
    source({ relays: [url, r.url] }).subscribe([{ ids: [n1.id] }], rec.options);
    await rec.done;
    expect(errors(rec.log)).toEqual(["invalid-message", "notice"]);
    expect(rec.log.find((e) => e.type === "error" && e.error.code === "notice")).toMatchObject({
      error: { relayUrl: url, message: "slow down" },
    });
    r.notice("hello from test relay");
    await rec.until((e) => e.type === "error" && e.error.message === "hello from test relay");
  });

  test("CLOSED from the relay ends that relay's part of the subscription", async () => {
    const url = scriptedRelay((id) => [`["CLOSED","${id}","auth-required: members only"]`]);
    const rec = record();
    source({ relays: [url] }).subscribe([{}], rec.options);
    await rec.done;
    expect(rec.log.find((e) => e.type === "error")).toEqual({
      type: "error",
      error: { code: "closed-by-relay", relayUrl: url, message: "auth-required: members only" },
    });
    expect(rec.log.some((e) => e.type === "eose")).toBe(false);
  });

  test("maxEvents caps unique events", async () => {
    const r = await relay();
    const rec = record();
    source({ relays: [r.url], maxEvents: 2 }).subscribe([{}], rec.options);
    await rec.done;
    expect(eventIds(rec.log)).toEqual([n3.id, n2.id]);
  });

  test("EOSE timeout fires onEose anyway and keeps listening", async () => {
    const r = await relay({ latencyMs: 60 });
    const rec = record();
    source({ relays: [r.url], eoseTimeoutMs: 20 }).subscribe([{ ids: [n1.id] }], rec.options);
    await rec.done;
    expect(errors(rec.log)).toEqual(["eose-timeout"]);
    await rec.until((e) => e.type === "event");
    await Bun.sleep(80);
    expect(rec.log.filter((e) => e.type === "eose")).toHaveLength(1);
  });

  test("connect timeout when the server never completes the handshake", async () => {
    const silent = Bun.listen({
      hostname: "127.0.0.1",
      port: 0,
      socket: { data: () => undefined },
    });
    cleanup.push(() => silent.stop(true));
    const url = `ws://127.0.0.1:${silent.port}`;
    const rec = record();
    source({ relays: [url], connectTimeoutMs: 30, WebSocketImpl: BunWebSocket }).subscribe(
      [{}],
      rec.options,
    );
    await rec.done;
    expect(errors(rec.log)[0]).toBe("connect-timeout");
  });

  test("a refused connection reports connect-failed", async () => {
    const gone = await startTestRelay();
    await gone.stop();
    // Bun's client: happy-dom's WebSocket rethrows connection errors as unhandled events.
    const rec = record();
    source({ relays: [gone.url], WebSocketImpl: BunWebSocket }).subscribe([{}], rec.options);
    await rec.done;
    expect(errors(rec.log)).toEqual(["connect-failed"]);
  });

  test("an invalid URL fails to connect without throwing", async () => {
    const rec = record();
    source({ relays: ["not a url"] }).subscribe([{}], rec.options);
    await rec.done;
    expect(rec.log[0]).toMatchObject({
      type: "error",
      error: { code: "connect-failed", relayUrl: "not a url" },
    });
  });

  test("relay going away before EOSE still completes onAllEose", async () => {
    const r = await relay({ latencyMs: 200 });
    const rec = record();
    source({ relays: [r.url] }).subscribe([{}], rec.options);
    await rec.until((e) => e.type === "raw" && e.dir === "out");
    await r.stop();
    await rec.done;
    expect(rec.log.some((e) => e.type === "eose")).toBe(false);
  });

  test("no relays → onAllEose; closing first suppresses it", async () => {
    const s = source({ relays: [] });
    const rec = record();
    s.subscribe([{}], rec.options);
    await rec.done;
    const silent = record();
    s.subscribe([{}], silent.options).close();
    await Bun.sleep(10);
    expect(silent.log).toEqual([]);
  });

  test("dispose() sends CLOSE on every open subscription", async () => {
    const r = await relay();
    const s = createLiveRelaySource({ relays: [r.url] });
    const rec = record();
    const sub = s.subscribe([{}], {
      onEvent: () => undefined,
      onAllEose: rec.options.onAllEose ?? (() => undefined),
    });
    await rec.done;
    s.dispose();
    await Bun.sleep(30);
    expect(r.received().at(-1)).toEqual(["CLOSE", sub.id]);
  });
});
