# @nostrschool/fixtures

A deterministic little Nostr world for lessons, demos and tests: seven personas, four fake relays,
and **60 real, validly signed events** committed in `src/data/events.json`. Every event verifies
with `nostr-tools`, so the rest of Nostr School needs no mocks.

> The persona keys are `sha256("nostrschool:persona:<id>")`. They are **public by design**.
> Never use them for anything real.

## The cast

| id | relays (NIP-65) | role in the story |
|---|---|---|
| alice | alpha rw, beta rw | explains relays, welcomes newcomers, writes an article |
| bob | beta rw, gamma read | asks questions, posts a hot take, deletes a mistake |
| carol | gamma rw, alpha write | photographer, quotes Bob |
| dave | delta write (paid), alpha rw | runs the paid relay |
| erin | alpha rw, gamma rw | artist, gets zapped |
| frank | beta rw, delta write (paid) | journalist, edits a long-form essay |
| grace | gamma rw | newcomer, her follow list grows |

Relays: `wss://relay.{alpha,beta,gamma,delta}.example` (`.example` never resolves). Delta is paid,
so only its members (Dave, Frank) have events there.

## What's in the data

| kind | what |
|---|---|
| 0 | a profile per persona, plus Alice's outdated one (replaceable events) |
| 1 | two threads with NIP-10 `root`/`reply` markers, a welcome with `nostr:npub` mentions, `t` hashtags, a quote (`q` tag) |
| 3 | follow lists (25 edges); Grace has an older, shorter one |
| 5 | Bob deletes his own mistaken note |
| 6 | two reposts (content is the stringified original) |
| 7 | reactions (`+`, `-`, emoji) with `e`/`p`/`k` tags |
| 1059 | four NIP-17 DMs; their kind 13 seals and kind 14 rumors are recovered by `giftWraps()` |
| 9734 / 9735 | three zaps: request (never on a relay) and the wallet-signed receipt |
| 10002 | relay lists |
| 30023 | two articles; Frank's has two versions with the same `d` tag |

Placement (which relay holds what) follows the outbox model: the author's write relays, the read
relays of everyone tagged (inbox), and Alpha for profiles/relay lists/follow lists.

## Usage

```ts
import {
  eventsByAuthor,
  eventsByKind,
  eventsOnRelay,
  followGraph,
  getPersona,
  giftWraps,
  relayListFor,
  relaysForEvent,
  zaps,
} from "@nostrschool/fixtures";

const alice = getPersona("alice");
console.log(alice.npub, alice.nip05, alice.lud16); // npub1…, alice@alpha.example, alice@wallet.alpha.example

console.log(eventsByKind(1).length);          // kind 1 notes, newest first
console.log(eventsByKind([6, 7]).length);     // several kinds at once
console.log(eventsByAuthor("bob")[0]?.kind);  // persona id or hex pubkey

const { nodes, edges } = followGraph();       // from each persona's latest kind 3
console.log(nodes.length, edges.length);      // 7 25

console.log(relayListFor("dave"));            // [{ url: "wss://relay.delta.example", read: false, write: true }, …]
console.log(eventsOnRelay("wss://relay.gamma.example").length);

for (const dm of giftWraps()) {
  // Decrypted for real (NIP-44) with the recipient's key on first call.
  console.log(`${dm.sender} → ${dm.recipient}: ${dm.rumor.content}`);
}

for (const z of zaps()) {
  console.log(`${z.sender} zapped ${z.recipient} ${z.amountMsats / 1000} sats`, relaysForEvent(z.receipt.id));
}
```

Verify anything yourself:

```ts
import { verifyEvent } from "nostr-tools/pure";
import { FIXTURE_EVENTS } from "@nostrschool/fixtures";

console.log(FIXTURE_EVENTS.every((e) => verifyEvent({ ...e, tags: e.tags.map((t) => [...t]) }))); // true
```

## Regenerating

```sh
bun run --cwd packages/fixtures generate
```

The story lives in `src/script.ts`. Keys, NIP-44 nonces and timestamps are fixed, and existing
signatures are reused by event id (BIP-340 signing is randomized), so regenerating an unchanged
story is byte-identical. A test fails if `events.json` is out of date with the script.

## Tests

```sh
bun test ./packages/fixtures/src
```

Every id is recomputed and every signature verified with `nostr-tools`; DMs are unwrapped with real
NIP-44; thread markers, mentions, hashtags, placement and zap receipts are checked.
