/**
 * Message lists for the NIP-07 and NIP-46 sequence diagrams. Payloads are real (signed with demo
 * keys, NIP-44 encrypted); the words come from i18n, keyed by the message ids below.
 */
import type { LaneKind, PacketType, SequenceLane, SequenceMessage } from "@nostrschool/diagrams";
import { type EventTemplate, ok, type Result, signEvent } from "@nostrschool/protocol";
import { type Nip46Error, runNip46Session } from "./nip46.ts";
import { DEMO_RELAY, DEMO_SECRET, type DemoKeys, type PlaygroundError } from "./playground.ts";

export const NIP07_LANES = ["user", "app", "extension", "relay"] as const;
export const NIP46_LANES = ["user", "app", "relay", "bunker"] as const;
export type Nip07Lane = (typeof NIP07_LANES)[number];
export type Nip46Lane = (typeof NIP46_LANES)[number];

export const NIP07_IDS = ["getPk", "pk", "sign", "ask", "yes", "signed", "publish"] as const;
export const NIP46_IDS = [
  "paste",
  "connectReq",
  "connectFwd",
  "ackReq",
  "ackFwd",
  "getPkReq",
  "getPkFwd",
  "pkReq",
  "pkFwd",
  "signReq",
  "signFwd",
  "ask",
  "yes",
  "signedReq",
  "signedFwd",
  "publish",
] as const;
export type Nip07Id = (typeof NIP07_IDS)[number];
export type Nip46Id = (typeof NIP46_IDS)[number];

export interface SeqMessage<Id extends string, Lane extends string> {
  readonly id: Id;
  readonly from: Lane;
  readonly to: Lane;
  readonly packet?: PacketType;
  readonly payload: unknown;
}

export const nip07Sequence = (
  keys: DemoKeys,
  template: EventTemplate,
): Result<readonly SeqMessage<Nip07Id, Nip07Lane>[], PlaygroundError> => {
  const signed = signEvent(template, keys.user.secretKey);
  if (!signed.ok) return signed;
  const event = signed.value.event;
  return ok([
    { id: "getPk", from: "app", to: "extension", payload: "await window.nostr.getPublicKey()" },
    { id: "pk", from: "extension", to: "app", payload: keys.user.publicKey },
    { id: "sign", from: "app", to: "extension", payload: template },
    {
      id: "ask",
      from: "extension",
      to: "user",
      payload: { kind: template.kind, content: template.content },
    },
    { id: "yes", from: "user", to: "extension", payload: { approved: true } },
    { id: "signed", from: "extension", to: "app", payload: event },
    { id: "publish", from: "app", to: "relay", packet: "EVENT", payload: ["EVENT", event] },
  ]);
};

export const nip46Sequence = (
  keys: DemoKeys,
  template: EventTemplate,
): Result<readonly SeqMessage<Nip46Id, Nip46Lane>[], Nip46Error> => {
  const session = runNip46Session({
    client: keys.client,
    bunker: keys.bunker,
    user: keys.user,
    relay: DEMO_RELAY,
    secret: DEMO_SECRET,
    template,
    approve: true,
  });
  if (!session.ok) return session;
  const { hops, bunkerUrl, event } = session.value;
  // Each hop is published to the relay, then delivered to the subscriber on the other side.
  const wire = (i: number): unknown => hops[i]?.sealed.event;
  const plain = (i: number): unknown => hops[i]?.rpc;
  const relayed = (i: number): unknown => ({ relaySees: wire(i), recipientDecrypts: plain(i) });
  return ok([
    { id: "paste", from: "user", to: "app", payload: bunkerUrl },
    { id: "connectReq", from: "app", to: "relay", packet: "EVENT", payload: ["EVENT", wire(0)] },
    { id: "connectFwd", from: "relay", to: "bunker", packet: "EVENT", payload: relayed(0) },
    { id: "ackReq", from: "bunker", to: "relay", packet: "EVENT", payload: ["EVENT", wire(1)] },
    { id: "ackFwd", from: "relay", to: "app", packet: "EVENT", payload: relayed(1) },
    { id: "getPkReq", from: "app", to: "relay", packet: "EVENT", payload: ["EVENT", wire(2)] },
    { id: "getPkFwd", from: "relay", to: "bunker", packet: "EVENT", payload: relayed(2) },
    { id: "pkReq", from: "bunker", to: "relay", packet: "EVENT", payload: ["EVENT", wire(3)] },
    { id: "pkFwd", from: "relay", to: "app", packet: "EVENT", payload: relayed(3) },
    { id: "signReq", from: "app", to: "relay", packet: "EVENT", payload: ["EVENT", wire(4)] },
    { id: "signFwd", from: "relay", to: "bunker", packet: "EVENT", payload: relayed(4) },
    {
      id: "ask",
      from: "bunker",
      to: "user",
      payload: { kind: template.kind, content: template.content },
    },
    { id: "yes", from: "user", to: "bunker", payload: { approved: true } },
    { id: "signedReq", from: "bunker", to: "relay", packet: "EVENT", payload: ["EVENT", wire(5)] },
    { id: "signedFwd", from: "relay", to: "app", packet: "EVENT", payload: relayed(5) },
    { id: "publish", from: "app", to: "relay", packet: "EVENT", payload: ["EVENT", event] },
  ]);
};

/** Diagram lane styling per actor. */
export const LANE_KINDS: Readonly<Record<Nip07Lane | Nip46Lane, LaneKind>> = {
  user: "user",
  app: "client",
  extension: "extension",
  relay: "relay",
  bunker: "signer",
};

export const toLanes = <Lane extends Nip07Lane | Nip46Lane>(
  ids: readonly Lane[],
  labels: Readonly<Record<Lane, string>>,
): SequenceLane[] => ids.map((id) => ({ id, label: labels[id], kind: LANE_KINDS[id] }));

/** Joins real payloads with localized words; non-Nostr hops (JS calls, taps) draw as "custom". */
export const toMessages = <Id extends string, Lane extends string>(
  seq: readonly SeqMessage<Id, Lane>[],
  words: Readonly<Record<Id, { readonly label: string; readonly narration: string }>>,
): SequenceMessage[] =>
  seq.map((m) => ({
    id: m.id,
    from: m.from,
    to: m.to,
    label: words[m.id].label,
    narration: words[m.id].narration,
    payload: m.payload,
    packet: m.packet ?? "custom",
  }));
