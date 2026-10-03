/**
 * Chapter 04 scripts: three scripted NIP-01/NIP-42 conversations built from REAL fixture events
 * (and one really signed kind 22242 AUTH event), plus the pure "client notebook" reducer that
 * shows how much bookkeeping lives in the client while relays just answer.
 */
import type { SequenceLane, SequenceMessage } from "@nostrschool/diagrams";
import { eventsByAuthor, FIXTURE_NOW, getPersona, giftWraps } from "@nostrschool/fixtures";
import { getDictionary, type Locale } from "@nostrschool/i18n";
import {
  type ClientMessage,
  type Filter,
  type MessageType,
  type NostrEvent,
  type RelayMessage,
  signEvent,
  unwrap,
} from "@nostrschool/protocol";

export type LaneId = "client" | "alpha" | "beta" | "gamma" | "delta";
export type ScenarioId = "read" | "publish" | "auth";
export const SCENARIO_IDS: readonly ScenarioId[] = ["read", "publish", "auth"];
export type Frame = ClientMessage | RelayMessage;

type Dict = ReturnType<typeof getDictionary>["chapters"]["ch04"];
type StepKey<S extends ScenarioId> = keyof Dict["theater"]["scenarios"][S]["steps"] & string;

/** One scripted packet. `relay` is the relay end of the arrow; `out` = client → relay. */
export interface WireStep {
  readonly id: string;
  readonly relay: Exclude<LaneId, "client">;
  readonly out: boolean;
  readonly frame: Frame;
}

/** A scenario's steps, whose ids must be narration keys in the i18n file (typo ⇒ type error). */
type Script<S extends ScenarioId> = readonly (WireStep & { readonly id: StepKey<S> })[];

export const RELAY_URLS: Readonly<Record<Exclude<LaneId, "client">, string>> = {
  alpha: "wss://relay.alpha.example",
  beta: "wss://relay.beta.example",
  gamma: "wss://relay.gamma.example",
  delta: "wss://relay.delta.example",
};

const alice = getPersona("alice");
const aliceNotes = eventsByAuthor("alice").filter((e) => e.kind === 1);

const must = <T>(value: T | undefined, what: string): T => {
  // Fixtures are committed data: a missing one is a build bug, so fail loudly at import.
  if (value === undefined) throw new Error(`ch04: missing fixture ${what}`);
  return value;
};

const note1 = must(aliceNotes[0], "alice note #1");
const note2 = must(aliceNotes[1], "alice note #2");
const wrapForAlice = must(
  giftWraps().find((g) => g.recipient === "alice"),
  "gift wrap for alice",
).wrap;

/** NIP-42 challenge: any random string chosen by the relay; fixed here for determinism. */
export const AUTH_CHALLENGE = "ostrich-7f3a9c2e";

/** A really signed NIP-42 auth event (kind 22242: relay + challenge tags, never published). */
export const AUTH_EVENT: NostrEvent = unwrap(
  signEvent(
    {
      kind: 22242,
      created_at: FIXTURE_NOW,
      tags: [
        ["relay", RELAY_URLS.delta],
        ["challenge", AUTH_CHALLENGE],
      ],
      content: "",
    },
    alice.secretKey,
    { auxRand: new Uint8Array(32) },
  ),
).event;

const FEED: Filter = { authors: [alice.pubkey], kinds: [1], limit: 2 };
const DMS: Filter = { kinds: [1059], "#p": [alice.pubkey] };

