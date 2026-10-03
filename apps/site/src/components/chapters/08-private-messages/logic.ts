/**
 * Chapter 08 logic: build the same DM three ways (NIP-04, NIP-44, NIP-17 gift wrap) with REAL
 * crypto from @nostrschool/protocol, describe what a relay can see, and peel layers with a key.
 * Pure functions only, so the Svelte islands stay thin and everything here is unit-tested.
 */
import {
  type CryptoError,
  fail,
  type GiftWrapSteps,
  giftWrap,
  type Hex,
  type KeyError,
  type Nip04Steps,
  type Nip44EncryptSteps,
  type NostrEvent,
  nip04Decrypt,
  nip04Encrypt,
  nip44ConversationKey,
  nip44Decrypt,
  nip44Encrypt,
  nip44PaddedLength,
  ok,
  type ProtocolError,
  parseJson,
  type Result,
  type Rumor,
  signEvent,
  type UnixSeconds,
  utf8Encode,
  validateEventShape,
  validateRumorShape,
} from "@nostrschool/protocol";

export type Scheme = "nip04" | "nip44" | "nip17";
export const SCHEMES: readonly Scheme[] = ["nip04", "nip44", "nip17"];

/** Kind 4 is the legacy NIP-04 DM kind; kind 14 is the NIP-17 chat message inside the rumor. */
export const LEGACY_DM_KIND = 4;
export const CHAT_KIND = 14;
/** Keep demo messages short enough to stay readable inside nested JSON. */
export const MAX_MESSAGE_LENGTH = 280;

export interface Party {
  readonly secretKey: Uint8Array;
  readonly pubkey: Hex;
}

/** Fixed randomness, only for reproducible tests; the UI lets everything be random. */
export interface ScenarioSeed {
  readonly iv?: Uint8Array;
  readonly nonce?: Uint8Array;
  readonly ephemeralSecretKey?: Uint8Array;
  readonly sealNonce?: Uint8Array;
  readonly wrapNonce?: Uint8Array;
  readonly sealCreatedAt?: UnixSeconds;
  readonly wrapCreatedAt?: UnixSeconds;
  readonly auxRand?: Uint8Array;
}

export interface ScenarioInput {
  readonly scheme: Scheme;
  readonly message: string;
  readonly sender: Party;
  readonly recipient: Party;
  readonly now: UnixSeconds;
  readonly seed?: ScenarioSeed;
}

export type Scenario =
  | { readonly scheme: "nip04"; readonly event: NostrEvent; readonly steps: Nip04Steps }
  | { readonly scheme: "nip44"; readonly event: NostrEvent; readonly steps: Nip44EncryptSteps }
  | { readonly scheme: "nip17"; readonly event: NostrEvent; readonly steps: GiftWrapSteps };

export type ScenarioError =
  | ProtocolError<"empty-message" | "message-too-long">
  | CryptoError
  | KeyError;

export const validateMessage = (
  message: string,
): Result<string, ProtocolError<"empty-message" | "message-too-long">> => {
  const trimmed = message.trim();
  if (trimmed.length === 0) return fail("empty-message", "Type a message first");
  if ([...trimmed].length > MAX_MESSAGE_LENGTH)
    return fail("message-too-long", `Messages are limited to ${MAX_MESSAGE_LENGTH} characters`);
  return ok(trimmed);
};

/** Signs a legacy-style DM: author and `p` tag in the clear, only `content` encrypted. */
const signLegacy = (input: ScenarioInput, content: string): Result<NostrEvent, KeyError> => {
  const template = {
    kind: LEGACY_DM_KIND,
    created_at: input.now,
    tags: [["p", input.recipient.pubkey]] as const,
    content,
  };
  const auxRand = input.seed?.auxRand;
  const signed = signEvent(
    template,
    input.sender.secretKey,
    auxRand === undefined ? {} : { auxRand },
  );
  return signed.ok ? ok(signed.value.event) : signed;
};

export const buildScenario = (input: ScenarioInput): Result<Scenario, ScenarioError> => {
  const message = validateMessage(input.message);
  if (!message.ok) return message;
  const seed = input.seed ?? {};
  switch (input.scheme) {
    case "nip04": {
      const steps = nip04Encrypt(
        message.value,
        input.sender.secretKey,
        input.recipient.pubkey,
        seed.iv === undefined ? {} : { iv: seed.iv },
      );
      if (!steps.ok) return steps;
      const event = signLegacy(input, steps.value.payload);
      return event.ok ? ok({ scheme: "nip04", event: event.value, steps: steps.value }) : event;
    }
    case "nip44": {
      const key = nip44ConversationKey(input.sender.secretKey, input.recipient.pubkey);
      if (!key.ok) return key;
      const steps = nip44Encrypt(
        message.value,
        key.value,
        seed.nonce === undefined ? {} : { nonce: seed.nonce },
      );
      if (!steps.ok) return steps;
      const event = signLegacy(input, steps.value.payload);
      return event.ok ? ok({ scheme: "nip44", event: event.value, steps: steps.value }) : event;
    }
    case "nip17": {
      const steps = giftWrap({
        template: {
          kind: CHAT_KIND,
          created_at: input.now,
          tags: [["p", input.recipient.pubkey]],
          content: message.value,
        },
        senderSecretKey: input.sender.secretKey,
        recipientPubkey: input.recipient.pubkey,
        ...defined(seed),
      });
      return steps.ok
        ? ok({ scheme: "nip17", event: steps.value.wrap, steps: steps.value })
        : steps;
    }
  }
};

