# @nostrschool/protocol

Pure, step-exposing Nostr functions. Every intermediate value is returned so the UI can animate
it (serialize → hash → sign, 8-bit → 5-bit → checksum, ECDH → HKDF → ChaCha20 → HMAC, …).

- **No throwing, no I/O.** Fallible functions return `Result<T, E>` with a typed `error.code`.
- **Real crypto** via `@noble/*` and `@scure/base`; outputs are cross-checked against `nostr-tools`.
- **Official vectors**: NIP-44 (paulmillr/nip44, sha256-pinned), NIP-19 and NIP-13 spec examples,
  BIP-340.

| Module | What | Main exports |
|---|---|---|
| `event` | NIP-01 serialize / id / sign / verify / shape checks | `serializeEvent` `computeEventId` `signEvent` `verifyEvent` `validateEventShape` `parseEventJson` |
| `keys` | secp256k1 x-only keys | `generateKeypair` `keypairFromSecret` `getPublicKey` `deriveSecretKey` `isValidPublicKey` |
| `nip19` | bech32 entities with exposed steps | `nip19Encode` `nip19Decode` `encodeNpub` … `encodeNaddr` `BECH32_CHARSET` |
| `filter` | NIP-01 filters | `matchFilter` `matchFilters` `explainFilterMatch` `validateFilter` `applyFilters` |
| `messages` | wire frames | `parseRelayMessage` `parseClientMessage` `serializeMessage` |
| `nip44` | v2 encryption with steps | `nip44ConversationKey` `nip44MessageKeys` `nip44Encrypt` `nip44Decrypt` `nip44PaddedLength` |
| `nip04` | **deprecated** DMs, only for contrast | `nip04Encrypt` `nip04Decrypt` |
| `nip59` | gift wrap: rumor → seal → wrap | `createRumor` `giftWrap` `unwrapGiftWrap` |
| `nip05` | `name@domain` identifiers | `parseNip05` `verifyNip05Document` |
| `nip13` | proof of work | `countLeadingZeroBits` `getPowDifficulty` `getEffectivePow` `minePow` |
| `kinds` | kind registry (59 kinds) + NIP-01 ranges | `KINDS` `classifyKind` `getKindInfo` `nipUrl` |
| `tags`, `encoding`, `result` | helpers | `getTag` `sha256Hex` `ok` `err` `unwrap` … |

## Sign and verify an event (NIP-01)

```ts
import { deriveSecretKey, signEvent, verifyEvent } from "@nostrschool/protocol";

const sk = deriveSecretKey("readme:alice"); // demo key: anyone can derive it!
const signed = signEvent({ kind: 1, created_at: 1735689600, tags: [], content: "gm" }, sk);
if (signed.ok) {
  const { serialized, utf8Bytes, hash, id, sig, event } = signed.value; // every step
  console.log(serialized); // [0,"<pubkey>",1735689600,1,[],"gm"]
  console.log(verifyEvent(event).ok); // true
  const tampered = verifyEvent({ ...event, content: "gn" });
  if (!tampered.ok) console.log(tampered.error.code); // "id-mismatch"
}
```

Pass `{ auxRand: new Uint8Array(32) }` as the third argument for reproducible signatures.

## NIP-19 with the bech32 steps

```ts
import { nip19Decode, nip19Encode } from "@nostrschool/protocol";

const pubkey = "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e";
const steps = nip19Encode({ type: "npub", data: pubkey });
if (steps.ok) {
  const { dataBytes, words, checksumWords, dataChars, encoded } = steps.value;
  console.log(encoded); // npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg
}
const decoded = nip19Decode("nostr:npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg");
console.log(decoded.ok && decoded.value.entity); // { type: "npub", data: "7e7e…" }
const typo = nip19Decode("npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptq");
console.log(!typo.ok && typo.error.code); // "bad-checksum"
```

`nprofile` / `nevent` / `naddr` also return `steps.tlv` (type, length, value records).

## Filters, the way a relay applies them