const READ: Script<"read"> = [
  { id: "reqAlpha", relay: "alpha", out: true, frame: ["REQ", "feed", FEED] },
  { id: "reqBeta", relay: "beta", out: true, frame: ["REQ", "feed", FEED] },
  { id: "reqGamma", relay: "gamma", out: true, frame: ["REQ", "feed", FEED] },
  { id: "eventAlpha1", relay: "alpha", out: false, frame: ["EVENT", "feed", note1] },
  { id: "eventBeta1", relay: "beta", out: false, frame: ["EVENT", "feed", note1] },
  { id: "eventAlpha2", relay: "alpha", out: false, frame: ["EVENT", "feed", note2] },
  { id: "eoseAlpha", relay: "alpha", out: false, frame: ["EOSE", "feed"] },
  { id: "eoseBeta", relay: "beta", out: false, frame: ["EOSE", "feed"] },
  {
    id: "closedGamma",
    relay: "gamma",
    out: false,
    frame: ["CLOSED", "feed", "rate-limited: slow down, too many requests"],
  },
  { id: "closeAlpha", relay: "alpha", out: true, frame: ["CLOSE", "feed"] },
  { id: "closeBeta", relay: "beta", out: true, frame: ["CLOSE", "feed"] },
];

const PUBLISH: Script<"publish"> = [
  { id: "eventAlpha", relay: "alpha", out: true, frame: ["EVENT", note1] },
  { id: "eventBeta", relay: "beta", out: true, frame: ["EVENT", note1] },
  { id: "eventGamma", relay: "gamma", out: true, frame: ["EVENT", note1] },
  { id: "okAlpha", relay: "alpha", out: false, frame: ["OK", note1.id, true, ""] },
  {
    id: "okBeta",
    relay: "beta",
    out: false,
    frame: ["OK", note1.id, true, "duplicate: already have this event"],
  },
  {
    id: "noticeGamma",
    relay: "gamma",
    out: false,
    frame: ["NOTICE", "heads up: this relay restarts at 03:00 UTC"],
  },
  {
    id: "okGamma",
    relay: "gamma",
    out: false,
    frame: ["OK", note1.id, false, "pow: difficulty 16 or more is required"],
  },
];

const AUTH: Script<"auth"> = [
  { id: "reqDelta", relay: "delta", out: true, frame: ["REQ", "dms", DMS] },
  { id: "authChallenge", relay: "delta", out: false, frame: ["AUTH", AUTH_CHALLENGE] },
  {
    id: "closedDelta",
    relay: "delta",
    out: false,
    frame: ["CLOSED", "dms", "auth-required: gift wraps are only served to their recipient"],
  },
  { id: "authEvent", relay: "delta", out: true, frame: ["AUTH", AUTH_EVENT] },
  { id: "okAuth", relay: "delta", out: false, frame: ["OK", AUTH_EVENT.id, true, ""] },
  { id: "reqAgain", relay: "delta", out: true, frame: ["REQ", "dms", DMS] },
  { id: "eventWrap", relay: "delta", out: false, frame: ["EVENT", "dms", wrapForAlice] },
  { id: "eoseDelta", relay: "delta", out: false, frame: ["EOSE", "dms"] },
  { id: "closeDelta", relay: "delta", out: true, frame: ["CLOSE", "dms"] },
];

export const SCRIPTS: Readonly<Record<ScenarioId, readonly WireStep[]>> = {
  read: READ,
  publish: PUBLISH,
  auth: AUTH,
};

const LANES: Readonly<Record<ScenarioId, readonly LaneId[]>> = {
  read: ["client", "alpha", "beta", "gamma"],
  publish: ["client", "alpha", "beta", "gamma"],
  auth: ["client", "delta"],
};

export const lanesFor = (scenario: ScenarioId, locale: Locale): readonly SequenceLane[] => {
  const t = getDictionary(locale).chapters.ch04.lanes;
  return LANES[scenario].map((id) => ({
    id,
    label: t[id],
    kind: id === "client" ? "client" : "relay",
  }));
};

/** Compact arrow label: the verb plus the one field that identifies the conversation. */
export const frameLabel = (frame: Frame): string => {
  switch (frame[0]) {
    case "REQ":
    case "CLOSE":
    case "CLOSED":
    case "EOSE":
    case "COUNT":
      return `${frame[0]} "${frame[1]}"`;
    case "EVENT":
      return typeof frame[1] === "string" ? `EVENT "${frame[1]}"` : "EVENT";
    case "OK":
      return `OK ${String(frame[2])}`;
    case "NOTICE":
    case "AUTH":
      return frame[0];
  }
};

