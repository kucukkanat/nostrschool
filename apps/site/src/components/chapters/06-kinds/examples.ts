/**
 * One example event per documented kind. Real fixture events win; otherwise we sign a
 * representative template with Alice's demo key (deterministic auxRand ⇒ identical bytes on
 * every visit). Kinds 14/15 are NIP-17 rumors, which are never signed, so we show them unsigned.
 */
import {
  eventsByKind,
  FIXTURE_NOW,
  getPersona,
  giftWraps,
  type PersonaId,
} from "@nostrschool/fixtures";
import {
  createRumor,
  type KeyError,
  type NostrEvent,
  ok,
  type Result,
  type Rumor,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";

export type ExampleSource = "fixture" | "signed" | "rumor";

export interface KindExample {
  readonly source: ExampleSource;
  readonly event: NostrEvent | Rumor;
}

interface Template {
  readonly tags: readonly Tag[];
  readonly content: string;
  readonly author?: PersonaId;
}

const ALICE = getPersona("alice").pubkey;
const BOB = getPersona("bob").pubkey;
const CAROL = getPersona("carol").pubkey;
const NOTE_ID = eventsByKind(1)[0]?.id ?? "";
const RELAY = "wss://relay.alpha.example";
const CHANNEL_ID = "c".repeat(64);
const BADGE = `30009:${ALICE}:early-bird`;
// NIP-04/NIP-44 payloads are opaque here: the shape (not the plaintext) is the lesson.
const CIPHERTEXT = "AkY3c2VjcmV0LW1lc3NhZ2UtYnl0ZXMtZ28taGVyZQ==";

/** Representative templates, written against the current NIP texts. */
const TEMPLATES: Readonly<Record<number, Template>> = {
  4: { tags: [["p", BOB]], content: `${CIPHERTEXT}?iv=bm9uY2Utbm9uY2Utbm9u` },
  8: {
    tags: [
      ["a", BADGE],
      ["p", BOB, RELAY],
    ],
    content: "",
  },
  9: { tags: [["h", "nostr-school"]], content: "gm group! 🌅" },
  11: {
    tags: [["title", "Which relays do you use?"]],
    content: "Share your favorite relays below.",
  },
  13: { tags: [], content: CIPHERTEXT },
  16: {
    tags: [
      ["e", NOTE_ID, RELAY],
      ["p", BOB],
      ["k", "30023"],
    ],
    content: "",
  },
  17: { tags: [["r", "https://nostr.com/"]], content: "+" },
  20: {
    tags: [
      ["title", "Sunset over the relay"],
      ["imeta", "url https://example.com/sunset.jpg", "m image/jpeg", "dim 1200x800"],
    ],
    content: "Golden hour 🧡",
  },
  21: {
    tags: [
      ["title", "Nostr in 60 seconds"],
      ["imeta", "url https://example.com/intro.mp4", "m video/mp4"],
    ],
    content: "A tiny explainer.",
  },
  40: {
    tags: [],
    content: JSON.stringify({ name: "Nostr School", about: "Questions welcome", picture: "" }),
  },
  41: {
    tags: [["e", CHANNEL_ID, RELAY, "root"]],
    content: JSON.stringify({ name: "Nostr School", about: "Now with homework" }),
  },
  42: { tags: [["e", CHANNEL_ID, RELAY, "root"]], content: "Is chapter 6 out yet?" },
  1040: {
    tags: [
      ["e", NOTE_ID, RELAY],
      ["k", "1"],
    ],
    content: "AE9wZW5UaW1lc3RhbXBzAABQcm9vZgC/ieLohOiSlAE=",
  },
  1063: {
    tags: [
      ["url", "https://example.com/ostrich.png"],
      ["m", "image/png"],
      ["x", "a".repeat(64)],
    ],
    content: "Our mascot, in full resolution.",
  },
  1068: {
    tags: [
      ["option", "a", "Alpha relay"],
      ["option", "b", "Beta relay"],
      ["polltype", "singlechoice"],
      ["relay", RELAY],
    ],
    content: "Which relay should the class use?",
  },
  1111: {
    tags: [
      ["E", NOTE_ID, RELAY, BOB],
      ["K", "1"],
      ["P", BOB],
      ["e", NOTE_ID, RELAY, BOB],
      ["k", "1"],
      ["p", BOB],
    ],
    content: "Great point about relays!",
  },
  1311: { tags: [["a", `30311:${CAROL}:live-coding`, RELAY]], content: "Hello from chat 👋" },
  1617: {
    tags: [
      ["a", `30617:${ALICE}:nostr-school`],
      ["p", ALICE],
    ],
    content: "From 1a2b3c Mon Sep 17 00:00:00 2001\nSubject: [PATCH] fix typo in chapter 6\n",
  },
  1984: { tags: [["p", CAROL, "spam"]], content: "Posting the same link 200 times." },
  1985: {
    tags: [
      ["L", "#t"],
      ["l", "nostr", "#t"],
      ["e", NOTE_ID, RELAY],
    ],
    content: "",
  },
  7000: {
    tags: [
      ["status", "processing"],
      ["e", "d".repeat(64), RELAY],
      ["p", BOB],
    ],
    content: "",
  },
  9041: {
    tags: [
      ["amount", "210000000"],
      ["relays", RELAY],
    ],
    content: "New microphone for the podcast 🎙️",
  },
  9802: {
    tags: [["r", "https://example.com/protocols-not-platforms"]],
    content: "Email outlived every email company.",
  },
  10000: {
    tags: [
      ["p", CAROL],
      ["t", "spoilers"],
      ["word", "giveaway"],
    ],
    content: "",
  },
  10001: { tags: [["e", NOTE_ID]], content: "" },
  // NIP-58 profile badges: an ordered list of a (badge definition) + e (award) pairs, no d tag.
  10008: {
    tags: [
      ["a", BADGE],
      ["e", "b".repeat(64), RELAY],
    ],
    content: "",
  },
  10003: {
    tags: [
      ["e", NOTE_ID],
      ["r", "https://github.com/nostr-protocol/nips"],
    ],
    content: "",
  },
  10050: {
    tags: [
      ["relay", "wss://relay.beta.example"],
      ["relay", "wss://relay.gamma.example"],
    ],
    content: "",
  },
  13194: {
    tags: [["encryption", "nip44_v2"]],
    content: "pay_invoice get_balance make_invoice",
    author: "grace",
  },
  22242: {
    tags: [
      ["relay", RELAY],
      ["challenge", "f6b2a1c9"],
    ],
    content: "",
  },
  23194: { tags: [["p", getPersona("grace").pubkey]], content: CIPHERTEXT },
  23195: {
    tags: [
      ["p", ALICE],
      ["e", "e".repeat(64)],
    ],
    content: CIPHERTEXT,
    author: "grace",
  },
  24133: { tags: [["p", getPersona("frank").pubkey]], content: CIPHERTEXT },
  27235: {
    tags: [
      ["u", "https://api.example.com/login"],
      ["method", "GET"],
    ],
    content: "",
  },
  30000: {
    tags: [
      ["d", "classmates"],
      ["title", "Classmates"],
      ["p", BOB],
      ["p", CAROL],
    ],
    content: "",
  },
  // NIP-51 badge set: a named collection of badge definitions (profile badges moved to 10008).
  30008: {
    tags: [
      ["d", "conference-2026"],
      ["title", "Conference 2026"],
      ["a", BADGE],
    ],
    content: "",
  },
  30009: {
    tags: [
      ["d", "early-bird"],
      ["name", "Early bird"],
      ["description", "Finished Nostr School before breakfast"],
      ["image", "https://example.com/early-bird.png", "1024x1024"],
    ],
    content: "",
  },
  30024: {
    tags: [
      ["d", "kinds-cheatsheet"],
      ["title", "Kinds cheat sheet (draft)"],
    ],
    content: "# Kinds cheat sheet\n\nTODO: finish the ephemeral section.",
  },
  30078: { tags: [["d", "nostrschool/settings"]], content: JSON.stringify({ theme: "dark" }) },
  30311: {
    tags: [
      ["d", "live-coding"],
      ["title", "Live coding a relay"],
      ["status", "live"],
      ["streaming", "https://example.com/live.m3u8"],
      ["p", CAROL, RELAY, "Host"],
    ],
    content: "",
    author: "carol",
  },
  30315: { tags: [["d", "general"]], content: "Writing chapter 6 ✍️" },
  30402: {
    tags: [
      ["d", "vintage-bike"],
      ["title", "Vintage bike"],
      ["price", "100", "USD"],
      ["location", "Lisbon"],
    ],
    content: "Steel frame, new tires.",
  },
  31922: {
    tags: [
      ["d", "nostr-meetup"],
      ["title", "Nostr meetup"],
      ["start", "2025-01-15"],
    ],
    content: "Bring your npub!",
  },
  31923: {
    tags: [
      ["d", "dev-call"],
      ["title", "Dev call"],
      ["start", String(FIXTURE_NOW + 86400)],
      ["end", String(FIXTURE_NOW + 90000)],
    ],
    content: "Weekly NIPs sync.",
  },
  31989: {
    tags: [
      ["d", "30023"],
      ["a", `31990:${BOB}:reader`, RELAY, "web"],
    ],
    content: "",
  },
  31990: {
    tags: [
      ["d", "reader"],
      ["k", "30023"],
      ["web", "https://reader.example.com/a/<bech32>", "naddr"],
    ],
    content: JSON.stringify({ name: "Reader", about: "Opens long-form articles" }),
    author: "bob",
  },
  34550: {
    tags: [
      ["d", "nostr-learners"],
      ["name", "Nostr learners"],
      ["description", "Ask anything about the protocol"],
      ["p", ALICE, RELAY, "moderator"],
    ],
    content: "",
  },
};

const fallbackTemplate = (kind: number): Template => ({
  tags: [],
  content: `An example kind ${kind} event.`,
});

// Fixed auxRand: BIP-340 signatures are then reproducible, so examples never change.
const AUX_RAND = new Uint8Array(32);
const cache = new Map<number, KindExample>();

/** The example shown in the detail panel (memoized: signing happens once per kind). */
export const exampleFor = (kind: number): Result<KindExample, KeyError> => {
  const cached = cache.get(kind);
  if (cached !== undefined) return ok(cached);
  const remember = (example: KindExample) => {
    cache.set(kind, example);
    return ok(example);
  };
  const fixture = eventsByKind(kind)[0];
  if (fixture !== undefined) return remember({ source: "fixture", event: fixture });
  const wrapped = giftWraps()[0];
  if (kind === 13 && wrapped !== undefined)
    return remember({ source: "fixture", event: wrapped.seal });
  if (kind === 14 && wrapped !== undefined)
    return remember({ source: "rumor", event: wrapped.rumor });
  const { tags, content, author = "alice" } = TEMPLATES[kind] ?? fallbackTemplate(kind);
  const persona = getPersona(author);
  const template = { kind, created_at: FIXTURE_NOW, tags, content };
  if (kind === 14 || kind === 15)
    return remember({ source: "rumor", event: createRumor(template, persona.pubkey) });
  const signed = signEvent(template, persona.secretKey, { auxRand: AUX_RAND });
  return signed.ok ? remember({ source: "signed", event: signed.value.event }) : signed;
};
