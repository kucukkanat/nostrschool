// Owner: glossary agent. `short` feeds the hover-cards, `long` the glossary page.
// Facts follow the NIPs at github.com/nostr-protocol/nips (master, 2026).
import type { ChapterKey } from "../index.ts";
import type { Glossary, GlossaryId } from "./ids.ts";

/** `long` is plain text with blank lines between paragraphs. */
const paras = (...ps: readonly string[]): string => ps.join("\n\n");

export const glossaryEn: Glossary = {
  nostr: {
    term: "Nostr",
    short:
      "An open protocol for social apps: people sign messages with their own keys and publish them to any number of independent relays.",
    long: paras(
      'Nostr stands for "Notes and Other Stuff Transmitted by Relays". There is no central server and no account to create: your identity is a keypair, every message is a signed event, and relays are simple servers that store and forward events.',
      "Because events are signed, anyone can verify who wrote them no matter which relay delivered them. If one relay bans you, you publish somewhere else and your followers can still find you.",
    ),
    seeAlso: ["relay", "client", "event", "keypair", "censorship-resistance"],
    nips: ["01"],
  },
  relay: {
    term: "Relay",
    short:
      "A server that accepts events from clients, stores them and sends them to anyone who subscribes with a matching filter.",
    long: paras(
      "Relays speak a tiny protocol over WebSocket (NIP-01): clients send EVENT to publish, REQ to subscribe and CLOSE to stop; relays answer with EVENT, OK, EOSE, CLOSED and NOTICE.",
      "Relays do not talk to each other and do not own your identity. Each one sets its own rules: some are free and open, some are paid, some require authentication, and any of them may drop events it does not want. Clients usually read from and write to several relays at once.",
    ),
    seeAlso: ["client", "websocket", "subscription", "filter", "paid-relay", "outbox-model"],
    nips: ["01", "11", "42"],
  },
  client: {
    term: "Client",
    short:
      "The app you use (web, mobile or desktop) to create, sign, publish and read Nostr events.",
    long: paras(
      "A client holds or talks to your signer, connects to relays, sends subscriptions and renders the events it receives. All the smarts live here: choosing relays, building timelines, verifying signatures, counting reactions.",
      "Because your identity is just a keypair and your data is on relays, you can switch clients at any time and take your followers and posts with you.",
    ),
    seeAlso: ["relay", "signer", "nostr"],
    nips: ["01"],
  },
  event: {
    term: "Event",
    short:
      "The only data type in Nostr: a signed JSON object with an id, pubkey, created_at, kind, tags, content and sig.",
    long: paras(
      "Posts, profiles, reactions, follow lists, zap receipts and messages are all events. The kind number says what an event means; tags add structured references; content holds the text.",
      "The id is the SHA-256 hash of a canonical serialization, [0, pubkey, created_at, kind, tags, content], and sig is a Schnorr signature of that id by the author's private key. Change a single byte and verification fails.",
    ),
    seeAlso: ["event-id", "kind", "tag", "signature", "nip01"],
    nips: ["01"],
  },
  kind: {
    term: "Kind",
    short:
      "An integer on every event that says what it is: 0 is profile metadata, 1 a short text note, 3 a follow list, 7 a reaction, and so on.",
    long: paras(
      "Kinds are defined across the NIPs. Their numeric range also tells relays how to store them: 1000–9999 (plus 1, 2, 4–44) are regular and kept; 10000–19999 (plus 0 and 3) are replaceable; 20000–29999 are ephemeral and not stored; 30000–39999 are addressable.",
      "Clients ignore kinds they do not understand, which is how new features ship without breaking old apps.",
    ),
    seeAlso: ["event", "replaceable-event", "ephemeral-event", "addressable-event"],
    nips: ["01"],
  },
  tag: {
    term: "Tag",
    short:
      'An array of strings attached to an event, such as ["p", <pubkey>] to mention someone or ["e", <event id>] to reply to a note.',
    long: paras(
      "The first element is the tag name, the rest are values. Common ones: e (event reference), p (pubkey), a (addressable event coordinate), d (identifier of an addressable event), t (hashtag).",
      'Relays index single-letter tags, so a filter like {"#p": [<pubkey>]} finds every event that mentions a person.',
    ),
    seeAlso: ["event", "filter", "addressable-event"],
    nips: ["01", "10"],
  },
  pubkey: {
    term: "Public key",
    short:
      "Your public identity: a 32-byte secp256k1 key, shown as 64 hex characters or as an npub. Safe to share.",
    long: paras(
      "Nostr uses BIP-340 \"x-only\" public keys, derived from the private key. Every event carries the author's pubkey, and anyone can use it to check the event's signature.",
      "Inside events and relay messages pubkeys are always lowercase hex; the npub form is only for humans.",
    ),
    seeAlso: ["privkey", "npub", "keypair", "secp256k1"],
    nips: ["01", "19"],
  },
  privkey: {
    term: "Private key",
    short:
      "The 32-byte secret that proves you are you: whoever holds it can sign events as you. Never share it.",
    long: paras(
      "The private key (secret key) is a random 256-bit number between 1 and the secp256k1 curve order (points on the curve are public keys). It signs your events and, together with someone's public key, derives shared secrets for encrypted messages.",
      "There is no password reset in Nostr: if it leaks, an attacker can post as you forever; if you lose it, the identity is gone. Keep it in a dedicated signer instead of pasting it into websites.",
    ),
    seeAlso: ["nsec", "keypair", "signer", "key-loss"],
    nips: ["01", "19"],
  },
  npub: {
    term: "npub",
    short:
      "A public key encoded in bech32 so humans can copy it safely, e.g. npub1… instead of 64 hex characters.",
    long: paras(
      'Defined in NIP-19. The "npub" prefix tells you what the string is and the built-in checksum catches typos. Decoding an npub gives back exactly the same 32 bytes as the hex pubkey.',
      "npubs are for display, sharing and QR codes; the protocol itself always uses hex.",
    ),
    seeAlso: ["pubkey", "bech32", "nip19", "nsec"],
    nips: ["19"],
  },
  nsec: {
    term: "nsec",
    short: "A private key encoded in bech32 (nsec1…). Anyone who sees it can become you.",
    long: paras(
      'The distinct "nsec" prefix exists so software and people can recognise a secret at a glance and refuse to paste it where it does not belong.',
      "Treat an nsec like the master password of your whole Nostr identity: store it in a signer or password manager and never type it into a website.",
    ),
    seeAlso: ["privkey", "bech32", "nip19", "signer"],
    nips: ["19"],
  },
  keypair: {
    term: "Keypair",
    short:
      "A private key plus the public key derived from it. In Nostr, your keypair is your account.",
    long: paras(
      "Generating a keypair is instant and offline: pick 32 random bytes, multiply the secp256k1 generator point by them, and you have a public key. No server has to approve it.",
      "The math only works one way: the public key is easy to compute from the private key, but the private key cannot be recovered from the public key.",
    ),
    seeAlso: ["privkey", "pubkey", "secp256k1"],
    nips: ["01"],
  },
  secp256k1: {
    term: "secp256k1",
    short: "The elliptic curve Nostr (and Bitcoin) uses for its keys and signatures.",
    long: paras(
      "Private keys are numbers between 1 and the curve order (just under 2²⁵⁶); public keys are points on the curve. Nostr reuses Bitcoin's battle-tested libraries and the BIP-340 Schnorr scheme on this curve.",
      "The same curve also powers ECDH, which NIP-04 and NIP-44 use to derive shared secrets for encryption.",
    ),
    seeAlso: ["keypair", "schnorr", "ecdh"],
    nips: ["01"],
  },
  schnorr: {
    term: "Schnorr signature",
    short:
      "The signature scheme Nostr uses (BIP-340 on secp256k1): 64 bytes that prove the holder of a private key approved an event id.",
    long: paras(
      "Schnorr signatures are short, fast to verify and simple to reason about. Nostr signs the 32-byte event id, so the signature commits to every field of the event.",
      "BIP-340 signing can mix in fresh randomness (auxiliary data), so signing the same event twice can produce different, equally valid signatures.",
    ),
    seeAlso: ["signature", "secp256k1", "event-id"],
    nips: ["01"],
  },
  signature: {
    term: "Signature",
    short:
      "The sig field of an event: cryptographic proof that the owner of the pubkey created exactly this content.",
    long: paras(
      "Anyone can verify a signature with just the event and the public key, so relays and clients never need to trust each other: a forged or modified event simply fails verification.",
      "Signatures prove authorship, not truth or timing: created_at is whatever the author claimed.",
    ),
    seeAlso: ["schnorr", "event-id", "pubkey", "signer"],
    nips: ["01"],
  },
  hash: {
    term: "Hash",
    short:
      "A fixed-size fingerprint of some data. Change one byte of the input and the fingerprint changes completely.",
    long: paras(
      "Cryptographic hash functions are one-way (you cannot recover the input) and collision resistant (you cannot find two inputs with the same output). Nostr uses SHA-256.",
      "Hashing is how an event id identifies one exact event, and proof of work counts leading zero bits of that hash.",
    ),
    seeAlso: ["sha256", "event-id", "proof-of-work"],
  },
  sha256: {
    term: "SHA-256",
    short: "The hash function Nostr uses: it turns any input into 32 bytes (64 hex characters).",
    long: paras(
      "An event id is SHA-256 of the UTF-8 bytes of the serialized event. SHA-256 also appears inside NIP-44 (HKDF and HMAC) and in Lightning payment hashes.",
    ),
    seeAlso: ["hash", "event-id"],
    nips: ["01"],
  },
  bech32: {
    term: "Bech32",
    short:
      "A human-friendly text encoding with a readable prefix and a checksum, used for npub, nsec, note and friends.",
    long: paras(
      "Bech32 (BIP-173) uses a 32-character alphabet that avoids look-alike characters such as 1, b, i and o, and a checksum that catches typos. The part before the 1 (the human-readable part) says what is inside.",
      "NIP-19 uses plain bech32 (not bech32m) and allows strings longer than Bitcoin's 90-character limit so TLV entities like nevent fit.",
    ),
    seeAlso: ["nip19", "npub", "nsec", "note"],
    nips: ["19"],
  },
  nip: {
    term: "NIP",
    short:
      "Nostr Implementation Possibility: a short document describing one feature of the protocol, like NIP-01 (basics) or NIP-57 (zaps).",
    long: paras(
      "NIPs live in the nostr-protocol/nips repository on GitHub. Only NIP-01 is required; everything else is optional, and clients and relays advertise or simply implement the ones they care about.",
      "A NIP is adopted when several independent apps implement it, not by a vote, so the protocol grows by rough consensus and running code.",
    ),
    seeAlso: ["nip01", "nostr"],
  },
  nip01: {
    term: "NIP-01",
    short:
      "The core spec: event structure, ids and signatures, kind ranges, filters, and the client–relay messages.",
    long: paras(
      "If you implement NIP-01 you can publish and read on any relay. It defines the event JSON, how to serialize and hash it, Schnorr signatures, the EVENT/REQ/CLOSE client messages, the EVENT/OK/EOSE/CLOSED/NOTICE relay messages, and the regular/replaceable/ephemeral/addressable kind ranges.",
    ),
    seeAlso: ["event", "filter", "relay", "kind"],
    nips: ["01"],
  },
  nip04: {
    term: "NIP-04",
    short:
      "The original encrypted direct messages (kind 4). Deprecated: it hides the text but leaks who talks to whom and when.",
    long: paras(
      "NIP-04 encrypts content with AES-256-CBC using an ECDH shared secret, but the sender pubkey, the recipient p tag and the timestamp stay public, and the ciphertext has no authentication.",
      "New apps should use NIP-17 private messages (NIP-44 encryption plus NIP-59 gift wraps) instead.",
    ),
    seeAlso: ["nip17", "nip44", "direct-message", "ecdh"],
    nips: ["04"],
  },
  nip05: {
    term: "NIP-05",
    short:
      "Human-readable identifiers like alice@example.com that a domain vouches for, by mapping the name to a pubkey.",
    long: paras(
      'Put "nip05": "alice@example.com" in your profile; clients fetch https://example.com/.well-known/nostr.json?name=alice and check that the names entry points to your pubkey. The document may also list relays where you can be found.',
      "It is verification of a domain relationship, not of a real-world identity, and the pubkey stays the true identity if the domain disappears.",
    ),
    seeAlso: ["metadata", "pubkey"],
    nips: ["05"],
  },
  nip07: {
    term: "NIP-07",
    short:
      "A browser extension API (window.nostr) that lets websites ask for your pubkey and signatures without ever seeing your private key.",
    long: paras(
      "The extension exposes getPublicKey() and signEvent(event), plus optional nip04 and nip44 encrypt/decrypt. The website builds an unsigned event; the extension shows it to you and returns it signed.",
    ),
    seeAlso: ["signer", "nip46", "privkey"],
    nips: ["07"],
  },
  nip17: {
    term: "NIP-17",
    short:
      "Private direct messages: a kind 14 message is sealed and gift wrapped so relays cannot see sender, content or timing.",
    long: paras(
      "The chat message (kind 14) is an unsigned rumor; it is encrypted with NIP-44 into a kind 13 seal signed by the sender, which is encrypted again into a kind 1059 gift wrap signed by a throwaway key and addressed to the recipient.",
      "Users publish a kind 10050 list of the relays where they want to receive DMs. Separate wraps are made for every recipient and for the sender's own copy.",
    ),
    seeAlso: ["gift-wrap", "seal", "rumor", "nip44", "nip59", "direct-message"],
    nips: ["17", "44", "59"],
  },
  nip19: {
    term: "NIP-19",
    short:
      "Bech32-encoded identifiers for sharing: npub, nsec, note, plus nprofile, nevent and naddr that bundle relay hints.",
    long: paras(
      "The simple forms wrap raw 32 bytes. The TLV forms (type–length–value) pack extra fields such as relay URLs, author and kind, so a link carries enough hints to find the data.",
      "These strings are for display and sharing only. NIP-21 adds the nostr: URI scheme (nostr:npub1…) for links.",
    ),
    seeAlso: ["bech32", "npub", "nsec", "note", "nprofile", "nevent", "naddr"],
    nips: ["19", "21"],
  },
  nip23: {
    term: "NIP-23",
    short:
      "Long-form content: blog-style Markdown articles as addressable kind 30023 events (drafts use 30024).",
    long: paras(
      "Each article has a d tag identifier, so editing republishes the same address instead of creating a new post. Optional tags include title, summary, image and published_at.",
    ),
    seeAlso: ["long-form", "addressable-event", "naddr"],
    nips: ["23"],
  },
  nip42: {
    term: "NIP-42",
    short:
      "Authentication of clients to relays: the relay sends a challenge and the client answers with a signed kind 22242 event.",
    long: paras(
      'The relay sends ["AUTH", <challenge>]; the client replies ["AUTH", <event>] where the event carries relay and challenge tags. Relays use it to restrict reading or writing, for example to paying members or to the recipients of private messages.',
      'Relays signal that auth is needed with "auth-required:" prefixes in OK and CLOSED messages.',
    ),
    seeAlso: ["relay", "paid-relay", "signature"],
    nips: ["42"],
  },
  nip44: {
    term: "NIP-44",
    short:
      "Versioned, audited encryption for Nostr payloads (v2: ECDH + HKDF + ChaCha20 + HMAC-SHA256 with padding).",
    long: paras(
      'A conversation key is derived once per pair of keys from the ECDH shared secret with HKDF (salt "nip44-v2"). Each message gets a random 32-byte nonce, from which ChaCha20 and HMAC keys are derived; the plaintext is padded to hide its exact length and authenticated with HMAC-SHA256.',
      "It is a building block, not a messaging protocol: NIP-17 and NIP-59 use it to build private messages, and NIP-46 uses it for signer traffic.",
    ),
    seeAlso: ["encryption", "ecdh", "nip17", "nip59", "nip04"],
    nips: ["44"],
  },
  nip46: {
    term: "NIP-46",
    short:
      "Nostr Remote Signing (Nostr Connect): an app asks a separate signer, often called a bunker, to sign events over relays.",
    long: paras(
      "Requests and responses are kind 24133 events encrypted with NIP-44 between the app's temporary key and the remote signer. A connection starts from a bunker:// URI given by the signer or a nostrconnect:// URI shown by the app.",
      "The private key never leaves the signer, which can run on your phone, a server or a hardware device and can ask you to approve each request.",
    ),
    seeAlso: ["bunker", "signer", "nip07"],
    nips: ["46"],
  },
  nip57: {
    term: "NIP-57",
    short:
      "Lightning zaps: a signed zap request (kind 9734) and a zap receipt (kind 9735) that put Bitcoin tips on Nostr.",
    long: paras(
      "The client sends a zap request to the recipient's LNURL server (it is not published to relays), pays the returned invoice, and the recipient's wallet server publishes a zap receipt with the bolt11 invoice and the original request.",
      "The receipt is signed by the wallet server's nostrPubkey: it is that server's claim that the invoice was paid, not a proof of payment, and it does not authenticate the sender beyond the embedded signed zap request.",
    ),
    seeAlso: ["zap", "lightning", "lnurl", "lud16"],
    nips: ["57"],
  },
  nip59: {
    term: "NIP-59",
    short:
      "Gift wrap: a way to hide who sent an event by nesting it inside a seal and a wrap signed by a one-time key.",
    long: paras(
      "Three layers: the rumor (an unsigned event), the seal (kind 13, signed by the real author, rumor encrypted with NIP-44) and the gift wrap (kind 1059, signed by a random throwaway key, with a p tag for the recipient).",
      "Timestamps on the seal and wrap are randomized into the past so relays cannot correlate messages by time.",
    ),
    seeAlso: ["gift-wrap", "seal", "rumor", "nip17", "nip44"],
    nips: ["59"],
  },
  nip65: {
    term: "NIP-65",
    short:
      "Relay list metadata: a kind 10002 event listing the relays where you publish (write) and where you read your mentions (read).",
    long: paras(
      'Each relay is an r tag, optionally marked "read" or "write"; no marker means both. Clients fetch your posts from your write relays and deliver mentions of you to your read relays.',
      "This list is the foundation of the outbox model. NIP-65 advises keeping it small, about two to four relays per category.",
    ),
    seeAlso: ["outbox-model", "relay", "replaceable-event"],
    nips: ["65"],
  },
  filter: {
    term: "Filter",
    short:
      "A JSON object describing which events you want: by ids, authors, kinds, tags (#e, #p…), since, until and limit.",
    long: paras(
      'Within one filter every field must match (AND); within one field any value may match (OR). A REQ can carry several filters, and an event matches if it matches any of them. Example: {"kinds": [1], "authors": [<pubkey>], "limit": 20}.',
      "limit only applies to the initial batch of stored events, which relays return newest first. NIP-50 adds an optional search field for relays that support full-text search.",
    ),
    seeAlso: ["req", "subscription", "tag"],
    nips: ["01", "50"],
  },
  subscription: {
    term: "Subscription",
    short:
      "A standing query on a relay, opened with REQ and a subscription id: stored matches arrive first, then new events in real time.",
    long: paras(
      'The client chooses the subscription id. Events come back as ["EVENT", <subscription id>, <event>]; EOSE marks the end of stored events; the client ends it with CLOSE, and the relay may end it with CLOSED and a reason.',
      "Sending a new REQ with the same id replaces the old subscription on that connection.",
    ),
    seeAlso: ["req", "eose", "filter", "relay"],
    nips: ["01"],
  },
  req: {
    term: "REQ",
    short:
      'The client message that asks a relay for events: ["REQ", <subscription id>, <filter>, …].',
    long: paras(
      "A relay answers a REQ with every stored event that matches, then EOSE, then keeps streaming new matching events until the client sends CLOSE or the relay sends CLOSED.",
    ),
    seeAlso: ["subscription", "filter", "eose"],
    nips: ["01"],
  },
  eose: {
    term: "EOSE",
    short:
      '"End of stored events": the relay\'s signal that it has sent everything it had saved for a subscription; anything after is live.',
    long: paras(
      'Sent as ["EOSE", <subscription id>]. Clients use it to stop a loading spinner or to close one-shot queries. It does not end the subscription.',
    ),
    seeAlso: ["req", "subscription"],
    nips: ["01"],
  },
  websocket: {
    term: "WebSocket",
    short:
      "A long-lived two-way connection between browser and server. Clients and relays exchange Nostr messages over it as JSON arrays.",
    long: paras(
      "Relay URLs start with wss:// (or ws:// locally). One connection can carry many subscriptions at once, and the relay can push new events the moment they arrive, without polling.",
    ),
    seeAlso: ["relay", "req"],
    nips: ["01"],
  },
  zap: {
    term: "Zap",
    short:
      "A Lightning payment to someone on Nostr, publicly recorded as a zap receipt event on the note or profile you tipped.",
    long: paras(
      "Zaps turn likes into real value and give relays and clients a spam-resistant signal. Under the hood they follow NIP-57: zap request, Lightning invoice, payment, zap receipt.",
    ),
    seeAlso: ["nip57", "lightning", "lud16"],
    nips: ["57"],
  },
  lightning: {
    term: "Lightning Network",
    short:
      "A payment network on top of Bitcoin for instant, low-fee payments, settled by paying invoices.",
    long: paras(
      "A Lightning invoice (bolt11 string, lnbc…) commits to an amount and a payment hash; paying it reveals a preimage that proves payment. Nostr zaps are Lightning payments with a Nostr receipt.",
    ),
    seeAlso: ["zap", "lnurl", "lud16"],
    nips: ["57"],
  },
  lnurl: {
    term: "LNURL",
    short:
      "A set of HTTP conventions (the LUD specs) that let a wallet ask a server for a fresh Lightning invoice.",
    long: paras(
      "With LNURL-pay (LUD-06) the wallet fetches the server's pay parameters, then calls its callback with an amount to receive an invoice. For zaps the server advertises allowsNostr and a nostrPubkey and accepts a nostr zap request as a parameter.",
    ),
    seeAlso: ["lud16", "lightning", "nip57"],
    nips: ["57"],
  },
  lud16: {
    term: "Lightning address (lud16)",
    short:
      "An email-like payment address such as alice@wallet.example, stored as lud16 in your Nostr profile so people can zap you.",
    long: paras(
      "Defined by LUD-16: alice@wallet.example resolves to https://wallet.example/.well-known/lnurlp/alice, an LNURL-pay endpoint. NIP-57 clients read it from your kind 0 metadata to start a zap.",
    ),
    seeAlso: ["lnurl", "zap", "metadata"],
    nips: ["57"],
  },
  "outbox-model": {
    term: "Outbox model",
    short:
      "A strategy where clients read each person's posts from the relays that person writes to, instead of everyone sharing the same few relays.",
    long: paras(
      "Also called the gossip model. Using NIP-65 relay lists, a client looks up the write relays of everyone you follow and fetches from those, and delivers replies to the read relays of the people being mentioned.",
      "It keeps Nostr decentralized: no single relay needs everyone's data, and small relays remain reachable.",
    ),
    seeAlso: ["nip65", "relay", "follow-list"],
    nips: ["65"],
  },
  "follow-list": {
    term: "Follow list",
    short:
      "A kind 3 event listing the pubkeys you follow as p tags. Each new version replaces the previous one.",
    long: paras(
      "Because it is replaceable, a client must always publish the full list; publishing a stale copy accidentally unfollows people. Each p tag may carry a relay hint and a petname.",
      "Follow lists of everyone together form the social graph that clients use for timelines and web-of-trust ideas.",
    ),
    seeAlso: ["replaceable-event", "web-of-trust", "outbox-model"],
    nips: ["02"],
  },
  "gift-wrap": {
    term: "Gift wrap",
    short:
      "The outer layer of a private message: a kind 1059 event signed by a throwaway key, readable only by the recipient.",
    long: paras(
      "The wrap's content is a NIP-44 encrypted seal. Relays see only a random pubkey, a fuzzed timestamp and the recipient's p tag, so they cannot tell who sent it.",
    ),
    seeAlso: ["seal", "rumor", "nip59", "nip17"],
    nips: ["59"],
  },
  seal: {
    term: "Seal",
    short:
      "The middle layer of a gift-wrapped message: a kind 13 event signed by the real sender that contains the encrypted rumor.",
    long: paras(
      "The seal proves who the author is to the recipient (and only the recipient, since it is itself hidden inside the wrap). Its tags are always empty so nothing leaks.",
    ),
    seeAlso: ["gift-wrap", "rumor", "nip59"],
    nips: ["59"],
  },
  rumor: {
    term: "Rumor",
    short: "An event with an id but no signature: the innermost content of a gift-wrapped message.",
    long: paras(
      "Because it is unsigned, a leaked rumor cannot be proven to come from its author, which gives private messages deniability. Authenticity comes from the seal around it, whose pubkey must match the rumor's pubkey.",
    ),
    seeAlso: ["seal", "gift-wrap", "nip59"],
    nips: ["59"],
  },
  bunker: {
    term: "Bunker",
    short:
      "A remote signer (NIP-46) that keeps your private key and signs on request, so apps never touch the key.",
    long: paras(
      "You connect an app with a bunker:// URI containing the signer's pubkey, relays and an optional secret. Every signing request travels as an encrypted event, and the bunker can enforce permissions.",
    ),
    seeAlso: ["nip46", "signer"],
    nips: ["46"],
  },
  "replaceable-event": {
    term: "Replaceable event",
    short:
      "An event where only the newest one per author and kind is kept, like a profile (kind 0) or follow list (kind 3).",
    long: paras(
      "Kinds 0, 3 and 10000–19999 are replaceable. When a relay receives a newer one it may delete the older; if two share the same created_at, the one with the lowest id wins.",
    ),
    seeAlso: ["kind", "addressable-event", "metadata", "follow-list"],
    nips: ["01"],
  },
  "ephemeral-event": {
    term: "Ephemeral event",
    short:
      "An event (kinds 20000–29999) that relays forward to current subscribers but do not store.",
    long: paras(
      "Used for things that only matter right now, such as typing indicators, signer requests (kind 24133) and relay authentication (kind 22242).",
    ),
    seeAlso: ["kind", "replaceable-event"],
    nips: ["01"],
  },
  "addressable-event": {
    term: "Addressable event",
    short:
      "A replaceable event identified by kind, author and a d tag, so one person can have many of them (kinds 30000–39999).",
    long: paras(
      "Its address is kind:pubkey:d-tag; the newest event for that address wins. Articles (30023), lists and calendar events use it. Older docs call these parameterized replaceable events.",
      "Other events point to one with an a tag, and it is shared as an naddr.",
    ),
    seeAlso: ["replaceable-event", "naddr", "kind", "tag"],
    nips: ["01"],
  },
  federation: {
    term: "Federation",
    short:
      "A design where many servers interoperate but each account belongs to one server, as in email or Mastodon. Nostr deliberately avoids it.",
    long: paras(
      "In a federated network your identity (alice@server) and data live on your home server, so if the admin bans you or shuts down, you lose them. In Nostr your identity is a key and relays are interchangeable: they do not need to know about each other.",
    ),
    seeAlso: ["relay", "censorship-resistance", "nostr"],
  },
  "censorship-resistance": {
    term: "Censorship resistance",
    short: "The property that no single company or server can silence you or erase your identity.",
    long: paras(
      "Nostr gets it from self-owned keys and many independent relays: any relay may refuse your events, but none can stop you publishing elsewhere or forge your words. It is resistance, not immunity; reach still depends on relays and clients carrying your content.",
    ),
    seeAlso: ["relay", "federation", "outbox-model"],
  },
  "proof-of-work": {
    term: "Proof of work",
    short:
      "Grinding a nonce until the event id starts with enough zero bits, so each event costs some computation, as a spam deterrent.",
    long: paras(
      'NIP-13 adds a ["nonce", <counter>, <target difficulty>] tag. The difficulty is the number of leading zero bits in the id; each extra bit doubles the expected work. Relays can demand a minimum difficulty.',
    ),
    seeAlso: ["spam", "event-id", "hash"],
    nips: ["13"],
  },
  nevent: {
    term: "nevent",
    short:
      "A shareable bech32 link to an event that also carries relay hints and optionally the author and kind.",
    long: paras(
      "A NIP-19 TLV entity: type 0 is the event id, type 1 a relay URL (repeatable), type 2 the author pubkey and type 3 the kind. The hints help a client find the event on relays it does not already use.",
    ),
    seeAlso: ["note", "nip19", "event-id"],
    nips: ["19"],
  },
  nprofile: {
    term: "nprofile",
    short: "A shareable bech32 link to a profile: the pubkey plus relays where it can be found.",
    long: paras(
      "A NIP-19 TLV entity with the pubkey (type 0) and any number of relay URLs (type 1). Prefer it to a bare npub when you want others to actually find the person's events.",
    ),
    seeAlso: ["npub", "nip19"],
    nips: ["19"],
  },
  naddr: {
    term: "naddr",
    short:
      "A shareable bech32 link to an addressable event, such as an article, built from its kind, author and d tag.",
    long: paras(
      "A NIP-19 TLV entity: type 0 is the d tag identifier, type 1 relays, type 2 the author and type 3 the kind. Because it points to an address, the link keeps working after the article is edited.",
    ),
    seeAlso: ["addressable-event", "nip19", "nip23"],
    nips: ["19"],
  },
  note: {
    term: "note",
    short: 'Either a kind 1 text note (a "post"), or the note1… bech32 encoding of an event id.',
    long: paras(
      "Kind 1 is the plain-text post that timelines are made of; replies and threads are marked with e and p tags (NIP-10). The note1… string from NIP-19 wraps just the 32-byte id with no relay hints, so nevent is usually more useful.",
    ),
    seeAlso: ["event", "nevent", "nip19"],
    nips: ["01", "19"],
  },
  metadata: {
    term: "Metadata",
    short:
      "Your profile: a kind 0 event whose content is JSON with fields like name, about, picture, nip05 and lud16.",
    long: paras(
      "Kind 0 is replaceable, so updating your profile publishes a new one. Extra fields such as display_name, banner and website come from NIP-24.",
      "In privacy discussions (chapter 8) metadata means something else: data about a communication rather than its content, such as who talks to whom, when, how often and how long. Encryption hides the content, but metadata can still reveal a lot unless it is hidden too, which is what gift wraps are for.",
    ),
    seeAlso: ["replaceable-event", "nip05", "lud16"],
    nips: ["01", "24"],
  },
  reaction: {
    term: "Reaction",
    short: 'A kind 7 event reacting to another event: "+" means like, "-" dislike, or any emoji.',
    long: paras(
      "Reactions carry an e tag for the event and a p tag for its author, and may add a k tag with the reacted kind. Custom emoji use NIP-30 shortcodes.",
    ),
    seeAlso: ["event", "tag"],
    nips: ["25"],
  },
  repost: {
    term: "Repost",
    short:
      "A kind 6 event that shares someone else's note with your followers (kind 16 for other kinds).",
    long: paras(
      "The repost carries e and p tags pointing to the original and may embed the original event JSON in its content. Quoting instead is a new note with a q tag.",
    ),
    seeAlso: ["event", "note"],
    nips: ["18"],
  },
  deletion: {
    term: "Deletion request",
    short:
      "A kind 5 event asking relays and clients to remove some of your own earlier events. Not guaranteed.",
    long: paras(
      "It references events with e tags (or a tags for addressable events). Well-behaved relays stop serving them, but copies may persist on relays that ignore the request or on anyone's disk: on a public network nothing is truly deleted.",
    ),
    seeAlso: ["event", "relay"],
    nips: ["09"],
  },
  "paid-relay": {
    term: "Paid relay",
    short:
      "A relay that charges a fee, usually in sats, to publish or read, which funds the operator and keeps spam out.",
    long: paras(
      "Relays describe their policies in a NIP-11 information document (limitation.payment_required, fees) and commonly use NIP-42 auth to recognise paying members.",
    ),
    seeAlso: ["relay", "nip42", "spam"],
    nips: ["11", "42"],
  },
  "web-of-trust": {
    term: "Web of trust",
    short:
      "Using the follow graph to decide whom to trust: people followed by people you follow are probably not spammers.",
    long: paras(
      "It is not a single NIP but a family of client and relay techniques built on follow lists, mutes and reports. It filters spam and impersonators without a central moderator, at the cost of making new users harder to discover.",
    ),
    seeAlso: ["follow-list", "spam"],
    nips: ["02"],
  },
  ecdh: {
    term: "ECDH",
    short:
      "Elliptic-curve Diffie–Hellman: two people combine their own private key with the other's public key to get the same shared secret.",
    long: paras(
      "Alice computes privA × pubB and Bob computes privB × pubA; both arrive at the same point, and its x coordinate becomes the shared secret. NIP-04 uses it directly as an AES key; NIP-44 feeds it through HKDF.",
    ),
    seeAlso: ["encryption", "nip44", "secp256k1"],
    nips: ["04", "44"],
  },
  encryption: {
    term: "Encryption",
    short:
      "Scrambling content so only holders of the right key can read it. Nostr events are public unless their content is encrypted.",
    long: paras(
      "Nostr encrypts only content; the event envelope (pubkey, kind, tags, timestamp) stays public unless you hide it with gift wraps. NIP-44 is the current scheme; NIP-04 is deprecated.",
    ),
    seeAlso: ["nip44", "ecdh", "gift-wrap"],
    nips: ["44"],
  },
  "direct-message": {
    term: "Direct message",
    short:
      "A private message to one or more people. Modern Nostr DMs follow NIP-17; old ones used NIP-04.",
    long: paras(
      "With NIP-17, relays see only gift wraps addressed to the recipients, not who sent them or what they say. Remember that a leaked private key exposes all past messages: there is no forward secrecy.",
    ),
    seeAlso: ["nip17", "nip04", "gift-wrap"],
    nips: ["17"],
  },
  "long-form": {
    term: "Long-form content",
    short: "Articles and blog posts written in Markdown and published as kind 30023 events.",
    long: paras(
      "Because they are addressable, articles can be edited without breaking links. Reader apps render them like blog posts and link to them with naddr.",
    ),
    seeAlso: ["nip23", "addressable-event", "naddr"],
    nips: ["23"],
  },
  "event-id": {
    term: "Event id",
    short:
      "The SHA-256 hash of an event's serialized fields, written as 64 lowercase hex characters. It names exactly one event.",
    long: paras(
      "Serialize [0, pubkey, created_at, kind, tags, content] as compact JSON, encode it as UTF-8, hash it with SHA-256: that is the id. Relays and clients recompute it to detect tampering, and the signature is made over it.",
    ),
    seeAlso: ["sha256", "signature", "event"],
    nips: ["01"],
  },
  signer: {
    term: "Signer",
    short:
      "Software that holds your private key and signs events for apps: a browser extension, a phone app or a remote bunker.",
    long: paras(
      "Using a signer means apps never see your key, and you can approve or reject each request. Common options are NIP-07 browser extensions, NIP-46 remote signers and NIP-55 Android signer apps.",
    ),
    seeAlso: ["nip07", "nip46", "bunker", "privkey"],
    nips: ["07", "46", "55"],
  },
  "key-loss": {
    term: "Key loss",
    short:
      "Losing or leaking your private key. Nostr has no reset button, so either case means the identity is lost.",
    long: paras(
      "Without a central authority there is nobody to prove ownership to. Mitigations are operational: back up your nsec offline, use a signer, and if a key leaks, announce a new key from it while you still can and ask followers to switch.",
    ),
    seeAlso: ["privkey", "nsec", "signer"],
  },
  spam: {
    term: "Spam",
    short:
      "Unwanted bulk events. With free keys and open relays, Nostr fights spam with relay policies, payments, proof of work and the social graph.",
    long: paras(
      "Tools include paid relays, NIP-42 authentication, NIP-13 proof of work, web-of-trust filtering in clients, mute lists and NIP-56 reports (kind 1984). Each trades some openness for less noise.",
    ),
    seeAlso: ["paid-relay", "proof-of-work", "web-of-trust"],
    nips: ["13", "42", "56"],
  },
  invoice: {
    term: "Lightning invoice (BOLT11)",
    short:
      "A one-time Lightning payment request (an lnbc… string) for an exact amount, defined by BOLT11.",
    long: paras(
      "In a zap, the recipient's LNURL server returns a description-hash invoice whose description is the signed zap request; the zap receipt later carries it in a bolt11 tag.",
    ),
    seeAlso: ["lightning", "zap", "nip57"],
    nips: ["57"],
  },
  nip11: {
    term: "NIP-11",
    short:
      "The relay information document: JSON a relay serves over HTTP (Accept: application/nostr+json) describing its software, supported NIPs, limits and fees.",
    long: paras(
      "Clients fetch it from the relay's own URL (with https:// instead of wss://) before connecting, to learn whether the relay needs payment or authentication and how big events and subscriptions may be.",
    ),
    seeAlso: ["relay", "paid-relay", "nip42"],
    nips: ["11"],
  },
  ncryptsec: {
    term: "ncryptsec",
    short:
      "A password-encrypted private key (NIP-49), the recommended backup format; starts with ncryptsec1.",
    long: paras(
      "The key is encrypted with scrypt and XChaCha20-Poly1305, so a leaked backup is useless without the password.",
    ),
    seeAlso: ["nsec", "privkey", "key-loss"],
    nips: ["49"],
  },
};

