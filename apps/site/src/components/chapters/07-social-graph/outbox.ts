/**
 * Chapter 07 outbox-model logic (NIP-65): which relays an app contacts to read a feed, to
 * deliver a reply, or (for contrast) when everyone is assumed to live on one relay.
 * `outboxScene` turns (input, step) into everything the animated map draws, so the component
 * stays a thin renderer and every frame of the story is unit-tested.
 */
import {
  eventsByAuthor,
  FIXTURE_NOW,
  getPersona,
  getRelay,
  type PersonaId,
  RELAYS,
  relayListFor,
} from "@nostrschool/fixtures";
import {
  type ClientMessage,
  type Filter,
  type RelayUrl,
  serializeMessage,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";
import { FOLLOWS } from "./social.ts";

export type OutboxMode = "outbox" | "reply" | "single";
export const OUTBOX_MODES: readonly OutboxMode[] = ["outbox", "reply", "single"];

export type StepId =
  | "start"
  | "follows"
  | "relayLists"
  | "plan"
  | "subscribe"
  | "notes"
  | "lookup"
  | "publish";

export const STEPS: Readonly<Record<OutboxMode, readonly StepId[]>> = {
  outbox: ["start", "follows", "relayLists", "plan", "subscribe", "notes"],
  single: ["start", "follows", "subscribe", "notes"],
  reply: ["start", "lookup", "publish"],
};

/** Fixture relay "Alpha" is described as the big relay clients use for profile lookups. */
export const INDEXER: RelayUrl = RELAYS[0]?.url ?? "wss://relay.alpha.example";
export const RELAY_URLS: readonly RelayUrl[] = RELAYS.map((r) => r.url);

export interface OutboxInput {
  readonly viewer: PersonaId;
  readonly mode: OutboxMode;
  readonly singleRelay: RelayUrl;
  readonly recipient: PersonaId;
}

export const writeRelays = (id: PersonaId): readonly RelayUrl[] =>
  relayListFor(id)
    .filter((r) => r.write)
    .map((r) => r.url);

export const readRelays = (id: PersonaId): readonly RelayUrl[] =>
  relayListFor(id)
    .filter((r) => r.read)
    .map((r) => r.url);

export const followsOf = (id: PersonaId): readonly PersonaId[] => FOLLOWS.follows.get(id) ?? [];

export interface RelayPlan {
  readonly relay: RelayUrl;
  readonly authors: readonly PersonaId[];
}

/** One entry per relay that at least one followed author writes to (fixture relay order). */
export const outboxPlan = (authors: readonly PersonaId[]): readonly RelayPlan[] =>
  RELAY_URLS.flatMap((relay) => {
    const here = authors.filter((a) => writeRelays(a).includes(relay));
    return here.length > 0 ? [{ relay, authors: here }] : [];
  });

/**
 * The fewest relays that still reach every author once (exact set cover). With a handful of
 * relays, trying every subset is instant; real clients with hundreds of relays approximate this
 * greedily and also cap connections per author. Authors who write nowhere are ignored.
 */
export const minimalCover = (authors: readonly PersonaId[]): readonly RelayUrl[] => {
  const plan = outboxPlan(authors);
  const reachable = new Set(plan.flatMap((p) => p.authors));
  const subsets = Array.from({ length: 2 ** plan.length }, (_, mask) =>
    plan.filter((_, i) => (mask >> i) & 1),
  ).sort((a, b) => a.length - b.length);
  const best = subsets.find((s) => new Set(s.flatMap((p) => p.authors)).size === reachable.size);
  return (best ?? plan).map((p) => p.relay);
};

/** Write relays of the author ∪ read relays of the person replied to (NIP-65 publishing rule). */
export const replyTargets = (author: PersonaId, recipient: PersonaId): readonly RelayUrl[] => {
  const wanted = new Set([...writeRelays(author), ...readRelays(recipient)]);
  return RELAY_URLS.filter((r) => wanted.has(r));
};

export type Endpoint = "app" | RelayUrl;
export type PersonState = "idle" | "known" | "reached" | "missed" | "target";
export type RelayState = "idle" | "lookup" | "planned" | "active" | "publish";

export interface SceneEdge {
  readonly id: string;
  readonly from: PersonaId | "app";
  readonly to: RelayUrl;
  readonly kind: "write" | "read" | "link";
}

export interface ScenePacket {
  readonly id: string;
  readonly from: Endpoint;
  readonly to: Endpoint;
  readonly type: "req" | "event";
}

export type NarrationKey =
  | "start"
  | "follows"
  | "relayLists"
  | "plan"
  | "subscribe"
  | "notesAll"
  | "singleFollows"
  | "singleSubscribe"
  | "notesSome"
  | "lookup"
  | "publish";

export interface Scene {
  readonly step: StepId;
  readonly people: readonly { readonly id: PersonaId; readonly state: PersonState }[];
  readonly relays: readonly {
    readonly url: RelayUrl;
    readonly state: RelayState;
    readonly authors: readonly PersonaId[];
  }[];
  readonly edges: readonly SceneEdge[];
  readonly packets: readonly ScenePacket[];
  readonly reached: readonly PersonaId[];
  readonly missed: readonly PersonaId[];
  /** Relays the app opened connections to so far. */
  readonly contacted: readonly RelayUrl[];
  readonly minimal: number;
  readonly narration: { readonly key: NarrationKey; readonly params: Record<string, string> };
}

/** Clamps a step index into the mode's step list. */
export const stepAt = (mode: OutboxMode, index: number): StepId => {
  const steps = STEPS[mode];
  return steps[Math.max(0, Math.min(steps.length - 1, Math.trunc(index)))] ?? "start";
};

const nameOf = (id: PersonaId): string => getPersona(id).displayName;
export const relayName = (url: RelayUrl): string => getRelay(url)?.name ?? url;

const edgesFor = (
  people: readonly PersonaId[],
  kind: "write" | "read",
  relaysOf: (id: PersonaId) => readonly RelayUrl[],
): readonly SceneEdge[] =>
  people.flatMap((p) => relaysOf(p).map((to) => ({ id: `${kind}-${p}-${to}`, from: p, to, kind })));

const links = (relays: readonly RelayUrl[]): readonly SceneEdge[] =>
  relays.map((to) => ({ id: `link-${to}`, from: "app" as const, to, kind: "link" as const }));

const roundTrip = (relay: RelayUrl, tag: string): readonly ScenePacket[] => [
  { id: `${tag}-req-${relay}`, from: "app", to: relay, type: "req" },
  { id: `${tag}-event-${relay}`, from: relay, to: "app", type: "event" },
];

/**
 * Everything drawn for `input` at step `index`. `names` turns lists into prose so narration
 * params arrive ready to drop into the localized template.
 */
export const outboxScene = (
  input: OutboxInput,
  index: number,
  names: (list: readonly string[]) => string,
): Scene => {
  const step = stepAt(input.mode, index);
  const follows = followsOf(input.viewer);
  const lookupRelay = input.mode === "single" ? input.singleRelay : INDEXER;
  const plan = outboxPlan(follows);
  const minimal = minimalCover(follows).length;
  const order = STEPS[input.mode];
  const reachedAt = (s: StepId): boolean => order.indexOf(step) >= order.indexOf(s);

  const singleReached = follows.filter((f) => writeRelays(f).includes(input.singleRelay));
  const reached = step !== "notes" ? [] : input.mode === "single" ? singleReached : [...follows];
  const missed =
    step === "notes" && input.mode === "single"
      ? follows.filter((f) => !singleReached.includes(f))
      : [];

  const viewer = nameOf(input.viewer);
  const base = {
    name: viewer,
    relay: relayName(lookupRelay),
    list: names(follows.map(nameOf)),
    total: String(follows.length),
  };

  if (input.mode === "reply") {
    const targets = replyTargets(input.viewer, input.recipient);
    const recipient = nameOf(input.recipient);
    const publishing = step === "publish";
    return {
      step,
      people: follows.map((id) => ({
        id,
        state: id === input.recipient && step !== "start" ? "target" : "idle",
      })),
      relays: RELAY_URLS.map((url) => ({
        url,
        state:
          publishing && targets.includes(url)
            ? "publish"
            : step === "lookup" && url === INDEXER
              ? "lookup"
              : "idle",
        authors: [],
      })),
      edges:
        step === "start"
          ? []
          : [
              ...edgesFor([input.recipient], "read", readRelays),
              ...(publishing ? links(targets) : []),
            ],
      packets:
        step === "lookup"
          ? roundTrip(INDEXER, "lookup")
          : publishing
            ? targets.map((to) => ({ id: `publish-${to}`, from: "app", to, type: "event" }))
            : [],
      reached: [],
      missed: [],
      contacted: publishing ? targets : step === "lookup" ? [INDEXER] : [],
      minimal,
      narration: {
        key: step === "start" ? "start" : step === "lookup" ? "lookup" : "publish",
        params: { ...base, recipient, relays: names(targets.map(relayName)) },
      },
    };
  }

  const isSingle = input.mode === "single";
  const subscribedRelays = isSingle ? [input.singleRelay] : plan.map((p) => p.relay);
  const subscribed = reachedAt("subscribe");
  // In one-relay mode the true write relays appear at the end, to show WHY people went missing.
  const showWrites = isSingle ? step === "notes" : reachedAt("relayLists");

  const narrationKey: NarrationKey =
    step === "start"
      ? "start"
      : step === "follows"
        ? isSingle
          ? "singleFollows"
          : "follows"
        : step === "relayLists"
          ? "relayLists"
          : step === "plan"
            ? "plan"
            : step === "subscribe"
              ? isSingle
                ? "singleSubscribe"
                : "subscribe"
              : missed.length > 0
                ? "notesSome"
                : "notesAll";

  return {
    step,
    people: follows.map((id) => ({
      id,
      state: reached.includes(id)
        ? "reached"
        : missed.includes(id)
          ? "missed"
          : step === "start"
            ? "idle"
            : "known",
    })),
    relays: RELAY_URLS.map((url) => {
      const planned = plan.find((p) => p.relay === url);
      const inPlay = subscribedRelays.includes(url);
      const lookingUp = (step === "follows" || step === "relayLists") && url === lookupRelay;
      return {
        url,
        state:
          subscribed && inPlay
            ? "active"
            : !isSingle && step === "plan" && inPlay
              ? "planned"
              : lookingUp
                ? "lookup"
                : "idle",
        authors:
          isSingle && url === input.singleRelay && subscribed
            ? follows
            : !isSingle && reachedAt("plan")
              ? (planned?.authors ?? [])
              : [],
      };
    }),
    edges: [
      ...(showWrites ? edgesFor(follows, "write", writeRelays) : []),
      ...(subscribed ? links(subscribedRelays) : []),
    ],
    packets:
      step === "follows" || step === "relayLists"
        ? roundTrip(lookupRelay, step)
        : step === "subscribe"
          ? subscribedRelays.map((to) => ({ id: `sub-${to}`, from: "app", to, type: "req" }))
          : step === "notes"
            ? (isSingle && singleReached.length === 0 ? [] : subscribedRelays).map((from) => ({
                id: `notes-${from}`,
                from,
                to: "app",
                type: "event",
              }))
            : [],
    reached,
    missed,
    contacted: subscribed ? subscribedRelays : step === "start" ? [] : [lookupRelay],
    minimal,
    narration: {
      key: narrationKey,
      params: {
        ...base,
        relay: relayName(lookupRelay),
        count: String(plan.length),
        minimal: String(minimal),
        reached: String(singleReached.length),
        missed: names(missed.map(nameOf)),
      },
    },
  };
};

const subId = (prefix: string, relay: RelayUrl): string =>
  `${prefix}-${relayName(relay).toLowerCase()}`;
const pubkeys = (ids: readonly PersonaId[]): string[] => ids.map((id) => getPersona(id).pubkey);
const req = (id: string, filter: Filter): ClientMessage => ["REQ", id, filter];

/** The reply event the demo "sends": a real signature by the viewer's (public-by-design) fixture key. */
export const replyEvent = (author: PersonaId, recipient: PersonaId, content: string) => {
  const target = eventsByAuthor(recipient).find((e) => e.kind === 1);
  const hint = writeRelays(recipient)[0] ?? "";
  // NIP-10 marked e tag: ["e", id, relay hint, "root", author pubkey]; plus a p tag to notify.
  const tags: readonly Tag[] = [
    ...(target === undefined ? [] : [["e", target.id, hint, "root", target.pubkey] as const]),
    ["p", getPersona(recipient).pubkey],
  ];
  return signEvent(
    { kind: 1, created_at: FIXTURE_NOW, tags, content },
    getPersona(author).secretKey,
    { auxRand: new Uint8Array(32) },
  );
};

/** Every wire message the app has sent up to (and including) step `index`. */
export const framesUpTo = (
  input: OutboxInput,
  index: number,
  replyContent: string,
): readonly string[] => {
  const order = STEPS[input.mode];
  const done = order.slice(1, order.indexOf(stepAt(input.mode, index)) + 1);
  const follows = followsOf(input.viewer);
  const lookupRelay = input.mode === "single" ? input.singleRelay : INDEXER;
  return done.flatMap((s): string[] => {
    const at = (relay: RelayUrl, msg: ClientMessage) =>
      `// → ${relayName(relay)}\n${serializeMessage(msg)}`;
    switch (s) {
      case "follows":
        return [
          at(
            lookupRelay,
            req("follows", { kinds: [3], authors: pubkeys([input.viewer]), limit: 1 }),
          ),
        ];
      case "relayLists":
        return [at(lookupRelay, req("relay-lists", { kinds: [10002], authors: pubkeys(follows) }))];
      case "lookup":
        return [
          at(
            INDEXER,
            req("inbox", { kinds: [10002], authors: pubkeys([input.recipient]), limit: 1 }),
          ),
        ];
      case "subscribe":
        return input.mode === "single"
          ? [
              at(
                input.singleRelay,
                req(subId("feed", input.singleRelay), {
                  kinds: [1],
                  authors: pubkeys(follows),
                  limit: 20,
                }),
              ),
            ]
          : outboxPlan(follows).map((p) =>
              at(
                p.relay,
                req(subId("feed", p.relay), { kinds: [1], authors: pubkeys(p.authors), limit: 20 }),
              ),
            );
      case "publish": {
        const signed = replyEvent(input.viewer, input.recipient, replyContent);
        return signed.ok
          ? replyTargets(input.viewer, input.recipient).map((r) =>
              at(r, ["EVENT", signed.value.event]),
            )
          : [`// ${signed.error.message}`];
      }
      default:
        // "plan" and "notes" send nothing new: planning is local, notes come back.
        return [];
    }
  });
};
