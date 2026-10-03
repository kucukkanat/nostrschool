// Owner: spec author r4 (NIPs 60–79). Adding a key? Also add it to ../../es/nips/r4.ts
// (English text + `// TODO(es)`). `text` holds every TextKey the NIP's spec references.
import type { NipStringsRange } from "../../../nips.ts";

export const r4 = {
  n60: {
    title: "Cashu Wallet",
    summary:
      "Keeps an ecash (Cashu) wallet on your relays, encrypted to yourself, so the same balance shows up in every app you sign in to.",
    text: {
      "how.wallet.title": "One wallet event holds the keys",
      "how.wallet.body":
        "A replaceable kind 17375 event stores the wallet setup: the mints you trust and a private key used only for receiving locked ecash. All of it is NIP-44 encrypted to yourself, so relays only see ciphertext.",
      "how.tokens.title": "Tokens are encrypted kind 7375 events",
      "how.tokens.body":
        "Each kind 7375 event holds unspent Cashu proofs from one mint. A proof is a bearer note: whoever holds its secret can spend it, which is why the whole content is encrypted.",
      "how.spend.title": "Spending rolls tokens over",
      "how.spend.body":
        "To pay 4 sats from a token worth 15, your client publishes a new token with the leftover proofs and lists the old token's id in `del`. The money never sits in two places at once.",
      "how.delete.title": "The spent token is deleted",
      "how.delete.body":
        'The old token event is removed with a NIP-09 deletion request. It must carry a ["k", "7375"] tag so other wallet apps can follow state changes with one filter.',
      "how.history.title": "History is optional",
      "how.history.body":
        "A kind 7376 event records what happened (in or out, how much, which tokens were created or destroyed). It is for your own overview; your balance comes from the token events, not from history.",
      "related.44": "Every wallet, token and history payload is NIP-44 encrypted to the owner.",
      "related.09": "Spent token events are removed with NIP-09 deletion requests tagged k=7375.",
      "related.61":
        "Nutzaps arrive locked to the wallet's private key, and the wallet redeems them.",
      "related.40": "Mint quote events expire after about two weeks using a NIP-40 expiration tag.",
      "related.65":
        "Clients find your wallet on your kind 10019 relays, or your NIP-65 relays as a fallback.",
      "flow.spend.label": "Spending from a token",
      "flow.spend.explain":
        "What a client publishes when you spend part of a token: a new token, a deletion and a history entry.",
      "flow.spend.rollover":
        "Publish the leftover proofs as a fresh token that lists the old id in `del`.",
      "flow.spend.delete": "Delete the old token event, tagging k=7375.",
      "flow.spend.history": "Optionally record the spend as a kind 7376 history event.",
      "wallet.label": "Wallet (kind 17375)",
      "wallet.explain":
        "The wallet itself: which mints you use and the private key that can spend P2PK-locked ecash sent to you. One per user (replaceable).",
      "wallet.content":
        "NIP-44 ciphertext you encrypt to your own pubkey. Decrypted, it is a list of [name, value] pairs.",
      "wallet.plaintext": 'A JSON array of pairs, for example ["mint", "https://…"].',
      "wallet.privkey":
        '["privkey", hex]: a secret key used only by this wallet to receive NIP-61 nutzaps. It is never your Nostr key.',
      "wallet.mint": '["mint", url]: a Cashu mint this wallet uses. At least one is required.',
      "wallet.example.label": "Alice's wallet with two mints",
      "wallet.example.explain":
        "Decrypts to a privkey pair plus two mint pairs. Try decrypting it with Alice's demo key.",
      "token.label": "Unspent proofs (kind 7375)",
      "token.explain":
        "A bundle of unspent ecash from one mint. You can have many of these; your balance is the sum of all of them.",
      "token.content":
        "NIP-44 ciphertext you encrypt to your own pubkey; decrypted, it is a JSON object.",
      "token.plaintext": "{ mint, unit, proofs, del }: the proofs and where they came from.",
      "token.mint":
        "The mint that issued these proofs. Proofs only work at the mint that signed them.",
      "token.unit": "The unit the amounts are in. Defaults to sat when omitted.",
      "token.proofs":
        "Cashu proofs in the standard format. Each one is worth a power-of-two amount.",
      "token.proof":
        "One Cashu proof: a keyset id, an amount, a secret and the mint's signature C.",
      "token.proof.id": "Keyset id: which of the mint's signing keys was used.",
      "token.proof.amount": "Value of this proof in the token's unit.",
      "token.proof.secret":
        "The secret that makes this proof spendable. Anyone who sees it can spend it.",
      "token.proof.C":
        "The mint's blind signature on the secret, as a compressed curve point (33 bytes hex).",
      "token.del":
        "Ids of token events that were used up to make this one. Helps other clients follow the change.",
      "token.example.fresh.label": "Freshly minted token",
      "token.example.fresh.explain":
        "Two proofs (1 and 8 sats) from the Alpha mint, nothing deleted.",
      "token.example.rolled.label": "Rolled-over token",
      "token.example.rolled.explain":
        "After a spend: the leftover proof moves into a new event and `del` points at the old one.",
      "deletion.label": "Token deletion (kind 5)",
      "deletion.explain":
        "A NIP-09 deletion request for a spent token event, with the extra k tag NIP-60 requires.",
      "deletion.content": "Optional reason. Usually empty.",
      "deletion.tag.e": "The token event being deleted.",
      "deletion.tag.e.id": "Id of the spent kind 7375 event.",
      "deletion.tag.k": "Required by NIP-60 so clients can filter wallet state changes.",
      "deletion.tag.k.kind": "Always 7375.",
      "deletion.example.label": "Delete a spent token",
      "deletion.example.explain":
        "Removes the old token after its unspent proofs were rolled over.",
      "history.label": "Spending history (kind 7376)",
      "history.explain":
        "An optional record of a balance change. Encrypted, except for redeemed nutzap references.",
      "history.content": "NIP-44 ciphertext you encrypt to yourself; decrypted, a list of tags.",
      "history.plaintext": "A JSON array of tags: direction, amount, unit and e references.",
      "history.direction": '["direction", "in" | "out"]: whether money arrived or left.',
      "history.direction.in": "Money received.",
      "history.direction.out": "Money sent.",
      "history.amount": '["amount", "4"]: how much changed, as a string.',
      "history.unit": '["unit", "sat"]: the unit of the amount. Defaults to sat.',
      "history.e": '["e", id, relay, marker]: a token event this change created or destroyed.',
      "history.e.relay": 'Relay hint. Often left empty ("").',
      "marker.created": "A new token event was created.",
      "marker.destroyed": "A token event was used up and deleted.",
      "marker.redeemed":
        "A NIP-61 nutzap was claimed. Leave these tags unencrypted so the sender can see it.",
      "history.tag.e":
        "Public reference to a redeemed nutzap. Only `redeemed` tags stay outside the encryption.",
      "history.tag.e.id": "Id of the kind 9321 nutzap event that was claimed.",
      "history.tag.e.marker": "Always `redeemed` for public tags.",
      "history.tag.p": "The nutzap sender, so they get notified that their ecash was claimed.",
      "history.tag.p.pubkey": "Pubkey of the person who sent the nutzap.",
      "history.example.label": "Alice spends 4 sats",
      "history.example.explain":
        "Decrypts to direction out, amount 4, one destroyed and one created token reference.",
      "quote.label": "Mint quote (kind 7374)",
      "quote.explain":
        "Remembers a pending Lightning quote at a mint, so any of your apps can finish minting once the invoice is paid.",
      "quote.content": "NIP-44 ciphertext of the quote id, encrypted to yourself.",
      "quote.plaintext": "The quote id the mint returned.",
      "quote.tag.expiration":
        "NIP-40 expiration. Quotes are useless after about two weeks, so relays can drop them.",
      "quote.tag.expiration.ts": "Unix time when relays may delete this event.",
      "quote.tag.mint": "The mint where the quote was created.",
      "quote.tag.mint.url": "Mint URL.",
      "quote.example.label": "A quote waiting to be paid",
      "quote.example.explain":
        "Expires two weeks after the demo date. Apps should prefer local state when they can.",
    },
  },
  n61: {
    title: "Nutzaps",
    summary:
      "Tips paid in Cashu ecash: the sender publishes ecash locked to the recipient's key, so the payment itself is the public receipt.",
    text: {
      "how.advertise.title": "Recipients say how to pay them",
      "how.advertise.body":
        "Bob publishes a kind 10019 event: the relays he reads nutzaps from, the mints he trusts and the public key ecash must be locked to.",
      "how.lock.title": "Ecash is locked to Bob's wallet key",
      "how.lock.body":
        "The pubkey tag is the public half of Bob's NIP-60 wallet key, not his Nostr key. Locked (P2PK) ecash can only be spent by whoever holds that wallet key.",
      "how.send.title": "Alice publishes the money",
      "how.send.body":
        "Alice mints ecash at one of Bob's mints, locks it to his key and publishes it as proof tags in a kind 9321 event on his relays. Anyone can see it, only Bob can spend it.",
      "how.receive.title": "Bob's wallet watches for nutzaps",
      "how.receive.body":
        "Bob's client subscribes to kind 9321 events that p-tag him, filtering with #u on the mints he listed so it never touches mints he didn't approve.",
      "how.redeem.title": "Claiming leaves a public mark",
      "how.redeem.body":
        "After swapping the ecash into his wallet, Bob publishes a kind 7376 event with an unencrypted e tag marked `redeemed`, so clients don't retry it and Alice can see it arrived.",
      "how.verify.title": "Anyone can check a nutzap offline",
      "how.verify.body":
        "Observers count a nutzap only if its mint is in Bob's 10019, the ecash is locked to his listed key and the DLEQ proof verifies. No mint request is needed.",
      "related.60": "The recipient's private key and redeemed tokens live in a NIP-60 wallet.",
      "related.65": "Redemption events go to the sender's NIP-65 read relays.",
      "related.57":
        "Lightning zaps: the same idea, but with a receipt signed by the recipient's wallet server.",
      "related.44": "Redemption history is NIP-44 encrypted like other NIP-60 history.",
      "flow.label": "Sending and claiming a nutzap",
      "flow.explain": "Bob advertises, Alice pays, Bob claims.",
      "flow.info": "Bob's kind 10019 tells senders his relays, mints and locking key.",
      "flow.nutzap": "Alice publishes locked ecash in a kind 9321 event.",
      "flow.redemption": "Bob swaps it into his wallet and marks it redeemed in a kind 7376 event.",
      "info.label": "Nutzap info (kind 10019)",
      "info.explain":
        "How to send ecash to this user: relays, accepted mints and the P2PK locking key.",
      "info.tag.relay": "A relay where this user reads incoming nutzaps. Senders publish there.",
      "info.tag.relay.url": "Relay URL.",
      "info.tag.mint":
        "A mint the user agrees to receive on. Money sent at other mints may never be claimed.",
      "info.tag.mint.url": "Mint URL. Senders must copy it exactly into the nutzap's u tag.",
      "info.tag.mint.unit": "Units this mint is used for (sat, usd…). Optional, one per position.",
      "info.tag.pubkey": "The public key nutzaps must be locked to.",
      "info.tag.pubkey.key":
        "Public key of the NIP-60 wallet key, usually with a 02 prefix (compressed form). Must not be the Nostr pubkey.",
      "info.example.label": "Bob accepts nutzaps",
      "info.example.explain": "Two relays, one mint in sats and his wallet's locking key.",
      "nutzap.label": "Nutzap (kind 9321)",
      "nutzap.explain":
        "Ecash locked to the recipient, published in public. The event is both payment and receipt.",
      "nutzap.content": "Optional comment from the sender.",
      "nutzap.tag.proof": "One Cashu proof as a JSON string. Repeat the tag for each proof.",
      "nutzap.tag.proof.json": "A Cashu proof locked to the recipient's key, with a DLEQ proof.",
      "nutzap.proof.json": "Standard Cashu proof object.",
      "nutzap.proof.amount": "Value of this proof (1, 2, 4, 8, 16…).",
      "nutzap.proof.C": "The mint's signature, as a 33-byte compressed point in hex.",
      "nutzap.proof.id": "Keyset id of the mint key that signed it.",
      "nutzap.proof.secret":
        'A NUT-11 secret: ["P2PK", {nonce, data}], where data is the recipient\'s locking key. That lock is what makes it safe to publish.',
      "nutzap.proof.dleq":
        "NUT-12 proof that the mint signed honestly. Lets anyone verify the nutzap without asking the mint.",
      "nutzap.tag.unit": "Unit of the proofs. Defaults to sat.",
      "nutzap.tag.unit.value": "sat, usd, eur…",
      "nutzap.tag.u": "The mint the proofs come from.",
      "nutzap.tag.u.mint": "Must match a mint URL in the recipient's kind 10019 exactly.",
      "nutzap.tag.e": "The event being nutzapped, if any.",
      "nutzap.tag.e.id": "Id of the note you are tipping.",
      "nutzap.tag.e.relay": "Where that note can be found.",
      "nutzap.tag.k": "Kind of the nutzapped event.",
      "nutzap.tag.k.kind": "Event kind, e.g. 1 for a note.",
      "nutzap.tag.p": "Who receives the money: their Nostr pubkey.",
      "nutzap.tag.p.pubkey": "The recipient's Nostr identity (not their wallet key).",
      "nutzap.example.label": "Alice tips Bob's note 21 sats",
      "nutzap.example.explain":
        "Three proofs (16 + 4 + 1) locked to Bob's wallet key, pointing at his note.",
      "nutzap.example.profile.label": "A 1-sat tip to a profile",
      "nutzap.example.profile.explain":
        "No e tag: the nutzap is for Bob himself, not a specific note.",
      "redemption.label": "Redemption record (kind 7376)",
      "redemption.explain":
        "The recipient's history entry after claiming a nutzap. The redeemed e tag stays public on purpose.",
      "redemption.content":
        "NIP-44 ciphertext encrypted to yourself: the same direction/amount/unit/e list as NIP-60 history.",
      "redemption.plaintext":
        "A JSON array of tags, e.g. direction in, amount 21 and the token event it created.",
      "redemption.tag.e":
        "Public pointer to the nutzap that was claimed. Several nutzaps can share one record.",
      "redemption.tag.e.id": "Id of the kind 9321 event.",
      "redemption.tag.e.relay": "Relay hint, may be empty.",
      "redemption.tag.e.marker": "Always `redeemed`.",
      "redemption.tag.p": "The sender of the nutzap, so their client can show it was received.",
      "redemption.tag.p.pubkey": "Sender's pubkey.",
      "redemption.example.label": "Bob claims Alice's nutzap",
      "redemption.example.explain":
        "Decrypts to direction in, 21 sats and the token it created. Publish to Alice's read relays.",
    },
  },
  n62: {
    title: "Request to Vanish",
    summary:
      "A signed request asking relays to permanently delete everything a key has published, either on named relays or everywhere at once.",
    text: {
      "how.target.title": "Name the relays",
      "how.target.body":
        "A kind 62 event lists each relay that should forget you in a relay tag. Clients should only send it to those relays.",
      "how.reason.title": "Add a note for the operator",
      "how.reason.body":
        "The content can hold a reason or a legal notice. In some places a request like this is legally binding.",
      "how.relay.title": "What the relay must do",
      "how.relay.body":
        "The relay deletes every event from that pubkey up to the request's created_at, including deletion requests, and should delete gift-wrapped DMs addressed to it. It must also refuse to accept those events again.",
      "how.global.title": "Or ask every relay",
      "how.global.body":
        'With ["relay", "ALL_RELAYS"] the request applies everywhere. Clients broadcast it to as many relays as they can.',
      "how.final.title": "There is no undo",
      "how.final.body":
        "A kind 5 deletion of the request does nothing, and paid or private relays must comply too. Use a fresh key afterwards.",
      "related.09":
        "NIP-09 deletion asks to remove specific events; vanish removes everything, deletions included.",
      "related.59": "Relays should also drop gift wraps (DMs) that p-tag the vanishing key.",
      "related.42": "Relays may require AUTH before accepting the request.",
      "vanish.label": "Request to vanish (kind 62)",
      "vanish.explain":
        "Asks the tagged relays to delete everything this pubkey has published so far.",
      "vanish.content": "Optional reason or legal notice for the relay operator.",
      "vanish.tag.relay": "A relay that must delete your data. At least one relay tag is required.",
      "vanish.tag.relay.target":
        "A relay URL (wss://…) to target that relay, or the literal ALL_RELAYS (upper case) to target every relay.",
      "vanish.tag.relay.all":
        "Every relay, not just the ones listed. Relays that see this delete your data even if they are not named.",
      "vanish.example.one.label": "Leave one relay",
      "vanish.example.one.explain": "Grace asks only the Gamma relay to forget her.",
      "vanish.example.all.label": "Vanish everywhere",
      "vanish.example.all.explain":
        "A global request with a legal note, meant to be broadcast widely.",
    },
  },
  n64: {
    title: "Chess (PGN)",
    summary:
      "Kind 64 notes carry chess games in PGN, the plain-text format chess software already reads, so clients can draw the board.",
    text: {
      "how.pgn.title": "The content is PGN",
      "how.pgn.body":
        'The whole game goes in the content: optional [Header "value"] lines, then the moves in algebraic notation, ending with the result (1-0, 0-1, 1/2-1/2 or * for unfinished).',
      "how.formats.title": "Strict out, lax in",
      "how.formats.body":
        "Publish in PGN export format (machine tidy), but expect hand-typed import format from others and parse leniently.",
      "how.alt.title": "Help clients that can't show boards",
      "how.alt.body":
        "An alt tag gives a one-line description for clients that don't support kind 64, so they show something readable.",
      "how.validate.title": "Checking the moves",
      "how.validate.body":
        "Clients should check that the PGN parses and every move is legal. Relays may reject invalid games.",
      "related.31": "The alt tag comes from NIP-31.",
      "game.label": "Chess game (kind 64)",
      "game.explain": "A chess game, finished or in progress, as PGN text.",
      "game.content": "A PGN database: headers in square brackets, then moves and the result.",
      "game.tag.alt": "Human-readable description for clients that don't render chess.",
      "game.tag.alt.summary": 'e.g. "Fischer vs. Spassky, 1992, draw".',
      "game.example.opening.label": "One move in",
      "game.example.opening.explain":
        "The shortest useful PGN: 1. e4 and * because the game is still going.",
      "game.example.ruy.label": "Players and a comment",
      "game.example.ruy.explain": "Two header lines and a {comment} inside the moves.",
      "game.example.full.label": "A complete famous game",
      "game.example.full.explain": "Fischer vs. Spassky 1992, round 29, with the seven-tag roster.",
    },
  },
  n65: {
    title: "Relay List Metadata",
    summary:
      "Your kind 10002 relay list says where you publish and where you read mentions, so others know where to find you (the outbox model).",
    text: {
      "how.list.title": "List your relays",
      "how.list.body":
        "A replaceable kind 10002 event holds one r tag per relay. Publishing a new one replaces the old list.",
      "how.markers.title": "Read, write or both",
      "how.markers.body":
        'Add "write" for relays you publish to, "read" for relays where you look for mentions. No marker means both.',
      "how.reading.title": "Fetching someone's posts",
      "how.reading.body":
        "To load Dave's notes, connect to his write relays. To find replies that mention Dave, use his read relays.",
      "how.publishing.title": "Publishing",
      "how.publishing.body":
        "Send your event to your own write relays and to the read relays of everyone you tag. Also send your 10002 along so others can find you next time.",
      "how.small.title": "Keep it small",
      "how.small.body":
        "Two to four relays of each type is plenty. Every extra relay is one more connection for everyone who follows you.",
      "related.01": "Kind 10002 is a replaceable event (NIP-01): only the newest one counts.",
      "related.02": "Follow lists say who; relay lists say where to find them.",
      "related.51": "NIP-51 lists cover other relay sets, such as search or blocked relays.",
      "related.17": "Private messages use a separate kind 10050 inbox list.",
      "list.label": "Relay list (kind 10002)",
      "list.explain": "Where this user writes and where they read mentions.",
      "list.tag.r": "One relay. Repeat for each relay.",
      "list.tag.r.url": "Relay URL (wss://…).",
      "list.tag.r.marker": "Optional: read or write. Leave it out for both.",
      "marker.read": "Read: look here for events that mention this user.",
      "marker.write": "Write: this user publishes here; fetch their posts from it.",
      "list.example.alice.label": "Alice: two read-write relays",
      "list.example.alice.explain":
        "No markers, so both Alpha and Beta are used for reading and writing.",
      "list.example.dave.label": "Dave: write-only paid relay",
      "list.example.dave.explain":
        "Dave publishes to his paid Delta relay but doesn't use it as an inbox; Alpha does both.",
      "list.example.bob.label": "Bob: reads mentions on Gamma",
      "list.example.bob.explain": "Beta for everything, plus Gamma only for reading mentions.",
    },
  },
  n66: {
    title: "Relay Discovery and Liveness Monitoring",
    summary:
      "Monitors probe relays and publish what they find (uptime, speed, supported NIPs, rules), so clients can discover relays and skip dead ones.",
    text: {
      "how.monitor.title": "A monitor announces itself",
      "how.monitor.body":
        "A kind 10166 event says this key publishes relay reports regularly: how often, which checks it runs and its timeouts.",
      "how.probe.title": "One report per relay",
      "how.probe.body":
        "For each relay it checks, the monitor publishes an addressable kind 30166 event whose d tag is the relay's normalized URL, so the newest report replaces the last one.",
      "how.facts.title": "Tags describe the relay",
      "how.facts.body":
        'Round-trip times, network, supported NIPs (N), requirements like auth or payment (R, with ! for "not required"), accepted kinds and location. One value per tag; repeat tags for lists.',
      "how.query.title": "Clients filter reports",
      "how.query.body":
        "Looking for a Tor relay that supports NIP-50? Query kind 30166 with #n and #N filters instead of probing hundreds of relays yourself.",
      "how.trust.title": "Don't trust one monitor",
      "how.trust.body":
        "A monitor can be wrong or lie. Compare several, and never refuse to connect to a relay just because there is no report about it.",
      "related.11":
        "Many facts mirror the relay's NIP-11 document, which can be embedded in the content.",
      "related.52": "The g tag is a NIP-52 style geohash.",
      "related.65": "Monitors should also publish a relay list so their reports can be found.",
      "related.32": "The l tag is a NIP-32 label, e.g. the relay's language.",
      "flow.label": "Monitoring relays",
      "flow.explain": "A monitor announces itself, then keeps publishing reports.",
      "flow.monitor": "Announce the monitor's schedule and checks.",
      "flow.discovery": "Publish a report for each relay it probed.",
      "discovery.label": "Relay report (kind 30166)",
      "discovery.explain": "What a monitor measured about one relay. Addressed by the relay URL.",
      "discovery.content": "Optional: the relay's NIP-11 document as a JSON string. Empty is fine.",
      "discovery.tag.d": "Which relay this report is about.",
      "discovery.tag.d.relay": "Normalized relay URL, or a hex pubkey for relays without a URL.",
      "discovery.tag.rtt-open": "How long opening a connection took.",
      "discovery.tag.rtt-read": "How long a read (REQ to first answer) took.",
      "discovery.tag.rtt-write": "How long a write (EVENT to OK) took.",
      "discovery.rtt.ms": "Milliseconds.",
      "discovery.tag.n": "Network the relay is on.",
      "discovery.tag.n.network": "clearnet, tor, i2p or loki.",
      "discovery.tag.T": "Relay type in PascalCase, e.g. PrivateInbox or PublicOutbox.",
      "discovery.tag.T.type": "A PascalCase relay type.",
      "discovery.tag.N": "A NIP the relay supports. One tag per NIP.",
      "discovery.tag.N.nip": "NIP number, e.g. 42.",
      "discovery.tag.R": "A requirement from NIP-11 limitations: auth, writes, pow, payment.",
      "discovery.tag.R.requirement":
        "Requirement name; prefix with ! when it is NOT required (!auth).",
      "discovery.tag.t": "A topic the relay is about.",
      "discovery.tag.t.topic": "Topic word.",
      "discovery.tag.k": "A kind the relay accepts, or refuses with a ! prefix.",
      "discovery.tag.k.kind": "Kind number, optionally prefixed with !.",
      "discovery.tag.g": "Where the relay is, as a geohash.",
      geohash: "Geohash, lower case. Longer = more precise.",
      "discovery.tag.l": "A label, e.g. the relay's main language.",
      "discovery.tag.l.label": "Label value, e.g. en.",
      "discovery.tag.l.namespace": "Label namespace, e.g. ISO-639-1.",
      "discovery.example.delta.label": "Report on a paid relay",
      "discovery.example.delta.explain":
        "Delta requires payment and AUTH, supports NIPs 1/11/42/70 and refuses kind 4 DMs.",
      "discovery.example.nip11.label": "Report with NIP-11 document",
      "discovery.example.nip11.explain":
        "Gamma is free and open; its NIP-11 JSON is embedded in the content.",
      "monitor.label": "Monitor announcement (kind 10166)",
      "monitor.explain": "Says this key publishes relay reports on a schedule, and how it tests.",
      "monitor.tag.frequency": "How often the monitor publishes reports.",
      "monitor.tag.frequency.seconds": "Seconds between runs.",
      "monitor.tag.timeout":
        "Timeout for a check. The NIP text and its example disagree on order; the example (check, then ms) is what monitors publish.",
      "monitor.tag.timeout.check": "Which check the timeout applies to.",
      "monitor.tag.timeout.ms": "Timeout in milliseconds.",
      "monitor.tag.c": "A check this monitor runs, in lower case.",
      "monitor.tag.c.check": "open, read, write, auth, nip11, dns, geo, ssl, ws…",
      "monitor.tag.g": "Where the monitor runs from (latency depends on it).",
      "monitor.example.label": "Hourly monitor",
      "monitor.example.explain": "Dave checks relays every hour with five kinds of tests.",
    },
  },
  n67: {
    title: "EOSE Completeness Hint",
    summary:
      "Relays can add a hint to EOSE saying whether they sent every stored match or have more, so clients know when to stop paging.",
    text: {
      "how.problem.title": "The guessing problem",
      "how.problem.body":
        "Relays cap results (often a few hundred). A client asking for 500 that gets 300 can't tell whether that's everything or a cap, so it guesses and either misses data or makes an extra request.",
      "how.hint.title": "A third element on EOSE",
      "how.hint.body":
        'The relay may add an array of hints after the subscription id: ["EOSE", "sub", ["finish"]].',
      "how.finish.title": "finish, more, auth",
      "how.finish.body":
        "finish: nothing more is stored, stop paging. more: keep paging with until. auth: there may be more if you AUTH (the relay sends the challenge first). Several hints can appear together.",
      "how.absent.title": "No hint means nothing",
      "how.absent.body":
        "Hints are definitive when present. Without finish or more, page as before using until = the oldest created_at you received.",
      "how.compat.title": "Safe for old software",
      "how.compat.body":
        "Old clients ignore the extra element, and old relays keep sending two elements. Unknown hint values must be ignored.",
      "related.01": "Adds an optional element to NIP-01's EOSE message.",
      "related.42": "The auth hint points to NIP-42 authentication.",
      "related.11": "Supporting relays list 67 in supported_nips.",
      "flow.label": "Paging with hints",
      "flow.explain": "Ask, receive stored events, read the hint.",
      "flow.req": "The client subscribes with a filter.",
      "flow.eose": "After the stored events, EOSE says whether there is more.",
      "eose.label": "EOSE with hints",
      "eose.explain": "End of stored events, plus what the relay knows about completeness.",
      "eose.sub": "The subscription id from the REQ.",
      "eose.hints": "Optional array of hint strings. May be empty.",
      "hint.finish": "Every stored match was sent. Don't paginate.",
      "hint.more": "More stored matches exist. Paginate to get them.",
      "hint.auth": "More may be visible after AUTH.",
      "eose.example.finish.label": "Complete",
      "eose.example.finish.explain": "The relay sent everything it has for this filter.",
      "eose.example.more.label": "Capped",
      "eose.example.more.explain": "The relay stopped at its internal limit; ask again with until.",
      "eose.example.auth.label": "Complete unless you log in",
      "eose.example.auth.explain": "Everything public was sent; AUTH may reveal more.",
      "eose.example.legacy.label": "Old-style EOSE",
      "eose.example.legacy.explain": "No hint: fall back to the usual pagination guess.",
      "req.label": "REQ (NIP-01)",
      "req.explain": "The subscription the hint answers. Unchanged from NIP-01.",
      "req.sub": "Subscription id chosen by the client.",
      "req.filter": "A filter. Note the limit: the relay's own cap may be lower.",
      "req.example.label": "Ask for 500 of Alice's notes",
      "req.example.explain": "If the relay caps at 300, only an EOSE hint tells the client.",
    },
  },
  n68: {
    title: "Picture-first feeds",
    summary:
      "Kind 20 posts are built around photos, Instagram-style: images hosted elsewhere and described in imeta tags, with a caption as content.",
    text: {
      "how.host.title": "Upload first, then describe",
      "how.host.body":
        "Images live on media servers. Each imeta tag describes one image: its URL, type, size, hash, alt text and fallback copies.",
      "how.post.title": "Title and caption",
      "how.post.body":
        "A title tag is required. The content is the caption. Several imeta tags make one multi-picture post.",
      "how.filter.title": "Tags for filtering",
      "how.filter.body":
        "Repeat each image's media type in an m tag and its hash in an x tag, so clients can ask relays only for formats they can show or find a picture by hash.",
      "how.annotate.title": "Tag people in the picture",
      "how.annotate.body":
        'An imeta entry "annotate-user <pubkey>:<x>:<y>" places a profile link at a pixel position. Add a p tag for each person too.',
      "how.video.title": "Mixing with short video",
      "how.video.body": "Picture feeds can show NIP-71 kind 22 short videos alongside.",
      "related.92": "imeta tags are defined by NIP-92.",
      "related.94": "The x hash and other imeta fields follow NIP-94 file metadata.",
      "related.71": "Short videos (kind 22) can appear in the same feed.",
      "related.36": "content-warning for sensitive pictures comes from NIP-36.",
      "related.B7": "Blossom servers are a common place to host the images.",
      "picture.label": "Picture post (kind 20)",
      "picture.explain": "One or more pictures shown as a single post, with a title and caption.",
      "picture.content": "The caption or description.",
      "picture.tag.title": "Short title of the post. Required.",
      "picture.tag.title.text": "Title text.",
      "picture.tag.imeta":
        'One image: space-separated "key value" entries. Repeat for each picture.',
      "picture.tag.imeta.url": 'The first entry: "url https://…" where the image lives.',
      "picture.tag.imeta.entry":
        'Another "key value" entry: m (media type), dim (WxH), x (sha256), alt, blurhash, thumbhash, fallback, annotate-user.',
      "picture.tag.content-warning": "Marks the post as sensitive; clients hide it behind a click.",
      "picture.tag.content-warning.reason": "Optional reason.",
      "picture.tag.p": "A person tagged in the post.",
      "picture.tag.p.pubkey": "Their pubkey.",
      "picture.tag.p.relay": "Optional relay hint.",
      "picture.tag.m": "Media type of an image, so relays can filter by format.",
      "picture.tag.m.type": "Only these image types are allowed.",
      "picture.tag.x": "SHA-256 of an image file, so it can be looked up by hash.",
      "picture.tag.x.hash": "Lower-case hex sha256 of the file.",
      "picture.tag.t": "Hashtag.",
      "picture.tag.t.tag": "Lower case, without #.",
      "picture.tag.location": "Where it was taken, in words.",
      "picture.tag.location.place": "City, region, country.",
      "picture.tag.g": "Where it was taken, as a geohash.",
      "picture.tag.g.geohash": "Lower-case geohash.",
      "picture.tag.L": "Label namespace, used with l for text that appears in the image.",
      "picture.tag.L.namespace": "e.g. ISO-639-1.",
      "picture.tag.l": "Language of text written in the image.",
      "picture.tag.l.language": "Language code, e.g. en.",
      "picture.example.single.label": "One photo",
      "picture.example.single.explain":
        "Carol's harbour shot with dimensions, blurhash, alt text, a fallback copy and location.",
      "picture.example.gallery.label": "Two photos, one person tagged",
      "picture.example.gallery.explain":
        "A JPEG and a WebP; the second annotates Bob at a pixel position.",
    },
  },
  n69: {
    title: "Peer-to-peer Order events",
    summary:
      "A shared format for bitcoin buy and sell offers, so P2P trading platforms can publish into one public order book instead of separate silos.",
    text: {
      "how.pool.title": "One order book for everyone",
      "how.pool.body":
        "Each platform publishes its offers as addressable kind 38383 events. Any client can show offers from all platforms together, which means more liquidity for traders.",
      "how.offer.title": "What's on offer",
      "how.offer.body":
        "k says buy or sell, f the fiat currency, fa the fiat amount (one value, or min and max for a range) and pm the payment methods.",
      "how.price.title": "How the price is set",
      "how.price.body":
        'amt is the sats amount. 0 means "use the market price when someone takes the order", adjusted by the premium percentage.',
      "how.status.title": "Updating the order",
      "how.status.body":
        "The d tag is the order id. The maker republishes with the same d as s changes: pending, in-progress, success, canceled or expired.",
      "how.trade.title": "Taking an order",
      "how.trade.body":
        "Taking and settling the trade happen on the platform named in y (and source). Expired pending orders should be marked expired; expiration lets relays drop them.",
      "related.01": "Orders are addressable events (kind 30000–39999), replaced by d tag.",
      "related.40": "The expiration tag is a NIP-40 deletion hint for relays.",
      "related.52": "The g geohash helps match face-to-face trades.",
      "order.label": "P2P order (kind 38383)",
      "order.explain": "A bitcoin buy or sell offer from one maker on one platform.",
      "order.tag.d": "Order id, unique per maker.",
      "order.tag.d.value": "Any unique id, often a UUID.",
      "order.tag.k": "Order type.",
      "order.tag.k.value": "sell or buy.",
      "order.k.sell": "The maker sells bitcoin for fiat.",
      "order.k.buy": "The maker buys bitcoin with fiat.",
      "order.tag.f": "Fiat currency.",
      "order.tag.f.value": "ISO 4217 code, e.g. EUR, USD, VES.",
      "order.tag.s": "Order status.",
      "order.tag.s.value": "Where the order is in its lifecycle.",
      "status.pending": "Open, waiting for a taker.",
      "status.canceled": "Withdrawn by the maker.",
      "status.in-progress": "Taken; trade under way.",
      "status.success": "Trade completed.",
      "status.expired": "Nobody took it before expires_at.",
      "order.tag.amt": "Bitcoin amount.",
      "order.tag.amt.value": "Satoshis; 0 = calculate from market price when taken.",
      "order.tag.fa": "Fiat amount: a fixed amount, or min and max for a range order.",
      "order.tag.fa.value": "The amount, or the minimum for a range.",
      "order.tag.fa.max": "Maximum, for range orders only.",
      "order.tag.pm": "Accepted payment methods.",
      "order.tag.pm.value": "One method per value, e.g. SEPA, cash, face to face.",
      "order.tag.premium": "Premium over market price.",
      "order.tag.premium.value": "Percent; negative for a discount.",
      "order.tag.source": "Where to see or take the order.",
      "order.tag.source.value": "URL on the platform.",
      "order.tag.rating": "The maker's reputation on the platform.",
      "order.tag.rating.value": "A JSON string; each platform computes it its own way.",
      "order.rating.json": "Rating summary.",
      "order.rating.total_reviews": "Number of reviews.",
      "order.rating.total_rating": "Average rating.",
      "order.rating.last_rating": "Most recent rating.",
      "order.rating.max_rate": "Best possible rating.",
      "order.rating.min_rate": "Worst possible rating.",
      "order.tag.network": "Bitcoin network.",
      "order.tag.network.value": "mainnet, testnet, signet…",
      "order.tag.layer": "Where the bitcoin moves.",
      "order.tag.layer.value": "onchain, lightning, liquid…",
      "order.tag.name": "Maker's display name.",
      "order.tag.name.value": "Name.",
      "order.tag.g": "Location for face-to-face trades.",
      "order.tag.g.value": "Geohash.",
      "order.tag.bond": "Security deposit both sides pay.",
      "order.tag.bond.value": "Amount.",
      "order.tag.expires_at": "When a pending order should turn expired.",
      "order.tag.expires_at.value": "Unix time.",
      "order.tag.expiration": "When relays may delete the event (NIP-40).",
      "order.tag.expiration.value": "Unix time.",
      "order.tag.y": "Platform that created the order.",
      "order.tag.y.value": "Platform name, e.g. mostro, lnp2pbot.",
      "order.tag.z": "Document type.",
      "order.tag.z.value": "Always order.",
      "order.example.sell.label": "Range sell order",
      "order.example.sell.explain":
        "Bob sells 20–100 EUR of sats at market price + 1%, via SEPA or in person.",
      "order.example.buy.label": "Completed buy order",
      "order.example.buy.explain":
        "Grace bought 50,000 sats for 50 USD in cash, at a 0.5% discount.",
    },
  },
  n70: {
    title: "Protected Events",
    summary:
      "Adding a [\"-\"] tag tells relays that only the author may publish this event, so others can't copy it to relays where it wasn't meant to be.",
    text: {
      "how.tag.title": "A one-character tag",
      "how.tag.body":
        'Add ["-"] to any event. It has no value; its presence alone marks the event as protected.',
      "how.default.title": "Relays refuse by default",
      "how.default.body":
        'A relay that doesn\'t implement this NIP must reject events carrying ["-"]. Only relays that check authorship may accept them.',
      "how.auth.title": "Prove you are the author",
      "how.auth.body":
        "A supporting relay asks the client to AUTH (NIP-42) and accepts the event only if the authenticated pubkey equals the event's pubkey.",
      "how.pirates.title": "Copies get bounced",
      "how.pirates.body":
        "If someone else sends the same signed event, their AUTH pubkey doesn't match, so the relay refuses it. Reposts must not embed protected events either.",
      "how.limits.title": "It's a request, not DRM",
      "how.limits.body":
        "Anyone who can read the event can still copy its text elsewhere. The tag only stops cooperating relays from helping.",
      "related.42": "Relays check authorship with NIP-42 AUTH.",
      "related.18": "Reposts of protected events must not embed the original.",
      "related.29": "Relay-based groups often protect their events this way.",
      "protected.label": "Protected event (any kind)",
      "protected.explain":
        'Any event with the ["-"] tag. Only its author may publish it to a relay.',
      "protected.content": "Whatever the event kind normally holds.",
      "protected.tag.dash": "Marks the event as protected. The tag has no values.",
      "protected.example.note.label": "Members-only note",
      "protected.example.note.explain":
        "Dave posts to members of his paid relay and doesn't want it spread.",
      "protected.example.article.label": "Subscriber article",
      "protected.example.article.explain":
        "Frank's long-form letter, meant to stay on his subscribers' relay.",
      "actor.dave": "Dave's client",
      "actor.relay": "Delta relay",
      "actor.pirate": "Someone else's client",
      "step.publish.label": 'EVENT with ["-"]',
      "step.publish.explain": "Dave publishes a protected note before authenticating.",
      "step.challenge.label": "AUTH challenge",
      "step.challenge.explain": "The relay asks the client to prove who it is.",
      "step.rejected.label": "OK false: auth-required",
      "step.rejected.explain": "Until Dave is authenticated, the protected event is refused.",
      "step.authenticate.label": "AUTH with signed 22242",
      "step.authenticate.explain":
        "Dave signs the challenge (NIP-42), proving he controls his pubkey.",
      "step.retry.label": "EVENT again",
      "step.retry.explain": "Dave resends the same event.",
      "step.accepted.label": "OK true",
      "step.accepted.explain":
        "The authenticated pubkey matches the event's author, so it is stored.",
      "step.republish.label": "Copied EVENT",
      "step.republish.explain": "Someone else tries to publish Dave's signed note.",
      "step.blocked.label": "OK false",
      "step.blocked.explain": "Their connection isn't authenticated as Dave, so the relay refuses.",
    },
  },
  n71: {
    title: "Video Events",
    summary:
      "Dedicated video posts for YouTube- or TikTok-style clients: landscape (kind 21) or short vertical (kind 22), with every resolution and audio track listed in imeta tags.",
    text: {
      "how.kinds.title": "Normal or short",
      "how.kinds.body":
        "Kind 21 is for regular, mostly landscape videos; kind 22 for short vertical ones (stories, reels). The difference is about presentation, not length.",
      "how.variants.title": "One imeta per file",
      "how.variants.body":
        "Each imeta tag describes one file: resolution (dim), type (m), URL, hash, preview image, bitrate and duration. Players pick the best variant for the screen and connection.",
      "how.fallbacks.title": "Mirrors and previews",
      "how.fallbacks.body":
        "fallback entries are other servers with the same file; image entries are preview frames. url and fallback are equally good. service nip96 tells clients they can find the file by hash on the author's server list.",
      "how.audio.title": "Separate audio tracks",
      "how.audio.body":
        "An imeta with an audio type is a separate soundtrack, e.g. per language. l marks the language, ov the original version, and waveform lets clients draw the sound.",
      "how.addressable.title": "Editable versions",
      "how.addressable.body":
        "Kinds 34235 and 34236 are addressable twins with a d tag, so you can fix titles or move hosts without breaking links. origin records where imported videos came from.",
      "related.92": "imeta tags come from NIP-92.",
      "related.94": "imeta fields like x, m and dim follow NIP-94.",
      "related.96": '"service nip96" points to the author\'s NIP-96 file servers.',
      "related.68": "Picture feeds (kind 20) can show short videos alongside.",
      "related.01": "Kinds 34235/34236 are addressable events (NIP-01).",
      "video.label": "Video (kind 21 / 22)",
      "video.explain": "A video post. Content is the description; imeta tags carry the files.",
      "video.content": "Summary or description of the video.",
      "video.tag.title": "Title of the video. Required.",
      "video.tag.title.text": "Title text.",
      "video.tag.imeta":
        'One video or audio file as "key value" entries. Repeat per resolution or track.',
      "video.tag.imeta.entry":
        '"key value": url, dim, m, x, image, fallback, service, bitrate, duration, waveform, l…',
      "video.tag.published_at": "When the video was first published (useful for imports).",
      "video.tag.published_at.ts": "Unix time as a string.",
      "video.tag.alt": "Accessibility description.",
      "video.tag.alt.text": "What the video shows.",
      "video.tag.text-track": "Captions, subtitles or chapters (WebVTT).",
      "video.tag.text-track.url": "Link to the WebVTT file.",
      "video.tag.text-track.type": "captions, subtitles, chapters or metadata.",
      "video.tag.text-track.lang": "Optional language code.",
      "video.tag.content-warning": "Marks the video as sensitive.",
      "video.tag.content-warning.reason": "Optional reason.",
      "video.tag.segment": "A chapter: start, end, title and optional thumbnail.",
      "video.tag.segment.start": "Start time, HH:MM:SS.sss.",
      "video.tag.segment.end": "End time, HH:MM:SS.sss.",
      "video.tag.segment.title": "Chapter title.",
      "video.tag.segment.thumb": "Optional thumbnail URL.",
      "video.tag.t": "Hashtag.",
      "video.tag.t.tag": "Lower case, without #.",
      "video.tag.p": "Someone who appears in the video.",
      "video.tag.p.pubkey": "Their pubkey.",
      "video.tag.p.relay": "Optional relay hint.",
      "video.tag.r": "A related web page.",
      "video.tag.r.url": "URL.",
      "video.tag.origin": "Where an imported video came from.",
      "video.tag.origin.platform": "Original platform, e.g. peertube.",
      "video.tag.origin.id": "Id on that platform.",
      "video.tag.origin.url": "Original URL.",
      "video.tag.origin.meta": "Optional extra metadata.",
      "video.tag.duration": "Total length, as used in the addressable example.",
      "video.tag.duration.seconds": "Seconds.",
      "video.example.normal.label": "Landscape video, two resolutions",
      "video.example.normal.explain":
        "Erin's time-lapse in 1080p and 720p, an English commentary track and two chapters.",
      "video.example.short.label": "Short vertical video",
      "video.example.short.explain": "A portrait clip (kind 22) tagging Alice.",
      "addressable.label": "Addressable video (kind 34235 / 34236)",
      "addressable.explain":
        "Same format as 21/22, plus a d tag so the event can be updated in place.",
      "addressable.tag.d": "Unique id for this video. Republish with the same d to update it.",
      "addressable.tag.d.id": "Any string you choose.",
      "addressable.example.label": "Imported episode",
      "addressable.example.explain":
        "Moved from another platform, with origin and the original publish date.",
    },
  },
  n72: {
    title: "Moderated Communities",
    summary:
      "Reddit-style communities where moderators approve posts. Not recommended any more: new projects should use NIP-29 relay-based groups.",
    text: {
      "how.unrecommended.title": "Unrecommended: use NIP-29",
      "how.unrecommended.body":
        'The NIP is marked unrecommended upstream with "try NIP-29 instead". Approvals by moderator keys proved fragile; NIP-29 lets a relay enforce group rules. It\'s documented here so you can read existing communities.',
      "how.define.title": "Define the community",
      "how.define.body":
        'The owner publishes an addressable kind 34550 event with a name, description, image, moderators (p tags with "moderator") and preferred relays.',
      "how.post.title": "Post into it",
      "how.post.body":
        "Posts are NIP-22 kind 1111 comments whose uppercase A/P/K tags point at the community. For top-level posts the lowercase tags point there too; in replies they point at the parent.",
      "how.approve.title": "Moderators approve",
      "how.approve.body":
        "A moderator publishes kind 4550 with the community's a tag, the post's e tag and author's p tag, and the full post JSON in the content, so it survives even if the original is lost.",
      "how.display.title": "Clients choose what to show",
      "how.display.body":
        "Clients show posts approved by the listed moderators. If moderators change, old approvals must be re-signed or posts disappear, which is one reason NIP-29 replaced this.",
      "related.29": "Recommended replacement: relay-based groups.",
      "related.22": "Community posts are NIP-22 kind 1111 comments.",
      "related.09": "Moderators can withdraw an approval with a NIP-09 deletion.",
      "related.18": "Cross-posting uses kind 6/16 reposts with community a tags.",
      "flow.label": "Community post lifecycle",
      "flow.explain": "Define, post, approve.",
      "flow.community": "The owner defines the community and its moderators.",
      "flow.post": "A member posts a kind 1111 comment scoped to it.",
      "flow.approval": "A moderator approves, embedding the post.",
      "community.label": "Community definition (kind 34550)",
      "community.explain": "Name, description, moderators and relays of one community.",
      "community.content": "Usually empty.",
      "community.tag.d": "Community identifier; shown as the name if there is no name tag.",
      "community.tag.d.id": "Short id, e.g. film-photography.",
      "community.tag.name": "Display name.",
      "community.tag.name.text": "Name.",
      "community.tag.description": "What the community is about.",
      "community.tag.description.text": "Description.",
      "community.tag.image": "Community image.",
      "community.tag.image.url": "Image URL.",
      "community.tag.image.dim": "Optional size, WxH.",
      "community.tag.p": "A moderator.",
      "community.tag.p.pubkey": "Moderator's pubkey.",
      "relay-hint": "Optional relay hint (may be empty).",
      "community.tag.p.role": "Role, normally moderator.",
      "community.tag.relay": "A relay the community uses.",
      "community.tag.relay.url": "Relay URL.",
      "community.tag.relay.marker": "What the relay is for; no marker = posts and approvals.",
      "community.marker.author": "Where the owner's profile lives.",
      "community.marker.requests": "Where to send and read post requests.",
      "community.marker.approvals": "Where to send and read approvals.",
      "community.example.label": "Film photography community",
      "community.example.explain": "Carol owns it; she and Alice moderate.",
      "post.label": "Community post (kind 1111)",
      "post.explain":
        "A NIP-22 comment scoped to a community. Old clients used kind 1 with an a tag; still readable, don't create new ones.",
      "post.content": "The post text.",
      "post.tag.A": "Root scope: always the community address.",
      "post.tag.A.value": "34550:<owner pubkey>:<d>.",
      "post.tag.a": "Parent: the community for top-level posts.",
      "post.tag.a.value": "Address of the parent.",
      "post.tag.e": "Parent post, for replies.",
      "post.tag.e.value": "Id of the post being replied to.",
      "post.tag.P": "Root author: the community owner.",
      "post.tag.P.value": "Owner's pubkey.",
      "post.tag.p": "Parent author.",
      "post.tag.p.value": "Pubkey of the parent's author.",
      "post.tag.K": "Root kind: 34550.",
      "post.tag.K.value": "Always 34550.",
      "post.tag.k": "Parent kind: 34550 at top level, usually 1111 in replies.",
      "post.tag.k.value": "Kind number.",
      "post.example.top.label": "Top-level post",
      "post.example.top.explain":
        "Bob asks the community a question; upper and lower tags both point at it.",
      "post.example.reply.label": "Reply",
      "post.example.reply.explain": "Carol answers; lowercase tags now point at Bob's post.",
      "how.legacy.title": "Older clients posted kind 1",
      "how.legacy.body":
        "Before NIP-22 comments existed, community posts were plain kind 1 notes with only a lowercase a tag pointing at the community. New posts should use kind 1111, but clients still read and approve these legacy posts.",
      "legacy.label": "Legacy community post (kind 1)",
      "legacy.explain":
        "The deprecated, pre-NIP-22 format: a kind 1 note tagged with the community. Shown for compatibility; publish kind 1111 instead.",
      "legacy.deprecated":
        "Legacy format: clients still read and approve kind 1 community posts, but new posts should be kind 1111 comments with A, P and K tags.",
      "legacy.tag.a":
        "The community this note was posted to (lowercase a, the only tag legacy posts carry).",
      "legacy.example.label": "Legacy post",
      "legacy.example.explain":
        "Bob posts the old way: a kind 1 note with just the community a tag.",
      "approval.label": "Approval (kind 4550)",
      "approval.explain": "A moderator's vote that a post belongs in the community.",
      "approval.content": "The approved event, JSON-encoded, so the exact version is preserved.",
      "approval.tag.a":
        "The community (34550:…). Other a tags point to approved addressable posts.",
      "approval.tag.a.address": "Coordinate kind:pubkey:d.",
      "approval.tag.e": "The approved post (approves that exact version).",
      "approval.tag.e.id": "Post id.",
      "approval.tag.p": "The post's author, so they get notified.",
      "approval.tag.p.pubkey": "Author's pubkey.",
      "approval.tag.k": "Kind of the approved post, for filtering.",
      "approval.tag.k.kind": "Kind number.",
      "approval.example.label": "Alice approves Bob's post",
      "approval.example.explain":
        "The content is Bob's real signed post; the validator checks its signature.",
    },
  },
  n73: {
    title: "External Content IDs",
    summary:
      "i and k tags point Nostr events at things outside Nostr (books, web pages, podcasts, places, blockchain transactions) so you can find every comment about them.",
    text: {
      "how.ids.title": "Name the thing",
      "how.ids.body":
        "An i tag holds a global id with a prefix that says what it is: isbn:…, geo:…, podcast:guid:…, a plain URL, bitcoin:tx:…",
      "how.kinds.title": "Say what kind of id it is",
      "how.kinds.body":
        "A k tag repeats the type (isbn, web, podcast:guid…), so clients can ask for all comments about books, or all about podcasts.",
      "how.normalise.title": "Write ids one way",
      "how.normalise.body":
        "Everyone must spell an id the same way or filters miss: ISBNs without hyphens, geohashes lower case, country codes upper case, URLs without the #fragment.",
      "how.hint.title": "Optional link",
      "how.hint.body": "A second value can be a URL where people can look the thing up.",
      "how.query.title": "Find the conversation",
      "how.query.body":
        'Query {"#i": ["isbn:9780765382030"]} to get every event about that book, from any client.',
      "related.22":
        "NIP-22 comments use I/K (root) and i/k (parent) to comment on external content.",
      "related.52": "Geohash ids work like NIP-52 location tags.",
      "related.24": "Hashtag ids (#topic) relate to the t tags in NIP-24.",
      "ref.label": "Event referencing external content",
      "ref.explain": "Any event kind can carry i/k tags. Comments (kind 1111) are the most common.",
      "ref.content": "Whatever the event kind normally holds.",
      "ref.tag.I":
        "Root external id, used by NIP-22 comments (upper case = the thing the thread is about).",
      "ref.tag.i": "External content id. Repeat for several.",
      "ref.tag.i.id":
        "Prefixed id: URL, isbn:, geo:, iso3166:, isan:, doi:, #topic, podcast:…guid:, <chain>:tx: or :address:.",
      "ref.tag.i.hint": "Optional URL to look it up.",
      "ref.tag.K": "Root id type, paired with I.",
      "ref.tag.k": "Id type, paired with i.",
      "ref.tag.k.kind": "Which kind of external id.",
      "k.web": "A web page URL.",
      "k.isbn": "A book, by ISBN without hyphens.",
      "k.geo": "A place, by lower-case geohash.",
      "k.iso3166": "A country or region, ISO 3166 upper case.",
      "k.isan": "A film, by ISAN without the version part.",
      "k.doi": "A paper, by lower-case DOI.",
      "k.hashtag": "A hashtag topic, lower case.",
      "k.podcast-guid": "A podcast feed.",
      "k.podcast-item": "A podcast episode.",
      "k.podcast-publisher": "A podcast publisher.",
      "k.chain-tx": "A blockchain transaction.",
      "k.chain-address": "A blockchain address.",
      "ref.example.book.label": "Comment on a book",
      "ref.example.book.explain":
        "Frank comments on an ISBN; I/K is the root, i/k the parent, with a lookup link.",
      "ref.example.web.label": "Note about a web page",
      "ref.example.web.explain": "A normalized URL with k = web.",
      "ref.example.tx.label": "Transaction and country",
      "ref.example.tx.explain":
        "One event can reference several things: a bitcoin transaction and a country.",
    },
  },
  n75: {
    title: "Zap Goals",
    summary:
      "A fundraising goal as a kind 9041 event: a target amount and the relays where zaps are counted. Zap the goal to contribute and watch the progress bar fill.",
    text: {
      "how.goal.title": "Set a target",
      "how.goal.body":
        "A kind 9041 event says what you're raising money for (content) and how much (amount, in millisats).",
      "how.relays.title": "Where zaps are counted",
      "how.relays.body":
        "The relays tag lists where zap receipts go. Clients zapping the goal must copy these into the zap request's relays tag, so every client tallies the same receipts.",
      "how.tally.title": "Progress = sum of receipts",
      "how.tally.body":
        "Progress is the sum of NIP-57 zap receipts for the goal on those relays. Receipts after closed_at don't count.",
      "how.split.title": "Several beneficiaries",
      "how.split.body":
        "zap tags split contributions between pubkeys by weight, as in NIP-57 appendix G.",
      "how.link.title": "Attach a goal to other content",
      "how.link.body":
        "An addressable event (an article, a live stream) can show a goal with a goal tag. Zappers then e-tag the goal in their zap request.",
      "related.57": "Contributions are NIP-57 zaps; zap tags split them.",
      "related.23": "Long-form articles can link a goal.",
      "related.53": "Live streams can link a goal.",
      "flow.label": "Raising money",
      "flow.explain": "Create the goal, then link it from your content.",
      "flow.goal": "Erin publishes the goal.",
      "flow.link": "Frank links it from his article so readers can zap it.",
      "goal.label": "Zap goal (kind 9041)",
      "goal.explain": "A fundraising target. Zap this event to contribute.",
      "goal.content": "What the money is for, in words.",
      "goal.tag.relays": "Relays where zaps to this goal are sent and counted.",
      "goal.tag.relays.url": "Relay URL. Add as many as you like in the same tag.",
      "goal.tag.amount": "The target.",
      "goal.tag.amount.msats": "Millisats (1 sat = 1000 msats).",
      "goal.tag.closed_at": "Zaps after this time don't count.",
      "goal.tag.closed_at.ts": "Unix time.",
      "goal.tag.image": "Picture for the goal.",
      "goal.tag.image.url": "Image URL.",
      "goal.tag.summary": "Short description.",
      "goal.tag.summary.text": "One line.",
      "goal.tag.r": "Link to a web page about the goal.",
      "goal.tag.r.url": "URL.",
      "goal.tag.a": "Link to an addressable event about the goal.",
      "goal.tag.a.address": "kind:pubkey:d.",
      "goal.tag.zap": "A beneficiary who receives a share of contributions.",
      "goal.tag.zap.pubkey": "Beneficiary pubkey.",
      "goal.tag.zap.relay": "Where to find their profile.",
      "goal.tag.zap.weight": "Relative share; shares are weight / sum of weights.",
      "goal.example.simple.label": "Minimal goal",
      "goal.example.simple.explain": "Erin aims for 210,000 sats, counted on two relays.",
      "goal.example.full.label": "Goal with deadline and split",
      "goal.example.full.explain": "Closes after 30 days; Erin gets 3/4 and Alice 1/4 of each zap.",
      "link.label": "Content linking a goal (addressable kinds)",
      "link.explain": "Any addressable event can point at a goal so readers can fund it.",
      "link.content": "Whatever the event kind normally holds.",
      "link.tag.goal": "The goal this content supports.",
      "link.tag.goal.id": "Id of the kind 9041 event.",
      "link.tag.goal.relay": "Optional relay hint.",
      "link.example.label": "Article with a goal",
      "link.example.explain": "Frank's long-form post shows Erin's goal.",
    },
  },
  n77: {
    title: "Negentropy Syncing",
    summary:
      "A way for a client and relay (or two relays) to find out which events each one is missing by exchanging compact fingerprints instead of full id lists.",
    text: {
      "how.open.title": "Open a sync",
      "how.open.body":
        "The client picks a filter, gathers the matching events it already has and sends NEG-OPEN with that filter and an initial Negentropy message.",
      "how.ranges.title": "Fingerprints, not lists",
      "how.ranges.body":
        "A message is hex-encoded binary: version byte 0x61, then ranges over (timestamp, id). Each range carries a 16-byte fingerprint of the ids inside it, an explicit id list, or nothing (skip). Matching fingerprints mean that range is already in sync.",
      "how.reply.title": "Narrow down differences",
      "how.reply.body":
        "The relay compares, then answers with NEG-MSG: it splits differing ranges into smaller ones, or lists ids when a range is small. The two sides alternate until every range matches.",
      "how.transfer.title": "Then move the events",
      "how.transfer.body":
        "Negentropy only tells each side which ids it lacks. The client then downloads with REQ (by ids) and uploads with EVENT, possibly while the sync continues.",
      "how.close.title": "Close",
      "how.close.body":
        "The client sends NEG-CLOSE so the relay can free memory. A NEG-ERR from the relay also ends the sync.",
      "related.01": "Adds new message types beside REQ; filters are NIP-01 filters.",
      "related.11": "Relays that support it list 77 in supported_nips.",
      "related.45": "COUNT also avoids downloading events, but only counts them.",
      "flow.label": "One sync round trip",
      "flow.explain":
        "Client has 3 of the relay's 4 notes; after one exchange it knows which one to fetch.",
      "flow.open": "Client sends the fingerprint of its 3 ids.",
      "flow.relay": "Relay's fingerprint differs; it lists its 4 ids.",
      "flow.client": "Client could answer with ids or an empty message; here it has what it needs.",
      "flow.close": "Client closes and fetches the missing note with REQ.",
      "open.label": "NEG-OPEN",
      "open.explain": "Starts a sync for one filter.",
      sub: "Sync id. Separate namespace from REQ subscriptions; reusing an open one restarts it.",
      "open.filter": "NIP-01 filter: which events are being reconciled.",
      "open.initial": "First Negentropy message, hex. Starts with 61 (protocol version 1).",
      "open.example.fp.label": "Open with a fingerprint",
      "open.example.fp.explain":
        "61 version, 00 00 = range to infinity, 01 = fingerprint mode, then 16 bytes of fingerprint over the client's 3 note ids.",
      "open.example.empty.label": "Open with nothing",
      "open.example.empty.explain":
        '6100000200: one range to infinity in id-list mode with zero ids. "I have nothing; tell me what you have."',
      "msg-relay.label": "NEG-MSG (relay to client)",
      "msg-relay.explain": "The relay's answer: same binary format, split or listed ranges.",
      "msg.message": "Negentropy message, hex.",
      "msg-relay.example.label": "Relay lists its ids",
      "msg-relay.example.explain":
        "Fingerprints differed and the set is small, so the relay sends mode 02 with 04 ids. The last id is the one the client lacks.",
      "msg-client.label": "NEG-MSG (client to relay)",
      "msg-client.explain": "The client's next step in the exchange.",
      "msg-client.example.ids.label": "Client lists its ids",
      "msg-client.example.ids.explain": "Mode 02 with 03 ids: what the client has in that range.",
      "msg-client.example.done.label": "Nothing left to compare",
      "msg-client.example.done.explain":
        "Just the version byte, no ranges: every range is settled.",
      "err.label": "NEG-ERR",
      "err.explain": "The relay can't or won't continue. The sync is closed afterwards.",
      "err.reason": "machine-word: human message, like NIP-01 OK reasons. blocked or closed.",
      "err.max": "Optional: the most records the relay is willing to process.",
      "err.example.blocked.label": "Query too big",
      "err.example.blocked.explain":
        "The filter matched too many events; the relay suggests a limit.",
      "err.example.closed.label": "Timed out",
      "err.example.closed.explain": "The relay dropped an idle sync to recover memory.",
      "close.label": "NEG-CLOSE",
      "close.explain": "The client is done; the relay can release the sync's state.",
      "close.example.label": "Finish sync-1",
      "close.example.explain": "Sent once the client knows what to fetch and upload.",
    },
  },
  n78: {
    title: "Application-specific data",
    summary:
      "Lets apps store their own private data, such as settings, on your relays in any format they like, as kind 30078 (one record per key) or kind 78 (many records).",
    text: {
      "how.private.title": "Your relay as an app database",
      "how.private.body":
        "Apps that don't need to share data with other apps can still keep it on Nostr: you choose a relay, the app reads and writes its own events there.",
      "how.address.title": "Name the record with d",
      "how.address.body":
        "Kind 30078 is addressable: the d tag (often app name plus context) makes it a key. Publishing again with the same d replaces the old value.",
      "how.anything.title": "Content is up to the app",
      "how.anything.body":
        "Content and other tags can be anything: JSON, plain text or ciphertext. Encrypt it yourself (NIP-44) if relays shouldn't read it.",
      "how.many.title": "Many records: kind 78",
      "how.many.body":
        "When an app needs many events of the same type (a log, history), it uses regular kind 78 and groups them with a tag.",
      "how.auth.title": "Relays should keep it private",
      "how.auth.body":
        "Relays should require NIP-42 AUTH and serve these kinds only to their author. Not every relay does, so don't store secrets in plain text.",
      "related.42": "Relays should only serve these events to the authenticated author.",
      "related.44": "Encrypt sensitive values to yourself with NIP-44.",
      "related.01": "30078 is addressable (replaced per d); 78 is a regular event.",
      "data.label": "App data (kind 30078)",
      "data.explain": "One record per d tag: settings, state, config.",
      "data.content": "Any format the app chooses. Often JSON.",
      "data.tag.d": "The record's key: app name and context.",
      "data.tag.d.id": "e.g. my-app/settings.",
      "data.example.settings.label": "Client settings",
      "data.example.settings.explain": "Alice's preferences for an app, as JSON.",
      "data.example.config.label": "Remote config",
      "data.example.config.explain":
        "Dave's client reads feature flags he publishes, so users get changes without updating.",
      "log.label": "App records (kind 78)",
      "log.explain": "Regular events for apps that store many records of one type.",
      "log.content": "Any format the app chooses.",
      "log.tag.d": "Groups records of the same type (any tag works).",
      "log.tag.d.group": "Group name.",
      "log.example.label": "Reading session",
      "log.example.explain": "Frank's reading tracker logs each session as its own event.",
    },
  },
} satisfies NipStringsRange;
