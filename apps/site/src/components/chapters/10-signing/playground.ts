/**
 * The "who sees your key?" playground as a pure state machine. Three ways for an app to get a
 * note signed; each records exactly what the app's memory and the wire end up holding, so the
 * UI (and tests) can audit — with a real substring search — whether the secret key leaked.
 */
import {
  deriveSecretKey,
  type EventTemplate,
  encodeNsec,
  type KeyError,
  type Keypair,
  keypairFromSecret,
  type NostrEvent,
  ok,
  type Result,
  signEvent,
} from "@nostrschool/protocol";
import { type Nip46Error, type Nip46Hop, runNip46Session } from "./nip46.ts";

export const SIGNER_MODES = ["paste", "nip07", "nip46"] as const;
export type SignerMode = (typeof SIGNER_MODES)[number];

export interface DemoKeys {
  /** The learner's demo identity. Derived from a public label: never a real key. */
  readonly user: Keypair;
  /** NIP-46: the app's throwaway "client keypair". */
  readonly client: Keypair;
  /** NIP-46: the bunker's own communication keypair. */
  readonly bunker: Keypair;
}

const derive = (label: string): Result<Keypair, KeyError> =>
  keypairFromSecret(deriveSecretKey(`nostrschool:ch10:${label}`));

export const demoKeys = (): Result<DemoKeys, KeyError> => {
  const user = derive("user");
  const client = derive("client");
  const bunker = derive("bunker");
  if (!user.ok) return user;
  if (!client.ok) return client;
  if (!bunker.ok) return bunker;
  return ok({ user: user.value, client: client.value, bunker: bunker.value });
};

export const DEMO_RELAY = "wss://relay.alpha.example";
export const DEMO_SECRET = "classroom-42";

/** Labels are i18n keys (`memory.<key>`); values are the literal data held. */
export type MemoryKey =
  | "nsec"
  | "pubkey"
  | "template"
  | "signedEvent"
  | "clientKey"
  | "bunkerUrl"
  | "rejection";
export interface MemoryItem {
  readonly key: MemoryKey;
  readonly value: string;
}

export type WireKey =
  | "pasteEvent"
  | "nip07Request"
  | "nip07Approve"
  | "nip07Response"
  | "nip46ConnectReq"
  | "nip46ConnectRes"
  | "nip46PubkeyReq"
  | "nip46PubkeyRes"
  | "nip46SignReq"
  | "nip46SignRes"
  | "publish";
export interface WireItem {
  readonly key: WireKey;
  readonly from: "app" | "signer" | "relay";
  readonly to: "app" | "signer" | "relay";
  /** Exactly what crossed this hop (encrypted for NIP-46). */
  readonly payload: unknown;
}

export type Phase = "idle" | "awaiting" | "signed" | "rejected";

export interface PlaygroundState {
  readonly mode: SignerMode;
  readonly phase: Phase;
  readonly template?: EventTemplate;
  readonly memory: readonly MemoryItem[];
  readonly wire: readonly WireItem[];
  readonly event?: NostrEvent;
}

export const initialState = (mode: SignerMode): PlaygroundState => ({
  mode,
  phase: "idle",
  memory: [],
  wire: [],
});

export const makeTemplate = (content: string, createdAt: number): EventTemplate => ({
  kind: 1,
  created_at: createdAt,
  tags: [],
  content,
});

export type PlaygroundError = KeyError | Nip46Error;

const json = (x: unknown): string => JSON.stringify(x);

/**
 * The app asks for a signature. Pasting the nsec signs immediately (the app holds the key!);
 * the signer modes stop at "awaiting" until the human decides inside the signer.
 */
