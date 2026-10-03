# @nostrschool/data

One read-only `DataSource` for fixture data and live relays. Components call `getDataSource()`
and never know which one they got, so the same component runs on fixtures in tests and live in
the browser. There is intentionally no `publish`: live mode only ever sends `REQ` and `CLOSE`.

## Usage

```ts
import { $liveMode, getDataSource } from "@nostrschool/data";

const source = getDataSource(); // fixture unless $liveMode is true
const sub = source.subscribe([{ kinds: [1], limit: 10 }], {
  onEvent: (event, relay) => console.log(relay, event.content), // verified; once per relay
  onEose: (relay) => console.log("EOSE", relay),
  onAllEose: () => console.log("all relays done"),
  onRawMessage: (dir, relay, frame) => console.log(dir, relay, frame), // chapter 4 draws these
  onError: (e) => console.warn(e.code, e.relayUrl, e.message),
});
// later
sub.close(); // sends CLOSE, stops callbacks; idempotent
```

In a Svelte island, re-subscribe when the mode changes:

```ts
import { $liveMode, getDataSource } from "@nostrschool/data";

const unbind = $liveMode.subscribe(() => {
  const sub = getDataSource().subscribe([{ kinds: [0] }], { onEvent: (e) => console.log(e.pubkey) });
  return () => sub.close();
});
unbind();
```

## Stores

| Store | localStorage | Default |
|---|---|---|
| `$liveMode: boolean` | `nostrschool:live` (`"1"`/`"0"`) | `false` |
| `$liveRelays: readonly RelayUrl[]` | `nostrschool:live-relays` (JSON) | `DEFAULT_LIVE_RELAYS` (damus, nos.lol, primal) |

Invalid stored relay lists fall back to the defaults with a `console.warn`. `getDataSource()` caches
one source per mode; a changed `$liveRelays` replaces (and disposes) the live one.

## Fixture source

Synthesizes the whole NIP-01 conversation from `@nostrschool/fixtures` — raw `REQ` out, `EVENT`s
and `EOSE` in after each fixture relay's `latencyMs`, `CLOSE` out on `close()`. Deterministic;
callbacks are always asynchronous.

```ts
import { createFixtureSource } from "@nostrschool/data";

const source = createFixtureSource({ latencyMs: 0 }); // tests: no artificial delay
source.subscribe([{ kinds: [1], limit: 3 }], {
  onEvent: (e, relay) => console.log(relay, e.id),
  onAllEose: () => source.dispose(),
});

// Custom data: events missing from `placement` live on every relay.
const custom = createFixtureSource({
  events: [],
  relays: ["wss://fast.example", "wss://slow.example"],
  latencyMs: (url) => (url.includes("slow") ? 400 : 50),
});
custom.dispose();
```

## Live relay source

Raw WebSockets, one socket per relay per subscription. Every event is checked (id + Schnorr
signature, verified once per `id:sig` across relays) and must match the filters; per relay,
repeats are dropped. Errors are typed: `connect-failed`, `connect-timeout`, `eose-timeout` (then
`onEose` fires anyway and the subscription keeps listening), `invalid-message`, `invalid-event`,
`closed-by-relay`, `notice`, `socket-error`.

```ts
import { createLiveRelaySource } from "@nostrschool/data";
import { startTestRelay } from "@nostrschool/test-relay";

const relay = await startTestRelay();
const live = createLiveRelaySource({
  relays: [relay.url],
  connectTimeoutMs: 5000,
  eoseTimeoutMs: 8000,
  maxEvents: 500, // cap on unique events per subscription
});
live.subscribe([{ kinds: [1] }], {
  onEvent: (e) => console.log(e.content),
  onAllEose: async () => {
    live.dispose();
    await relay.stop();
  },
});
```

## Tests

`bun test packages/data` — fixture source against the real fixtures, live source against the real
in-memory test relay (and small real Bun servers that send scripted bad frames). No mocks.