const narrations = (scenario: ScenarioId, locale: Locale): Readonly<Record<string, string>> =>
  getDictionary(locale).chapters.ch04.theater.scenarios[scenario].steps;

/** The script as SequenceDiagram messages (payload = the exact frame that crosses the wire). */
export const messagesFor = (scenario: ScenarioId, locale: Locale): readonly SequenceMessage[] => {
  const say = narrations(scenario, locale);
  return SCRIPTS[scenario].map((s) => ({
    id: s.id,
    from: s.out ? "client" : s.relay,
    to: s.out ? s.relay : "client",
    label: frameLabel(s.frame),
    packet: s.frame[0],
    // Script ids are typed against the i18n keys, so the fallback only guards stale translations.
    narration: say[s.id] ?? s.id,
    payload: s.frame,
  }));
};

/** Index of the first step carrying `verb`, or -1. Drives the clickable legend. */
export const firstStepOf = (scenario: ScenarioId, verb: MessageType): number =>
  SCRIPTS[scenario].findIndex((s) => s.frame[0] === verb);

export const LEGEND_VERBS: readonly MessageType[] = [
  "REQ",
  "EVENT",
  "EOSE",
  "CLOSE",
  "OK",
  "NOTICE",
  "CLOSED",
  "AUTH",
];

export interface Notebook {
  /** Relays with an open subscription, in first-opened order. */
  readonly open: readonly LaneId[];
  readonly received: number;
  readonly unique: number;
  readonly accepted: readonly LaneId[];
  readonly rejected: readonly LaneId[];
  readonly authed: readonly LaneId[];
}

export const EMPTY_NOTEBOOK: Notebook = {
  open: [],
  received: 0,
  unique: 0,
  accepted: [],
  rejected: [],
  authed: [],
};

const add = (list: readonly LaneId[], id: LaneId): readonly LaneId[] =>
  list.includes(id) ? list : [...list, id];
const remove = (list: readonly LaneId[], id: LaneId): readonly LaneId[] =>
  list.filter((x) => x !== id);

/** One packet's effect on the client's notebook. `seen` remembers event ids for deduplication. */
const applyStep = (nb: Notebook, { relay, frame }: WireStep, seen: Set<string>): Notebook => {
  switch (frame[0]) {
    case "REQ":
      return { ...nb, open: add(nb.open, relay) };
    case "CLOSE":
    case "CLOSED":
      return { ...nb, open: remove(nb.open, relay) };
    case "EVENT": {
      // Only relay → client EVENTs (with a subscription id) count; a publish carries none.
      const event = frame[2];
      if (event === undefined) return nb;
      const fresh = !seen.has(event.id);
      seen.add(event.id);
      return { ...nb, received: nb.received + 1, unique: nb.unique + (fresh ? 1 : 0) };
    }
    case "OK":
      // The OK answering our AUTH event marks a login, not a stored note.
      if (frame[1] === AUTH_EVENT.id)
        return frame[2] ? { ...nb, authed: add(nb.authed, relay) } : nb;
      return frame[2]
        ? { ...nb, accepted: add(nb.accepted, relay) }
        : { ...nb, rejected: add(nb.rejected, relay) };
    default:
      return nb;
  }
};

/** What the client knows after steps 0..`upTo` (inclusive): a fold, so every scrub position is reproducible. */
export const notebookAt = (steps: readonly WireStep[], upTo: number): Notebook => {
  const seen = new Set<string>();
  return steps
    .slice(0, Math.max(0, upTo + 1))
    .reduce<Notebook>((nb, step) => applyStep(nb, step, seen), EMPTY_NOTEBOOK);
};
