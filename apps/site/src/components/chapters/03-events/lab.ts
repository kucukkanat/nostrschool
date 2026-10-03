/**
 * Pure logic behind chapter 03's interactives: the event "lab" reducer (edit / tamper / re-sign),
 * mapping verification results onto pipeline stages, and field/tag classification for the
 * exploded card and the event inspector. No DOM, no timers — everything here is unit-tested.
 */
import {
  computeEventId,
  type EventShapeError,
  type EventTemplate,
  type Hex,
  type NostrEvent,
  parseEventJson,
  type Result,
  signEvent,
  type Tag,
  type VerifyFailure,
  type VerifySuccess,
  verifyEvent,
} from "@nostrschool/protocol";

export const EVENT_FIELDS = [
  "id",
  "pubkey",
  "created_at",
  "kind",
  "tags",
  "content",
  "sig",
] as const;
export type EventField = (typeof EVENT_FIELDS)[number];

export const isEventField = (value: string): value is EventField =>
  (EVENT_FIELDS as readonly string[]).includes(value);

/** JsonView paths look like "tags.0.1"; the first segment names the top-level field. */
export const fieldFromPath = (path: string): EventField | undefined => {
  const head = path.split(".")[0] ?? "";
  return isEventField(head) ? head : undefined;
};

/* ---------- lab reducer ---------- */

/**
 * "author" holds the secret key, so every edit is re-signed (the event stays valid).
 * "forger" has no key: edits change the bytes but id/sig stay stale, so verification fails.
 */
export type LabMode = "author" | "forger";
export type TamperTarget = "content" | "created_at" | "id" | "sig";

export interface LabState {
  readonly mode: LabMode;
  readonly event: NostrEvent;
}

export type LabAction =
  | { readonly type: "edit-content"; readonly content: string }
  | { readonly type: "shift-time"; readonly seconds: number }
  | { readonly type: "set-mode"; readonly mode: LabMode }
  | { readonly type: "tamper"; readonly target: TamperTarget }
  | { readonly type: "resign" }
  | { readonly type: "reset"; readonly event: NostrEvent };

export type LabError = { readonly code: "no-key" | "invalid-key"; readonly message: string };

const templateOf = (e: NostrEvent): EventTemplate => ({
  kind: e.kind,
  created_at: e.created_at,
  tags: e.tags,
  content: e.content,
});

/**
 * Deterministic aux randomness so the lab's signatures are reproducible (tests, screenshots).
 * Real clients must use fresh randomness (BIP-340); this is a teaching demo only.
 */
const DEMO_AUX = new Uint8Array(32);

const sign = (e: NostrEvent, secretKey: Hex): Result<NostrEvent, LabError> => {
  const signed = signEvent(templateOf(e), secretKey, { auxRand: DEMO_AUX });
  return signed.ok
    ? { ok: true, value: signed.value.event }
    : { ok: false, error: { code: "invalid-key", message: signed.error.message } };
};

/** Flips one hex digit (0↔1, a↔b, …): the smallest possible change to an id or signature. */
export const flipHexChar = (hex: string, index = 0): string => {
  const ch = hex[index];
  if (ch === undefined) return hex;
  const flipped = (Number.parseInt(ch, 16) ^ 1).toString(16);
  return `${hex.slice(0, index)}${flipped}${hex.slice(index + 1)}`;
};

/** Changes a single character of text (swaps the case of the first letter, or appends "!"). */
export const flipTextChar = (text: string): string => {
  const i = text.search(/[a-z]/i);
  if (i === -1) return `${text}!`;
  const ch = text[i] ?? "";
  const swapped = ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
  return `${text.slice(0, i)}${swapped}${text.slice(i + 1)}`;
};

const tamper = (e: NostrEvent, target: TamperTarget): NostrEvent => {
  switch (target) {
    case "content":
      return { ...e, content: flipTextChar(e.content) };
    case "created_at":
      return { ...e, created_at: e.created_at + 1 };
    case "id":
      return { ...e, id: flipHexChar(e.id) };
    case "sig":
      return { ...e, sig: flipHexChar(e.sig) };
  }
};

/**
 * One step of the lab. `secretKey` is the author's key; in "forger" mode it is ignored on
 * purpose, which is the whole lesson: without the key you cannot produce a matching signature.
 */