/**
 * Where each term is taught. Locale-neutral (chapter keys), so it lives next to the English
 * source and the glossary page imports it via `@nostrschool/i18n/glossary/en.ts`.
 */
export const GLOSSARY_CHAPTERS: Readonly<Record<GlossaryId, ChapterKey>> = {
  nostr: "ch01",
  client: "ch01",
  nip: "ch01",
  federation: "ch01",
  "censorship-resistance": "ch01",
  pubkey: "ch02",
  privkey: "ch02",
  npub: "ch02",
  nsec: "ch02",
  keypair: "ch02",
  secp256k1: "ch02",
  bech32: "ch02",
  nip19: "ch02",
  nprofile: "ch02",
  event: "ch03",
  tag: "ch03",
  schnorr: "ch03",
  signature: "ch03",
  hash: "ch03",
  sha256: "ch03",
  nip01: "ch03",
  "event-id": "ch03",
  note: "ch03",
  nevent: "ch02",
  relay: "ch04",
  websocket: "ch04",
  subscription: "ch04",
  req: "ch04",
  eose: "ch04",
  nip42: "ch04",
  filter: "ch05",
  kind: "ch06",
  "replaceable-event": "ch06",
  "ephemeral-event": "ch06",
  "addressable-event": "ch06",
  metadata: "ch06",
  reaction: "ch06",
  repost: "ch06",
  deletion: "ch12",
  nip23: "ch06",
  "long-form": "ch06",
  naddr: "ch06",
  "follow-list": "ch07",
  "outbox-model": "ch07",
  nip65: "ch07",
  nip05: "ch10",
  "web-of-trust": "ch07",
  nip04: "ch08",
  nip17: "ch08",
  nip44: "ch08",
  nip59: "ch08",
  "gift-wrap": "ch08",
  seal: "ch08",
  rumor: "ch08",
  ecdh: "ch08",
  encryption: "ch08",
  "direct-message": "ch08",
  zap: "ch09",
  lightning: "ch09",
  lnurl: "ch09",
  lud16: "ch09",
  nip57: "ch09",
  nip07: "ch10",
  nip46: "ch10",
  bunker: "ch10",
  signer: "ch10",
  "paid-relay": "ch12",
  "proof-of-work": "ch12",
  "key-loss": "ch12",
  spam: "ch12",
  invoice: "ch09",
  nip11: "ch04",
  ncryptsec: "ch02",
};