/** Drops undefined values so `exactOptionalPropertyTypes` accepts the spread. */
const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

/* ---------- What the relay sees ---------- */

export type MetaField = "sender" | "recipient" | "time" | "length" | "kind" | "content";
export const META_FIELDS: readonly MetaField[] = [
  "sender",
  "recipient",
  "time",
  "kind",
  "length",
  "content",
];
/** leaked = the true value is public; blurred = public but deliberately fuzzy; hidden = gone. */
export type Exposure = "leaked" | "blurred" | "hidden";

export interface RelayFact {
  readonly field: MetaField;
  readonly exposure: Exposure;
  /** What a relay literally reads off the event (data, not prose). */
  readonly shown: string;
  /** The real value it corresponds to, for the side-by-side comparison. */
  readonly truth: string;
  /** i18n key (chapters.ch08.lab.factDetail) explaining this fact. */
  readonly detail: FactDetailKey;
}

export type FactDetailKey =
  | "senderLeaked"
  | "senderHidden"
  | "recipientLeaked"
  | "timeLeaked"
  | "timeBlurred"
  | "kindLeaked"
  | "kindHidden"
  | "lengthLeaked"
  | "lengthBlurred"
  | "contentHidden";

/** NIP-04 uses AES-CBC: ciphertext is the UTF-8 length rounded up to the next 16-byte block. */
export const cbcLength = (bytes: number): number => (Math.floor(bytes / 16) + 1) * 16;

export const byteLength = (text: string): number => utf8Encode(text).length;

export const relayView = (scenario: Scenario, input: ScenarioInput): readonly RelayFact[] => {
  const { event } = scenario;
  const realBytes = byteLength(input.message.trim());
  const recipient = event.tags.find((t) => t[0] === "p")?.[1] ?? "";
  const base = {
    recipient: fact("recipient", "leaked", recipient, input.recipient.pubkey),
    content: fact("content", "hidden", event.content, input.message.trim()),
  };
  switch (scenario.scheme) {
    case "nip04":
      return [
        fact("sender", "leaked", event.pubkey, input.sender.pubkey),
        base.recipient,
        fact("time", "leaked", String(event.created_at), String(input.now)),
        fact("kind", "leaked", String(event.kind), String(LEGACY_DM_KIND)),
        fact("length", "leaked", String(scenario.steps.ciphertext.length), String(realBytes)),
        base.content,
      ];
    case "nip44":
      return [
        fact("sender", "leaked", event.pubkey, input.sender.pubkey),
        base.recipient,
        fact("time", "leaked", String(event.created_at), String(input.now)),
        fact("kind", "leaked", String(event.kind), String(LEGACY_DM_KIND)),
        fact("length", "blurred", String(nip44PaddedLength(realBytes)), String(realBytes)),
        base.content,
      ];
    case "nip17":
      return [
        // The wrap is signed by a one-time key: the real author is not on the outside at all.
        fact("sender", "hidden", event.pubkey, input.sender.pubkey),
        base.recipient,
        fact("time", "blurred", String(event.created_at), String(input.now)),
        fact("kind", "hidden", String(event.kind), String(CHAT_KIND)),
        fact(
          "length",
          "blurred",
          String(scenario.steps.wrapEncryption.padded.length - 2),
          String(realBytes),
        ),
        base.content,
      ];
  }
};

const fact = (field: MetaField, exposure: Exposure, shown: string, truth: string): RelayFact => ({
  field,
  exposure,
  shown,
  truth,
  // Every (field, exposure) pair relayView emits has a matching message key.
  detail: `${field}${exposure[0]?.toUpperCase() ?? ""}${exposure.slice(1)}` as FactDetailKey,
});

export interface DetailFormatters {
  /** Display name for a pubkey, or undefined for strangers (e.g. the throwaway wrap key). */
  readonly nameOf: (pubkey: Hex) => string | undefined;
  readonly formatTime: (unixSeconds: UnixSeconds) => string;
}

/** Placeholder values for a fact's explanation message ({name}, {time}, {hours}, …). */
export const detailParams = (
  f: RelayFact,
  { nameOf, formatTime }: DetailFormatters,
): Readonly<Record<string, string | number>> => {
  const shownNum = Number(f.shown);
  const truthNum = Number(f.truth);
  return {
    name: nameOf(f.shown) ?? nameOf(f.truth) ?? shorten(f.shown),
    key: shorten(f.shown),
    shown: f.field === "content" ? shorten(f.shown, 12) : f.shown,
    truth: f.truth,
    kind: f.shown,
    time: f.field === "time" ? formatTime(shownNum) : "",
    hours: f.field === "time" ? Math.round(timeShift(shownNum, truthNum) / 3600) : 0,
  };
};

