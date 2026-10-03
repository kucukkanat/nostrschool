# @nostrschool/test-relay

A real, in-memory NIP-01 relay on `Bun.serve` WebSockets. Integration tests talk to it over real
sockets (no mocks) and Playwright points live mode at it instead of the public internet.

What it speaks:

| Client sends | Relay answers |
|---|---|
| `["EVENT", e]` | `["OK", id, true, ""]`, or `false` with `invalid: …` (bad id/sig), `blocked: read-only relay`; `true` + `duplicate: …` for repeats/outdated replaceables. Matching live subscriptions get the event. |
| `["REQ", sub, ...filters]` | stored matches newest first (per-filter `limit`), then `["EOSE", sub]`; stays subscribed for new events |
| `["CLOSE", sub]` | (nothing — the subscription stops) |
| `["COUNT", sub, ...filters]` | `["COUNT", sub, { count }]` (ignores `limit`) |
| `["AUTH", e]` | `["OK", id, false, "restricted: this relay does not require AUTH"]` |
| malformed REQ/COUNT | `["CLOSED", sub, "invalid: …"]` |
| malformed EVENT/AUTH with a 64-hex `id` | `["OK", id, false, "invalid: …"]` |
| anything else malformed | `["NOTICE", "invalid: …"]` |

Storage follows NIP-01: ephemeral kinds (20000–29999) are broadcast but never stored; replaceable
(0, 3, 10000–19999) and addressable (30000–39999) kinds keep only the newest version per address.
Plain HTTP gets a NIP-11 document (`Accept: application/nostr+json`).

## In tests

```ts
import { FIXTURE_EVENTS } from "@nostrschool/fixtures";
import { startTestRelay } from "@nostrschool/test-relay";

const relay = await startTestRelay({ seed: FIXTURE_EVENTS }); // port 0 = any free port
const ws = new WebSocket(relay.url);
ws.onopen = () => ws.send(JSON.stringify(["REQ", "s1", { kinds: [1], limit: 2 }]));
ws.onmessage = (m) => console.log(m.data); // ["EVENT","s1",{…}] ×2, then ["EOSE","s1"]
await Bun.sleep(100);
console.log(relay.received()); // [["REQ","s1",{ kinds: [1], limit: 2 }]]
relay.notice("hello");         // NOTICE to every client
await relay.stop();
```

Options: `port` (0), `hostname` (`127.0.0.1`), `seed`, `verifySignatures` (true), `acceptWrites`
(true), `latencyMs` (0 — delays every outgoing frame, order preserved).

### Test helpers (`@nostrschool/test-relay/testing.ts`)

```ts
import { startTestRelay } from "@nostrschool/test-relay";
import { connectRawClient, signTestEvent } from "@nostrschool/test-relay/testing.ts";

const relay = await startTestRelay();
const client = await connectRawClient(relay.url);
const note = signTestEvent("alice", { kind: 1, content: "hi" }); // real, reproducible signature
client.send(["EVENT", note]);
console.log(await client.waitFor((f) => f[0] === "OK")); // ["OK", note.id, true, ""]
client.close();
await relay.stop();
```

## Standalone (Playwright `webServer`)

```bash
bun packages/test-relay/src/cli.ts                 # ws://127.0.0.1:7447, seeded with FIXTURE_EVENTS
PORT=7448 LATENCY_MS=150 bun packages/test-relay/src/cli.ts
```

Env: `PORT` (7447), `HOST` (127.0.0.1), `LATENCY_MS` (0). Stops cleanly on SIGINT/SIGTERM.

> Under `bun test` the preload installs happy-dom, which replaces the global `Response`: the relay's
> WebSocket side is unaffected, but its HTTP/NIP-11 responses are only correct out of process (CLI).
