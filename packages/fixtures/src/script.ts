/**
 * The scripted story behind the fixtures: who posts what, who replies, who follows, DMs and zaps.
 * Pure: fixed keys, nonces, timestamps and BIP-340 aux data make every byte reproducible.
 * `scripts/generate.ts` writes the result.
 */

import {
  BECH32_CHARSET,
  bytesToHex,
  type EventTemplate,
  encodeNaddr,
  encodeNote,
  encodeNpub,
  giftWrap,
  type Hex,
  type NostrEvent,
  type RelayUrl,
  type Tag,
  unwrap,
} from "@nostrschool/protocol";
import { AUX_RAND, type FixtureFile, newestFirst, signFixture } from "./event-utils.ts";
import {
  deriveFixtureKey,
  FIXTURE_NOW,
  getPersona,
  PERSONA_IDS,
  personaByPubkey,
  zapServiceFor,
} from "./personas.ts";
import { RELAYS } from "./relays.ts";
import type { PersonaId } from "./types.ts";

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (seconds: number): number => FIXTURE_NOW - seconds;

const ALPHA: RelayUrl = "wss://relay.alpha.example";
const pk = (id: PersonaId): Hex => getPersona(id).pubkey;
const npubOf = (id: PersonaId): string => unwrap(encodeNpub(pk(id)));
const writeRelays = (id: PersonaId): readonly RelayUrl[] =>
  getPersona(id).relays.flatMap((r) => (r.write ? [r.url] : []));
const readRelays = (id: PersonaId): readonly RelayUrl[] =>
  getPersona(id).relays.flatMap((r) => (r.read ? [r.url] : []));
/** First write relay: the relay hint we put in e/p tags. */
const hint = (id: PersonaId): RelayUrl => writeRelays(id)[0] ?? ALPHA;

const pTag = (id: PersonaId): Tag => ["p", pk(id), hint(id)];
/** Every scripted event is persona-authored; anything else is a bug in this script. */
const authorOf = (e: NostrEvent): PersonaId => {
  const p = personaByPubkey(e.pubkey);
  if (p === undefined) throw new Error(`event ${e.id} is not authored by a persona`);
  return p.id;
};
const eTag = (e: NostrEvent, marker: "root" | "reply"): Tag => [
  "e",
  e.id,
  hint(authorOf(e)),
  marker,
  e.pubkey,
];

export interface GeneratedFixtures extends FixtureFile {
  /** Events by script name, so tests can assert the story (e.g. `refs.deleted`). */
  readonly refs: Readonly<Record<string, NostrEvent>>;
}