```ts
import { applyFilters, deriveSecretKey, explainFilterMatch, signEvent, unwrap } from "@nostrschool/protocol";

const sk = deriveSecretKey("readme:bob");
const note = unwrap(signEvent({ kind: 1, created_at: 100, tags: [["t", "nostr"]], content: "hi" }, sk)).event;

console.log(explainFilterMatch({ kinds: [1], "#t": ["bitcoin"] }, note));
// { matches: false, checks: [{ field: "kinds", passed: true }, { field: "#t", passed: false }] }
console.log(applyFilters([{ kinds: [1], limit: 10 }], [note]).length); // 1 (newest first, per-filter limit)
```

## NIP-44 v2 encryption, step by step

```ts
import { generateKeypair, nip44ConversationKey, nip44Decrypt, nip44Encrypt } from "@nostrschool/protocol";

const alice = generateKeypair();
const bob = generateKeypair();
const key = nip44ConversationKey(alice.secretKey, bob.publicKey); // ECDH + HKDF-extract
if (key.ok) {
  const enc = nip44Encrypt("hola", key.value);
  if (enc.ok) {
    const { nonce, messageKeys, padded, ciphertext, mac, payload } = enc.value;
    const bobKey = nip44ConversationKey(bob.secretKey, alice.publicKey); // same key both ways
    if (bobKey.ok) console.log(nip44Decrypt(payload, bobKey.value)); // { ok: true, value: { plaintext: "hola", … } }
  }
}
```

`nip04Encrypt` / `nip04Decrypt` exist **only** to contrast with NIP-44: no MAC, raw ECDH key, AES-CBC.

## NIP-59 gift wrap (NIP-17 DMs)

```ts
import { generateKeypair, giftWrap, unwrapGiftWrap } from "@nostrschool/protocol";

const alice = generateKeypair();
const bob = generateKeypair();
const wrapped = giftWrap({
  template: { kind: 14, created_at: 1735689600, tags: [["p", bob.publicKey]], content: "psst" },
  senderSecretKey: alice.secretKey,
  recipientPubkey: bob.publicKey,
});
if (wrapped.ok) {
  const { rumor, seal, wrap, ephemeral } = wrapped.value; // rumor (no sig) → seal (13) → wrap (1059)
  const opened = unwrapGiftWrap(wrap, bob.secretKey);
  console.log(opened.ok && opened.value.rumor.content); // "psst"
}
```

Fix `ephemeralSecretKey`, `sealCreatedAt`, `wrapCreatedAt`, `sealNonce`, `wrapNonce` and `auxRand`
for fully reproducible fixtures.

## NIP-05 and NIP-13

```ts
import { deriveSecretKey, getPublicKey, minePow, parseNip05, unwrap, verifyNip05Document } from "@nostrschool/protocol";

const addr = unwrap(parseNip05("bob@example.com"));
console.log(addr.wellKnownUrl); // https://example.com/.well-known/nostr.json?name=bob
const pubkey = unwrap(getPublicKey(deriveSecretKey("readme:bob")));
console.log(verifyNip05Document({ names: { bob: pubkey } }, addr, pubkey).ok); // true

// Bounded, deterministic miner: resume with error.nextNonce when it returns "exhausted".
const mined = minePow({ kind: 1, created_at: 1735689600, tags: [], content: "work", pubkey }, 8, { maxAttempts: 50_000 });
console.log(mined.ok && mined.value.difficulty >= 8); // true
```

## Kinds

```ts
import { classifyKind, getKindInfo, KINDS, nipUrl } from "@nostrschool/protocol";

console.log(classifyKind(30023)); // "addressable"
console.log(getKindInfo(7)); // { kind: 7, name: "Reaction", category: "regular", nip: "25", i18nKey: "k7" }
console.log(KINDS.length, nipUrl("01"));
```

## Tests

```sh
bun test packages/protocol            # unit + integration (real crypto, official vectors)
bun test --coverage packages/protocol # 100% lines/functions
bun run --cwd packages/protocol typecheck
```