export const reduceLab = (
  state: LabState,
  action: LabAction,
  secretKey: Hex,
): Result<LabState, LabError> => {
  const withEvent = (event: NostrEvent): Result<LabState, LabError> =>
    state.mode === "author"
      ? mapEvent(sign(event, secretKey), state.mode)
      : { ok: true, value: { mode: state.mode, event } };
  switch (action.type) {
    case "edit-content":
      return withEvent({ ...state.event, content: action.content });
    case "shift-time":
      return withEvent({ ...state.event, created_at: state.event.created_at + action.seconds });
    case "set-mode":
      return { ok: true, value: { ...state, mode: action.mode } };
    // Tampering simulates bytes flipped after signing (by a forger or a broken relay): never re-signed.
    case "tamper":
      return { ok: true, value: { ...state, event: tamper(state.event, action.target) } };
    case "resign":
      return state.mode === "author"
        ? mapEvent(sign(state.event, secretKey), state.mode)
        : {
            ok: false,
            error: { code: "no-key", message: "Forgers do not hold the author's secret key" },
          };
    case "reset":
      return { ok: true, value: { ...state, event: action.event } };
  }
};

const mapEvent = (r: Result<NostrEvent, LabError>, mode: LabMode): Result<LabState, LabError> =>
  r.ok ? { ok: true, value: { mode, event: r.value } } : r;

/* ---------- verification → pipeline ---------- */

export const VERIFY_STAGES = ["serialize", "hash", "compare", "schnorr"] as const;
export type VerifyStage = (typeof VERIFY_STAGES)[number];

export interface VerifyView {
  readonly status: "ok" | "error";
  /** Index into VERIFY_STAGES of the failing check (only when status is "error"). */
  readonly errorAt?: number;
  readonly code?: VerifyFailure["code"];
  readonly serialized: string;
  readonly computedId: Hex;
  readonly claimedId: Hex;
}

/** Runs NIP-01 verification and says which pipeline stage failed. */
export const verifyView = (event: NostrEvent): VerifyView => {
  const result: Result<VerifySuccess, VerifyFailure> = verifyEvent(event);
  // Malformed events still get a best-effort serialization so the pipeline has something to show.
  const steps = result.ok ? result.value.steps : (result.error.steps ?? computeEventId(event));
  const base = { serialized: steps.serialized, computedId: steps.id, claimedId: event.id };
  if (result.ok) return { status: "ok", ...base };
  const errorAt: Record<VerifyFailure["code"], number> = {
    malformed: 0,
    "id-mismatch": 2,
    "invalid-pubkey": 3,
    "bad-signature": 3,
  };
  return { status: "error", errorAt: errorAt[result.error.code], code: result.error.code, ...base };
};

/** Fields that verification blames, so the exploded card can flag them. */
const BLAMED: Record<VerifyFailure["code"], readonly EventField[]> = {
  "id-mismatch": ["id"],
  "invalid-pubkey": ["pubkey"],
  "bad-signature": ["sig"],
  malformed: EVENT_FIELDS,
};

export const suspectFields = (view: VerifyView): readonly EventField[] =>
  view.code === undefined ? [] : BLAMED[view.code];

/* ---------- hash avalanche ---------- */

/** Per-character "did it change?" mask between two equally long hex strings. */
export const diffMask = (before: string, after: string): readonly boolean[] =>
  [...after].map((ch, i) => before[i] !== ch);

export const countChanged = (before: string, after: string): number =>
  diffMask(before, after).filter(Boolean).length;

/* ---------- tags ---------- */

export const KNOWN_TAGS = ["e", "p", "a", "t", "d", "q", "r", "imeta", "client"] as const;
export type KnownTag = (typeof KNOWN_TAGS)[number];
export type TagKind = KnownTag | "other";

export const tagKind = (tag: Tag): TagKind => {
  const name = tag[0];
  return (KNOWN_TAGS as readonly string[]).includes(name) ? (name as KnownTag) : "other";
};

/** Single-letter tags are the ones relays index (filterable as `#e`, `#p`, …) per NIP-01. */
export const isIndexedTag = (tag: Tag): boolean => /^[a-zA-Z]$/.test(tag[0]);

/** Shortens long hex values for compact cards: "abcd1234…ef90". */
export const shortHex = (value: string, head = 8, tail = 4): string =>
  value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;

/* ---------- inspector ---------- */

export interface Inspection {
  readonly event: NostrEvent;
  readonly view: VerifyView;
}

/** Event inspector entry point: parse + shape-check pasted JSON, then verify it. */
export const inspectJson = (json: string): Result<Inspection, EventShapeError> => {
  const parsed = parseEventJson(json);
  return parsed.ok
    ? { ok: true, value: { event: parsed.value, view: verifyView(parsed.value) } }
    : parsed;
};

export const prettyEvent = (e: NostrEvent): string =>
  JSON.stringify(
    {
      id: e.id,
      pubkey: e.pubkey,
      created_at: e.created_at,
      kind: e.kind,
      tags: e.tags,
      content: e.content,
      sig: e.sig,
    },
    null,
    2,
  );