export const leakCount = (facts: readonly RelayFact[]): number =>
  facts.filter((f) => f.exposure === "leaked").length;

/* ---------- Peeling layers ---------- */

export type LayerId = "wrap" | "seal" | "rumor" | "dm";

/** Outermost first. The last layer is the readable message. */
export const layerIds = (scheme: Scheme): readonly LayerId[] =>
  scheme === "nip17" ? ["wrap", "seal", "rumor"] : ["dm"];

export type PeelErrorCode =
  | "no-key"
  | "nothing-left"
  | "decrypt-failed"
  | "invalid-layer"
  | "author-mismatch";
export type PeelError = ProtocolError<PeelErrorCode>;

export type Revealed =
  | { readonly layer: "seal"; readonly event: NostrEvent }
  | { readonly layer: "rumor"; readonly event: Rumor; readonly authorVerified: true }
  | { readonly layer: "message"; readonly text: string };

/**
 * Opens layer `depth` (0 = outermost) with `secretKey`, using real decryption. `undefined` means
 * "no key at all" (the relay's point of view). Wrong keys fail with the real crypto error —
 * except NIP-04, which has no MAC and may hand back garbage instead (a flaw we want to show).
 */
export const peel = (
  scenario: Scenario,
  depth: number,
  secretKey: Uint8Array | undefined,
): Result<Revealed, PeelError> => {
  if (secretKey === undefined) return fail("no-key", "No secret key, no way in");
  const { event } = scenario;
  switch (scenario.scheme) {
    case "nip04": {
      if (depth !== 0) return fail("nothing-left", "Only one layer");
      // The recipient decrypts with the author's pubkey (ECDH is symmetric).
      const text = nip04Decrypt(event.content, secretKey, event.pubkey);
      return text.ok
        ? ok({ layer: "message", text: text.value })
        : fail("decrypt-failed", text.error.message);
    }
    case "nip44": {
      if (depth !== 0) return fail("nothing-left", "Only one layer");
      const text = decryptNip44(event, secretKey);
      return text.ok ? ok({ layer: "message", text: text.value }) : text;
    }
    case "nip17": {
      if (depth === 0) {
        const json = decryptNip44(event, secretKey);
        if (!json.ok) return json;
        const seal = parseLayer(json.value, validateEventShape);
        return seal.ok ? ok({ layer: "seal", event: seal.value }) : seal;
      }
      if (depth === 1) {
        const seal = scenario.steps.seal;
        const json = decryptNip44(seal, secretKey);
        if (!json.ok) return json;
        const rumor = parseLayer(json.value, validateRumorShape);
        if (!rumor.ok) return rumor;
        // NIP-17: the seal signer MUST be the rumor author, or anyone could forge "from Alice".
        if (rumor.value.pubkey !== seal.pubkey)
          return fail("author-mismatch", "Rumor author differs from the seal signer");
        return ok({ layer: "rumor", event: rumor.value, authorVerified: true });
      }
      return fail("nothing-left", "The rumor is the innermost layer");
    }
  }
};

const decryptNip44 = (event: NostrEvent, secretKey: Uint8Array): Result<string, PeelError> => {
  const key = nip44ConversationKey(secretKey, event.pubkey);
  if (!key.ok) return fail("decrypt-failed", key.error.message);
  const plain = nip44Decrypt(event.content, key.value);
  return plain.ok ? ok(plain.value.plaintext) : fail("decrypt-failed", plain.error.message);
};

const parseLayer = <T>(
  json: string,
  validate: (x: unknown) => Result<T, ProtocolError>,
): Result<T, PeelError> => {
  const parsed = parseJson(json);
  if (!parsed.ok) return fail("invalid-layer", parsed.error.message);
  const valid = validate(parsed.value);
  return valid.ok ? valid : fail("invalid-layer", valid.error.message);
};

/* ---------- Formatting helpers ---------- */

/** "abcd…wxyz" for long hex/base64 strings, so 64-char keys fit on a phone. */
export const shorten = (value: string, keep = 8): string =>
  value.length <= keep * 2 + 1 ? value : `${value.slice(0, keep)}…${value.slice(-keep)}`;

/** Seconds between the real send time and the timestamp a relay sees (NIP-59 tweak). */
export const timeShift = (shown: UnixSeconds, truth: UnixSeconds): number => truth - shown;

/* ---------- Padding meter ---------- */

export interface PaddingRow {
  readonly bytes: number;
  readonly nip04: number;
  readonly nip44: number;
}

/** What each scheme reveals about a message of `bytes` UTF-8 bytes (ciphertext body length). */
export const paddingRow = (bytes: number): PaddingRow => ({
  bytes,
  nip04: cbcLength(bytes),
  nip44: bytes < 1 ? 32 : nip44PaddedLength(bytes),
});

/** Messages that look identical to a relay under NIP-44: every length in the same bucket. */
export const nip44Bucket = (bytes: number): { readonly min: number; readonly max: number } => {
  const size = paddingRow(bytes).nip44;
  const min =
    Array.from({ length: size }, (_, i) => i + 1).find((n) => nip44PaddedLength(n) === size) ?? 1;
  return { min, max: size };
};
