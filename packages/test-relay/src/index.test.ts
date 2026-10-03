import { afterEach, describe, expect, test } from "bun:test";
import { startTestRelay, type TestRelay } from "./index.ts";
import { connectRawClient, type RawClient, signTestEvent } from "./testing.ts";

const alice1 = signTestEvent("alice", { kind: 1, created_at: 100, content: "first" });
const alice2 = signTestEvent("alice", { kind: 1, created_at: 200, content: "second" });
const bobMeta = signTestEvent("bob", { kind: 0, created_at: 50, content: "{}" });

const open: (TestRelay | RawClient)[] = [];
const relayWith = async (options: Parameters<typeof startTestRelay>[0] = {}) => {
  const relay = await startTestRelay({ seed: [alice1, alice2, bobMeta], ...options });
  const client = await connectRawClient(relay.url);
  open.push(client, relay);
  return { relay, client };
};

afterEach(async () => {
  for (const x of open.splice(0)) {
    if ("stop" in x) await x.stop();
    else x.close();
  }
});

const isType = (type: string, id?: string) => (f: unknown[]) =>
  f[0] === type && (id === undefined || f[1] === id);

describe("startTestRelay", () => {
  test("listens on a free port and exposes its url and seed", async () => {
    const { relay } = await relayWith();
    expect(relay.port).toBeGreaterThan(0);
    expect(relay.url).toBe(`ws://127.0.0.1:${relay.port}`);
    expect(relay.events()).toHaveLength(3);
  });

  test("REQ streams stored matches newest first, then EOSE", async () => {
    const { relay, client } = await relayWith();
    client.send(["REQ", "s1", { kinds: [1] }]);
    await client.waitFor(isType("EOSE", "s1"));
    expect(client.frames).toEqual([
      ["EVENT", "s1", alice2],
      ["EVENT", "s1", alice1],
      ["EOSE", "s1"],
    ]);
    expect(relay.received()).toEqual([["REQ", "s1", { kinds: [1] }]]);
  });

  test("live subscriptions receive new matching events until CLOSE", async () => {
    const { relay, client: sub } = await relayWith();
    const pub = await connectRawClient(relay.url);
    open.push(pub);
    sub.send(["REQ", "live", { kinds: [1], since: 300 }]);
    await sub.waitFor(isType("EOSE", "live"));
    const fresh = signTestEvent("carol", { kind: 1, created_at: 300, content: "hello" });
    pub.send(["EVENT", fresh]);
    await pub.waitFor(isType("OK", fresh.id));
    await sub.waitFor((f) => f[0] === "EVENT" && f[1] === "live");
    expect(sub.frames.at(-1)).toEqual(["EVENT", "live", fresh]);

    sub.send(["CLOSE", "live"]);
    sub.send(["COUNT", "sync", {}]);
    await sub.waitFor(isType("COUNT", "sync"));
    const later = signTestEvent("carol", { kind: 1, created_at: 301 });
    pub.send(["EVENT", later]);
    await pub.waitFor(isType("OK", later.id));
    sub.send(["COUNT", "sync2", {}]);
    await sub.waitFor(isType("COUNT", "sync2"));
    expect(sub.frames.filter((f) => f[0] === "EVENT")).toHaveLength(1);
    expect(pub.frames.filter((f) => f[0] === "EVENT")).toEqual([]);
  });

  test("EVENT answers OK with NIP-01 prefixes", async () => {
    const { relay, client } = await relayWith();
    const fresh = signTestEvent("dave", { kind: 1, content: "new" });
    client.send(["EVENT", fresh]);
    expect(await client.waitFor(isType("OK", fresh.id))).toEqual(["OK", fresh.id, true, ""]);
    client.send(["EVENT", alice1]);
    expect(await client.waitFor(isType("OK", alice1.id))).toEqual([
      "OK",
      alice1.id,
      true,
      "duplicate: already have this event",
    ]);
    const forged = { ...fresh, content: "tampered" };
    client.send(["EVENT", forged]);
    await client.waitFor((f) => f[0] === "OK" && f[2] === false);
    expect(client.frames.at(-1)).toEqual([
      "OK",
      fresh.id,
      false,
      "invalid: The id is not the hash of this content",
    ]);
    expect(relay.events()).toContainEqual(fresh);
    expect(relay.events()).not.toContainEqual(forged);
  });

  test("replaceable and ephemeral rules apply to writes", async () => {
    const { relay, client } = await relayWith();
    const olderMeta = signTestEvent("bob", { kind: 0, created_at: 10, content: "old" });
    client.send(["EVENT", olderMeta]);
    expect(await client.waitFor(isType("OK", olderMeta.id))).toEqual([
      "OK",
      olderMeta.id,
      true,
      "duplicate: a newer version is already stored",
    ]);
    client.send(["REQ", "eph", { kinds: [20000] }]);
    await client.waitFor(isType("EOSE", "eph"));
    const ping = signTestEvent("bob", { kind: 20000 });
    client.send(["EVENT", ping]);
    await client.waitFor(isType("EVENT", "eph"));
    expect(relay.events()).not.toContainEqual(ping);
  });

  test("verifySignatures: false stores forged events; acceptWrites: false blocks", async () => {
    const lax = await relayWith({ verifySignatures: false, seed: [] });
    const forged = { ...alice1, content: "tampered" };
    lax.client.send(["EVENT", forged]);
    expect(await lax.client.waitFor(isType("OK"))).toEqual(["OK", alice1.id, true, ""]);

    const ro = await relayWith({ acceptWrites: false });
    ro.client.send(["EVENT", alice1]);
    expect(await ro.client.waitFor(isType("OK"))).toEqual([
      "OK",
      alice1.id,
      false,
      "blocked: read-only relay",
    ]);
  });

  test("COUNT ignores limit; refused REQ/COUNT get CLOSED; AUTH gets OK false; junk gets NOTICE", async () => {
    const { client } = await relayWith();
    client.send(["COUNT", "c", { kinds: [1], limit: 1 }]);
    expect(await client.waitFor(isType("COUNT"))).toEqual(["COUNT", "c", { count: 2 }]);
    client.send(["REQ", "empty"]);
    expect(await client.waitFor(isType("CLOSED"))).toEqual([
      "CLOSED",
      "empty",
      "invalid: REQ expects 2+ arguments, got 1",
    ]);
    client.send(["COUNT", "bad", { kinds: ["x"] }]);
    await client.waitFor(isType("CLOSED", "bad"));
    client.send(["AUTH", alice1]);
    expect(await client.waitFor(isType("OK", alice1.id))).toEqual([
      "OK",
      alice1.id,
      false,
      "restricted: this relay does not require AUTH",
    ]);
    client.send("not json");
    client.send(["EVENT", { id: "nope" }]);
    client.send(["EVENT", "not an object"]);
    await client.waitFor(() => client.frames.filter((f) => f[0] === "NOTICE").length === 3);
    expect(client.frames.filter((f) => f[0] === "NOTICE")).toEqual([
      ["NOTICE", expect.stringMatching(/^invalid: /)],
      ["NOTICE", expect.stringMatching(/^invalid: /)],
      ["NOTICE", expect.stringMatching(/^invalid: /)],
    ]);
  });

  test("malformed EVENT/AUTH frames with a hex id are answered with OK false, not NOTICE", async () => {
    const { relay, client } = await relayWith();
    const { sig: _sig, ...unsigned } = alice1;
    client.send(["EVENT", unsigned]);
    const ok = await client.waitFor(isType("OK", alice1.id));
    expect(ok).toEqual(["OK", alice1.id, false, expect.stringMatching(/^invalid: /)]);
    client.send(["AUTH", { ...alice1, kind: "x" }]);
    await client.waitFor(() => client.frames.filter(isType("OK", alice1.id)).length === 2);
    expect(client.frames.filter((f) => f[0] === "NOTICE")).toEqual([]);
    expect(relay.received()).toEqual([]);
  });

  test("notice() broadcasts to every client", async () => {
    const { relay, client } = await relayWith();
    const other = await connectRawClient(relay.url);
    open.push(other);
    relay.notice("hello");
    expect(await client.waitFor(isType("NOTICE"))).toEqual(["NOTICE", "hello"]);
    expect(await other.waitFor(isType("NOTICE"))).toEqual(["NOTICE", "hello"]);
  });

  test("latencyMs delays frames but keeps their order", async () => {
    const { client } = await relayWith({ latencyMs: 20 });
    const started = performance.now();
    client.send(["REQ", "slow", { kinds: [1] }]);
    await client.waitFor(isType("EOSE", "slow"));
    expect(performance.now() - started).toBeGreaterThanOrEqual(55);
    expect(client.frames.map((f) => f[0])).toEqual(["EVENT", "EVENT", "EOSE"]);
  });

  test("delayed frames to a client that left are dropped", async () => {
    const { relay, client } = await relayWith({ latencyMs: 30 });
    client.send(["REQ", "gone", {}]);
    client.close();
    await Bun.sleep(150);
    expect(relay.received()).toHaveLength(1);
  });

  test("binary frames are decoded as text", async () => {
    const { relay } = await relayWith();
    const ws = new WebSocket(relay.url);
    await new Promise((r) => {
      ws.onopen = r;
    });
    const reply = new Promise<string>((r) => {
      ws.onmessage = (m) => r(String(m.data));
    });
    ws.send(new TextEncoder().encode('["COUNT","b",{}]'));
    expect(JSON.parse(await reply)).toEqual(["COUNT", "b", { count: 3 }]);
    ws.close();
  });

  test("answers plain HTTP requests without upgrading", async () => {
    const { relay } = await relayWith();
    // Bun.fetch, not the happy-dom fetch installed by the test preload. Response *bodies* are
    // asserted in the CLI test: in-process, happy-dom also replaces the global Response class.
    const http = relay.url.replace("ws://", "http://");
    expect((await Bun.fetch(http)).status).toBe(200);
    const nip11 = await Bun.fetch(http, { headers: { accept: "application/nostr+json" } });
    expect(nip11.status).toBe(200);
  });
});