export const buildFixtures = (): GeneratedFixtures => {
  const sign = (author: PersonaId, t: EventTemplate): NostrEvent =>
    signFixture(t, getPersona(author).secretKey);
  const note = (
    author: PersonaId,
    at: number,
    content: string,
    tags: readonly Tag[] = [],
  ): NostrEvent => sign(author, { kind: 1, created_at: at, tags, content });

  // ── Profiles (kind 0). Alice has an outdated one: replaceable events keep only the newest.
  const profile = (id: PersonaId, at: number, about?: string): NostrEvent => {
    const p = getPersona(id);
    return sign(id, {
      kind: 0,
      created_at: at,
      tags: [],
      content: JSON.stringify({
        name: p.name,
        display_name: p.displayName,
        about: about ?? p.about,
        nip05: p.nip05,
        lud16: p.lud16,
      }),
    });
  };
  const aliceOldProfile = profile("alice", ago(60 * DAY), "Just trying out this Nostr thing.");
  const profiles = PERSONA_IDS.map((id, i) => profile(id, ago(30 * DAY - i * HOUR)));

  // ── Relay lists (kind 10002, NIP-65).
  const relayLists = PERSONA_IDS.map((id, i) =>
    sign(id, {
      kind: 10002,
      created_at: ago(30 * DAY - i * HOUR - 5 * MIN),
      tags: getPersona(id).relays.map((r): Tag => {
        if (r.read && r.write) return ["r", r.url];
        return ["r", r.url, r.read ? "read" : "write"];
      }),
      content: "",
    }),
  );

  // ── Follow lists (kind 3). Grace's list grows: the old one only follows Alice.
  const FOLLOWS: Readonly<Record<PersonaId, readonly PersonaId[]>> = {
    alice: ["bob", "carol", "dave", "erin", "frank"],
    bob: ["alice", "carol", "dave"],
    carol: ["alice", "bob", "erin", "grace"],
    dave: ["alice", "bob", "frank"],
    erin: ["alice", "carol", "frank", "grace"],
    frank: ["alice", "dave", "erin"],
    grace: ["alice", "bob", "erin"],
  };
  const contacts = (id: PersonaId, at: number, follows: readonly PersonaId[]): NostrEvent =>
    sign(id, {
      kind: 3,
      created_at: at,
      tags: follows.map((f): Tag => ["p", pk(f), hint(f), getPersona(f).name]),
      content: "",
    });
  const graceOldContacts = contacts("grace", ago(3 * DAY), ["alice"]);
  const followLists = PERSONA_IDS.map((id, i) =>
    contacts(id, id === "grace" ? ago(2 * HOUR) : ago(20 * DAY - i * HOUR), FOLLOWS[id]),
  );

  // ── Thread 1: Alice explains relays (root → replies with NIP-10 markers).
  const relaysRoot = note(
    "alice",
    ago(6 * HOUR),
    "GM #nostr! Thread on how relays work: they are simple servers that store and forward signed events. They can't forge your notes, because only your key can sign them. #introductions",
    [
      ["t", "nostr"],
      ["t", "introductions"],
    ],
  );
  const bobQuestion = note(
    "bob",
    ago(5 * HOUR + 40 * MIN),
    `nostr:${npubOf("alice")} so if one relay goes down, my notes still live on the others? 🤯`,
    [eTag(relaysRoot, "root"), pTag("alice")],
  );
  const aliceAnswer = note(
    "alice",
    ago(5 * HOUR + 20 * MIN),
    "Exactly, Bob! Publish to a few relays and no single server can make you disappear.",
    [eTag(relaysRoot, "root"), eTag(bobQuestion, "reply"), pTag("bob")],
  );
  const carolReply = note(
    "carol",
    ago(5 * HOUR),
    "Great thread. Saving it for my film-camera friends who keep asking what Nostr is. #photography",
    [eTag(relaysRoot, "root"), pTag("alice"), ["t", "photography"]],
  );

  // ── Thread 2: Dave runs a paid relay.
  const daveRoot = note(
    "dave",
    ago(4 * HOUR),
    "relay.delta.example is live: paid, members-only writes, zero spam so far. AMA about running a relay! #relays #nostr",
    [
      ["t", "relays"],
      ["t", "nostr"],
    ],
  );
  const erinQuestion = note(
    "erin",
    ago(3 * HOUR + 30 * MIN),
    `How much bandwidth does a small relay use, nostr:${npubOf("dave")}?`,
    [eTag(daveRoot, "root"), pTag("dave")],
  );
  const daveAnswer = note(
    "dave",
    ago(3 * HOUR),
    "Less than you'd think: mostly small JSON events. Images live elsewhere, relays only store links.",
    [eTag(daveRoot, "root"), eTag(erinQuestion, "reply"), pTag("erin")],
  );

  // ── Grace says hello; Alice welcomes her and mentions two people.
  const graceHello = note(
    "grace",
    ago(2 * HOUR + 30 * MIN),
    "Hello world! My first note ever. Who should I follow? #introductions #newhere",
    [
      ["t", "introductions"],
      ["t", "newhere"],
    ],
  );
  const aliceWelcome = note(
    "alice",
    ago(2 * HOUR + 15 * MIN),
    `Welcome Grace! 💜 Try following nostr:${npubOf("erin")} for art and nostr:${npubOf("bob")} for good questions.`,
    [eTag(graceHello, "root"), pTag("grace"), pTag("erin"), pTag("bob")],
  );

  // ── Erin's drawing (gets zapped) and Bob's hot take (gets quoted and reposted).
  const erinArt = note(
    "erin",
    ago(90 * MIN),
    "Today's weird animal: a purple ostrich riding a lightning bolt ⚡ #art #zaps",
    [
      ["t", "art"],
      ["t", "zaps"],
    ],
  );
  const bobTake = note(
    "bob",
    ago(75 * MIN),
    "Hot take: the best feature of #nostr is that your identity is just a keypair. No email, no phone number.",
    [["t", "nostr"]],
  );
  const carolQuote = note(
    "carol",
    ago(60 * MIN),
    `This! 👇\nnostr:${unwrap(encodeNote(bobTake.id))}`,
    [["q", bobTake.id, hint("bob"), bobTake.pubkey], pTag("bob")],
  );

  // ── A mistake and its deletion request (kind 5, NIP-09).
  const mistake = note("bob", ago(50 * MIN), "testing testing is this thing on");
  const deletion = sign("bob", {
    kind: 5,
    created_at: ago(48 * MIN),
    tags: [
      ["e", mistake.id],
      ["k", "1"],
    ],
    content: "posted by accident",
  });

  // ── Long-form articles (kind 30023). Frank edited his: same `d`, the newer one replaces it.
  const article = (
    author: PersonaId,
    at: number,
    d: string,
    title: string,
    summary: string,
    body: string,
    topics: readonly string[],
  ): NostrEvent =>
    sign(author, {
      kind: 30023,
      created_at: at,
      tags: [
        ["d", d],
        ["title", title],
        ["summary", summary],
        ["published_at", String(ago(2 * DAY))],
        ...topics.map((t): Tag => ["t", t]),
      ],
      content: body,
    });
  const frankDraft = article(
    "frank",
    ago(2 * DAY),
    "protocols-not-platforms",
    "Protocols, not platforms",
    "Why open protocols outlive the apps built on them.",
    "# Protocols, not platforms\n\nEmail outlived every email company. The web outlived every browser war.\n\nNostr is a bet that social media can work the same way.",
    ["essay", "nostr"],
  );
  const frankArticle = article(
    "frank",
    ago(8 * HOUR),
    "protocols-not-platforms",
    "Protocols, not platforms",
    "Why open protocols outlive the apps built on them.",
    "# Protocols, not platforms\n\nEmail outlived every email company. The web outlived every browser war.\n\nNostr is a bet that social media can work the same way: **your keys, your followers, any app**.\n\n## What changes\n\n- You can switch clients without losing anyone.\n- Relays compete on service, not on lock-in.\n- Moderation becomes a choice, not a verdict.",
    ["essay", "nostr"],
  );
  const aliceArticle = article(
    "alice",
    ago(1 * DAY),
    "relays-explained",
    "Relays, explained",
    "What a relay is, what it isn't, and how to pick a few.",
    "# Relays, explained\n\nA relay is a WebSocket server that accepts signed events and answers subscriptions.\n\nIt **cannot** change your notes: the signature would break.\n\nPick a couple of big relays and one small one you trust.",
    ["relays", "nostr"],
  );
  const frankAddress = `30023:${pk("frank")}:protocols-not-platforms`;
  const frankNaddr = unwrap(
    encodeNaddr({
      kind: 30023,
      pubkey: pk("frank"),
      identifier: "protocols-not-platforms",
      relays: [hint("frank")],
    }),
  );
  // NIP-18: a nostr:naddr mention in content is cited with a `q` tag (not `a`).
  const frankAnnounce = note(
    "frank",
    ago(7 * HOUR),
    `New essay: "Protocols, not platforms" nostr:${frankNaddr} #essay`,
    [
      ["q", frankAddress, hint("frank")],
      ["t", "essay"],
    ],
  );

  // ── Reposts (kind 6, NIP-18): content is the stringified original.
  const repost = (who: PersonaId, at: number, original: NostrEvent): NostrEvent =>
    sign(who, {
      kind: 6,
      created_at: at,
      tags: [
        ["e", original.id, hint(authorOf(original))],
        ["p", original.pubkey, hint(authorOf(original))],
      ],
      content: JSON.stringify(original),
    });
  const graceRepost = repost("grace", ago(2 * HOUR + 10 * MIN), relaysRoot);
  const erinRepost = repost("erin", ago(55 * MIN), bobTake);

  // ── Reactions (kind 7, NIP-25).
  const react = (
    who: PersonaId,
    at: number,
    target: NostrEvent,
    content: string,
    address?: Tag,
  ): NostrEvent =>
    sign(who, {
      kind: 7,
      created_at: at,
      tags: [
        ["e", target.id, ALPHA],
        // NIP-25: reactions to addressable events also carry the `a` coordinate.
        ...(address === undefined ? [] : [address]),
        ["p", target.pubkey],
        ["k", String(target.kind)],
      ],
      content,
    });
  const reactions = [
    react("bob", ago(5 * HOUR + 50 * MIN), relaysRoot, "+"),
    react("carol", ago(5 * HOUR + 5 * MIN), relaysRoot, "🤙"),
    react("frank", ago(3 * HOUR + 45 * MIN), daveRoot, "+"),
    react("grace", ago(2 * HOUR + 5 * MIN), aliceWelcome, "❤️"),
    react("alice", ago(85 * MIN), erinArt, "⚡"),
    react("dave", ago(70 * MIN), bobTake, "-"),
    react("erin", ago(40 * MIN), frankArticle, "+", ["a", frankAddress, hint("frank")]),
  ];

  // Events that don't follow the plain outbox rule record their relays here.
  const routed = new Map<Hex, readonly RelayUrl[]>();

  // ── Direct messages (NIP-17: kind 14 rumor → kind 13 seal → kind 1059 gift wrap).
  let dmCounter = 0;
  const dm = (
    from: PersonaId,
    to: PersonaId,
    at: number,
    content: string,
    extraTags: readonly Tag[] = [],
  ): { readonly rumorId: Hex; readonly wrap: NostrEvent } => {
    dmCounter += 1;
    const n = dmCounter;
    // NIP-59 asks for randomized, backdated seal/wrap timestamps so metadata leaks less.
    const { rumor, wrap } = unwrap(
      giftWrap({
        template: { kind: 14, created_at: at, tags: [pTag(to), ...extraTags], content },
        senderSecretKey: getPersona(from).secretKey,
        recipientPubkey: pk(to),
        ephemeralSecretKey: deriveFixtureKey(`nostrschool:ephemeral:${n}`),
        sealCreatedAt: at - ((n * 7919) % DAY),
        wrapCreatedAt: at - ((n * 104729) % (2 * DAY)),
        sealNonce: deriveFixtureKey(`nostrschool:nonce:seal:${n}`),
        wrapNonce: deriveFixtureKey(`nostrschool:nonce:wrap:${n}`),
        auxRand: AUX_RAND,
      }),
    );
    // Wraps go to the recipient's inbox (a real client would prefer their kind 10050 list).
    routed.set(wrap.id, readRelays(to));
    return { rumorId: rumor.id, wrap };
  };
  const dm1 = dm(
    "alice",
    "bob",
    ago(3 * HOUR + 10 * MIN),
    "Hey Bob! Want to co-host a Nostr meetup next month?",
    [["subject", "Meetup?"]],
  );
  const dm2 = dm("bob", "alice", ago(3 * HOUR), "Yes! I'll bring the coffee ☕", [
    ["e", dm1.rumorId, "", "reply"],
    ["subject", "Meetup?"],
  ]);
  const dm3 = dm(
    "carol",
    "erin",
    ago(80 * MIN),
    "Your ostrich drawing made my day. Can I print it?",
  );
  const dm4 = dm(
    "grace",
    "alice",
    ago(2 * HOUR),
    "Thanks for the welcome! How do I back up my nsec safely?",
  );
  const dms = [dm1.wrap, dm2.wrap, dm3.wrap, dm4.wrap];

  // ── Zaps (NIP-57): request signed by the sender, receipt signed by the recipient's wallet.
  let zapCounter = 0;
  const zap = (
    from: PersonaId,
    to: PersonaId,
    at: number,
    sats: number,
    comment: string,
    target?: NostrEvent,
  ): { readonly request: NostrEvent; readonly receipt: NostrEvent } => {
    zapCounter += 1;
    const msats = sats * 1000;
    const request = sign(from, {
      kind: 9734,
      created_at: at,
      tags: [
        ["relays", ...readRelays(to)],
        ["amount", String(msats)],
        ["p", pk(to)],
        ...(target === undefined ? [] : [["e", target.id] as Tag]),
      ],
      content: comment,
    });
    const service = zapServiceFor(to);
    const receipt = signFixture(
      {
        kind: 9735,
        created_at: at + 2,
        tags: [
          ["p", pk(to)],
          ["P", pk(from)],
          ...(target === undefined ? [] : [["e", target.id] as Tag]),
          ["bolt11", fakeBolt11(sats, `zap:${zapCounter}`)],
          ["description", JSON.stringify(request)],
          ["preimage", bytesToHex(deriveFixtureKey(`nostrschool:preimage:${zapCounter}`))],
        ],
        content: "",
      },
      service.secretKey,
    );
    // Requests travel to the LNURL server over HTTP, never to a relay; the wallet then publishes
    // the receipt to the relays the request asked for.
    routed.set(request.id, []);
    routed.set(receipt.id, readRelays(to));
    return { request, receipt };
  };
  const zaps = [
    zap("alice", "erin", ago(80 * MIN), 2100, "Love the ostrich! ⚡", erinArt),
    zap("grace", "alice", ago(2 * HOUR), 21, "Thanks for the warm welcome!", aliceWelcome),
    zap("bob", "dave", ago(2 * HOUR + 45 * MIN), 1000, "For the relay bills"),
  ];

  // ── Placement: where each event lives (the outbox model, NIP-65).
  const relaysFor = (e: NostrEvent): readonly RelayUrl[] => {
    const special = routed.get(e.id);
    if (special !== undefined) return special;
    const tagged = e.tags.flatMap((t) => {
      const p = t[0] === "p" ? personaByPubkey(t[1] ?? "") : undefined;
      return p === undefined ? [] : [p.id];
    });
    // Profiles, relay lists and follows also go to Alpha, the relay everyone uses for lookups.
    const indexer = [0, 3, 10002].includes(e.kind) ? [ALPHA] : [];
    // Outbox: the author's write relays. Inbox: the read relays of everyone tagged — except
    // follow lists, whose p tags are not notifications.
    const inbox = e.kind === 3 ? [] : tagged.flatMap(readRelays);
    return [...writeRelays(authorOf(e)), ...inbox, ...indexer];
  };

  const events = [
    aliceOldProfile,
    ...profiles,
    ...relayLists,
    graceOldContacts,
    ...followLists,
    relaysRoot,
    bobQuestion,
    aliceAnswer,
    carolReply,
    daveRoot,
    erinQuestion,
    daveAnswer,
    graceHello,
    aliceWelcome,
    erinArt,
    bobTake,
    carolQuote,
    mistake,
    deletion,
    frankDraft,
    frankArticle,
    aliceArticle,
    frankAnnounce,
    graceRepost,
    erinRepost,
    ...reactions,
    ...dms,
    ...zaps.flatMap((z) => [z.request, z.receipt]),
  ].sort(newestFirst);

  const order = new Map(RELAYS.map((r, i) => [r.url, i]));
  const placement = Object.fromEntries(
    events.map((e) => [
      e.id,
      [...new Set(relaysFor(e))].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)),
    ]),
  );

  return {
    fixtureNow: FIXTURE_NOW,
    events,
    placement,
    refs: {
      aliceOldProfile,
      graceOldContacts,
      relaysRoot,
      bobQuestion,
      aliceAnswer,
      carolReply,
      daveRoot,
      graceHello,
      aliceWelcome,
      erinArt,
      bobTake,
      carolQuote,
      mistake,
      deletion,
      frankDraft,
      frankArticle,
      aliceArticle,
      frankAnnounce,
    },
  };
};

/**
 * A BOLT11-looking invoice: real prefix + amount encoding (`n` = 0.1 sat), deterministic
 * bech32-charset body. Not payable, and deliberately not decodable as a real invoice.
 */
export const fakeBolt11 = (sats: number, seed: string): string => {
  const body = [...deriveFixtureKey(`nostrschool:bolt11:${seed}`), ...deriveFixtureKey(seed)]
    .map((b) => BECH32_CHARSET[b % 32])
    .join("");
  return `lnbc${sats * 10}n1p${body}`;
};
