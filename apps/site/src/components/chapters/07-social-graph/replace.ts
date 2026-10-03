/**
 * Chapter 07 "overwrite trap": kind 3 is a replaceable event (NIP-01/NIP-02), so a relay keeps
 * only the newest list per author. Publishing from a device with a stale copy silently drops
 * follows. Real signatures (fixture keys are public by design), real replaceable semantics.
 */
import {
  FIXTURE_NOW,
  getPersona,
  PERSONAS,
  type PersonaId,
  personaByPubkey,
} from "@nostrschool/fixtures";
import type { NostrEvent, Result, Tag } from "@nostrschool/protocol";
import { type KeyError, signEvent } from "@nostrschool/protocol";
import { writeRelays } from "./outbox.ts";

export const OWNER: PersonaId = "grace";
/** What the forgotten tablet still believes Grace follows. */
export const TABLET_FOLLOWS: readonly PersonaId[] = ["alice"];
export const CANDIDATES: readonly PersonaId[] = PERSONAS.map((p) => p.id).filter(
  (id) => id !== OWNER,
);

export type Device = "phone" | "tablet";

export interface Published {
  readonly version: number;
  readonly device: Device;
  readonly event: NostrEvent;
}

/** NIP-02 p tag: ["p", pubkey, relay hint, petname]. */
export const followTag = (id: PersonaId): Tag => {
  const p = getPersona(id);
  return ["p", p.pubkey, writeRelays(id)[0] ?? "", p.name];
};

export const buildFollowList = (
  owner: PersonaId,
  follows: readonly PersonaId[],
  createdAt: number,
): Result<NostrEvent, KeyError> => {
  const signed = signEvent(
    { kind: 3, created_at: createdAt, tags: follows.map(followTag), content: "" },
    getPersona(owner).secretKey,
    // Fixed aux randomness: same list + time ⇒ same signature, so tests and SSR agree.
    { auxRand: new Uint8Array(32) },
  );
  return signed.ok ? { ok: true, value: signed.value.event } : signed;
};

/** NIP-01: newest created_at wins; on a tie the lowest id (lexical) is kept. */
export const newestReplaceable = (events: readonly NostrEvent[]): NostrEvent | undefined =>
  events.reduce<NostrEvent | undefined>(
    (best, e) =>
      best === undefined ||
      e.created_at > best.created_at ||
      (e.created_at === best.created_at && e.id < best.id)
        ? e
        : best,
    undefined,
  );

export const followsInEvent = (e: NostrEvent | undefined): readonly PersonaId[] =>
  (e?.tags ?? []).flatMap((t) => {
    const id = t[0] === "p" && t[1] !== undefined ? personaByPubkey(t[1])?.id : undefined;
    return id === undefined ? [] : [id];
  });

export const lostFollows = (
  before: readonly PersonaId[],
  after: readonly PersonaId[],
): readonly PersonaId[] => before.filter((id) => !after.includes(id));

/** Each publish happens a minute after the previous one, so the relay can order them. */
export const publish = (
  history: readonly Published[],
  device: Device,
  follows: readonly PersonaId[],
): Result<readonly Published[], KeyError> => {
  const version = history.length + 1;
  const event = buildFollowList(OWNER, follows, FIXTURE_NOW + version * 60);
  return event.ok
    ? { ok: true, value: [...history, { version, device, event: event.value }] }
    : event;
};

/** What the relay holds after all publishes: only the newest. */
export const relayKeeps = (history: readonly Published[]): Published | undefined => {
  const newest = newestReplaceable(history.map((h) => h.event));
  return history.find((h) => h.event === newest);
};

export const toggle = (list: readonly PersonaId[], id: PersonaId): readonly PersonaId[] =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