describe("cli", () => {
  test("starts a seeded relay with NIP-11 info and stops on SIGTERM", async () => {
    const child = Bun.spawn(["bun", "run", `${import.meta.dir}/cli.ts`], {
      env: { ...process.env, PORT: "0", LATENCY_MS: "" },
      stdout: "pipe",
    });
    const reader = child.stdout.getReader();
    const { value } = await reader.read();
    const line = new TextDecoder().decode(value);
    const url = /ws:\/\/[\d.]+:\d+/.exec(line)?.[0];
    expect(url).toBeDefined();
    const http = String(url).replace("ws://", "http://");
    const info = await Bun.fetch(http, { headers: { accept: "application/nostr+json" } });
    expect(info.headers.get("content-type")).toBe("application/nostr+json");
    expect(await info.json()).toMatchObject({ supported_nips: [1, 11, 45] });
    expect(await (await Bun.fetch(http)).text()).toContain("test relay");
    child.kill("SIGTERM");
    expect(await child.exited).toBe(0);
  });

  test("rejects an invalid PORT", async () => {
    const child = Bun.spawn(["bun", "run", `${import.meta.dir}/cli.ts`], {
      env: { ...process.env, PORT: "abc" },
      stderr: "pipe",
    });
    expect(await child.exited).not.toBe(0);
    expect(await new Response(child.stderr).text()).toContain(
      "PORT must be a non-negative integer",
    );
  });
});