export const requestSignature = (
  state: PlaygroundState,
  keys: DemoKeys,
  template: EventTemplate,
): Result<PlaygroundState, PlaygroundError> => {
  const base = { ...initialState(state.mode), template };
  if (state.mode === "paste") {
    const nsec = encodeNsec(keys.user.secretKey);
    const signed = signEvent(template, keys.user.secretKey);
    if (!signed.ok) return signed;
    // encodeNsec only fails for malformed keys, which keypairFromSecret already rejected.
    const nsecText = nsec.ok ? nsec.value : keys.user.secretKeyHex;
    const event = signed.value.event;
    return ok({
      ...base,
      phase: "signed",
      event,
      memory: [
        { key: "nsec", value: nsecText },
        { key: "template", value: json(template) },
        { key: "signedEvent", value: json(event) },
      ],
      wire: [{ key: "publish", from: "app", to: "relay", payload: ["EVENT", event] }],
    });
  }
  if (state.mode === "nip07")
    return ok({
      ...base,
      phase: "awaiting",
      memory: [
        { key: "pubkey", value: keys.user.publicKey },
        { key: "template", value: json(template) },
      ],
      wire: [
        {
          key: "nip07Request",
          from: "app",
          to: "signer",
          payload: { method: "signEvent", params: template },
        },
      ],
    });
  return ok({
    ...base,
    phase: "awaiting",
    memory: [
      {
        key: "bunkerUrl",
        value: `bunker://${keys.bunker.publicKey}?relay=${DEMO_RELAY}&secret=${DEMO_SECRET}`,
      },
      { key: "clientKey", value: keys.client.secretKeyHex },
      { key: "template", value: json(template) },
    ],
    wire: [],
  });
};

const HOP_WIRE_KEYS: Readonly<Record<Nip46Hop["id"], WireKey>> = {
  "connect-req": "nip46ConnectReq",
  "connect-res": "nip46ConnectRes",
  "pubkey-req": "nip46PubkeyReq",
  "pubkey-res": "nip46PubkeyRes",
  "sign-req": "nip46SignReq",
  "sign-res": "nip46SignRes",
};

const nip46Wire = (hops: readonly Nip46Hop[]): readonly WireItem[] =>
  hops.map((h) => ({
    key: HOP_WIRE_KEYS[h.id],
    from: h.direction === "to-bunker" ? "app" : "signer",
    to: h.direction === "to-bunker" ? "signer" : "app",
    payload: h.sealed.event,
  }));

/** The human approves or rejects inside the signer. Only the signer touches the secret key. */
export const decide = (
  state: PlaygroundState,
  keys: DemoKeys,
  approve: boolean,
): Result<PlaygroundState, PlaygroundError> => {
  const template = state.template;
  if (state.phase !== "awaiting" || template === undefined) return ok(state);
  const finish = (event: NostrEvent | undefined, wire: readonly WireItem[]): PlaygroundState =>
    event === undefined
      ? {
          ...state,
          phase: "rejected",
          wire,
          memory: [...state.memory, { key: "rejection", value: "user rejected the request" }],
        }
      : {
          ...state,
          phase: "signed",
          event,
          wire: [...wire, { key: "publish", from: "app", to: "relay", payload: ["EVENT", event] }],
          memory: [...state.memory, { key: "signedEvent", value: json(event) }],
        };

  if (state.mode === "nip46") {
    const session = runNip46Session({
      client: keys.client,
      bunker: keys.bunker,
      user: keys.user,
      relay: DEMO_RELAY,
      secret: DEMO_SECRET,
      template,
      approve,
    });
    return session.ok ? ok(finish(session.value.event, nip46Wire(session.value.hops))) : session;
  }
  const asked = state.wire;
  if (!approve) return ok(finish(undefined, asked));
  const signed = signEvent(template, keys.user.secretKey);
  if (!signed.ok) return signed;
  const event = signed.value.event;
  return ok(
    finish(event, [
      ...asked,
      { key: "nip07Approve", from: "signer", to: "signer", payload: { approved: true } },
      { key: "nip07Response", from: "signer", to: "app", payload: event },
    ]),
  );
};

/** The audit: does anything the app holds, or anything that crossed the wire, contain the secret? */
export const leaksSecret = (state: PlaygroundState, user: Keypair): boolean => {
  const nsec = encodeNsec(user.secretKey);
  const needles = [user.secretKeyHex, ...(nsec.ok ? [nsec.value] : [])];
  const haystack = [...state.memory.map((m) => m.value), ...state.wire.map((w) => json(w.payload))];
  return haystack.some((h) => needles.some((n) => h.includes(n)));
};
