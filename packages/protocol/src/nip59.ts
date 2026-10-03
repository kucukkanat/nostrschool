/**
 * NIP-59 gift wrap (used by NIP-17 DMs): rumor (unsigned) → seal (kind 13, signed by sender,
 * NIP-44 to recipient) → wrap (kind 1059, signed by a throwaway key). Steps exposed for chapter 8.
 */

import { randomBytes } from "./encoding.ts";
import {
  computeEventId,
  parseJson,
  signEvent,
  validateEventShape,
  validateRumorShape,
  verifyEvent,
} from "./event.ts";
import { generateKeypair, type KeyError, type Keypair, keypairFromSecret } from "./keys.ts";
import {
  type CryptoError,
  type Nip44EncryptSteps,
  nip44ConversationKey,
  nip44Decrypt,
  nip44Encrypt,
} from "./nip44.ts";
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { EventTemplate, Hex, NostrEvent, Rumor, Tag, UnixSeconds } from "./types.ts";

/** Adds pubkey and id to a template, without signing. */
export const createRumor = (template: EventTemplate, authorPubkey: Hex): Rumor => {
  const unsigned = {
    kind: template.kind,
    created_at: template.created_at,
    tags: template.tags,
    content: template.content,
    pubkey: authorPubkey,
  };
  return { ...unsigned, id: computeEventId(unsigned).id };
};

export const SEAL_KIND = 13;
export const GIFT_WRAP_KIND = 1059;
const TWO_DAYS = 2 * 24 * 60 * 60;

/** "Now" minus up to two days, so relays cannot correlate a wrap with when it was sent. */
export const randomizedTimestamp = (
  now: UnixSeconds = Math.floor(Date.now() / 1000),
): UnixSeconds => {
  const r = new DataView(randomBytes(4).buffer).getUint32(0);
  return now - (r % TWO_DAYS);
};

export interface GiftWrapInput {
  /** Template of the real message, e.g. a kind 14 chat message. */
  readonly template: EventTemplate;
  readonly senderSecretKey: Uint8Array | Hex;
  readonly recipientPubkey: Hex;
  /** Everything below exists to make fixtures reproducible; omit in normal use. */
  readonly ephemeralSecretKey?: Uint8Array | Hex;
  /** NIP-59 randomizes seal/wrap timestamps up to 2 days in the past to hide timing. */
  readonly sealCreatedAt?: UnixSeconds;
  readonly wrapCreatedAt?: UnixSeconds;
  readonly sealNonce?: Uint8Array;
  readonly wrapNonce?: Uint8Array;
  readonly auxRand?: Uint8Array;
}

export interface GiftWrapSteps {
  readonly rumor: Rumor;
  /** NIP-44 encryption of the rumor JSON, sender → recipient. */
  readonly sealEncryption: Nip44EncryptSteps;
  /** kind 13, signed by the real sender, empty tags. */
  readonly seal: NostrEvent;
  readonly ephemeral: Keypair;
  /** NIP-44 encryption of the seal JSON, ephemeral key → recipient. */
  readonly wrapEncryption: Nip44EncryptSteps;
  /** kind 1059, signed by the ephemeral key, `["p", recipient]` tag. */
  readonly wrap: NostrEvent;
}

export type GiftWrapError = CryptoError | KeyError;

export const giftWrap = (input: GiftWrapInput): Result<GiftWrapSteps, GiftWrapError> => {
  const sender = keypairFromSecret(input.senderSecretKey);
  if (!sender.ok) return sender;
  const ephemeral =
    input.ephemeralSecretKey === undefined
      ? ok(generateKeypair())
      : keypairFromSecret(input.ephemeralSecretKey);
  if (!ephemeral.ok) return ephemeral;
  const rumor = createRumor(input.template, sender.value.publicKey);
  const seal = encryptLayer(input, JSON.stringify(rumor), sender.value, {
    kind: SEAL_KIND,
    created_at: input.sealCreatedAt ?? randomizedTimestamp(),
    tags: [],
    nonce: input.sealNonce,
  });
  if (!seal.ok) return seal;
  const wrap = encryptLayer(input, JSON.stringify(seal.value.event), ephemeral.value, {
    kind: GIFT_WRAP_KIND,
    created_at: input.wrapCreatedAt ?? randomizedTimestamp(),
    tags: [["p", input.recipientPubkey]],
    nonce: input.wrapNonce,
  });
  if (!wrap.ok) return wrap;
  return ok({
    rumor,
    sealEncryption: seal.value.encryption,
    seal: seal.value.event,
    ephemeral: ephemeral.value,
    wrapEncryption: wrap.value.encryption,
    wrap: wrap.value.event,
  });
};

/** One onion layer: NIP-44 encrypt `plaintext` to the recipient, then sign as `signer`. */
const encryptLayer = (
  input: GiftWrapInput,
  plaintext: string,
  signer: Keypair,
  layer: { kind: number; created_at: UnixSeconds; tags: Tag[]; nonce: Uint8Array | undefined },
): Result<{ encryption: Nip44EncryptSteps; event: NostrEvent }, GiftWrapError> => {
  const key = nip44ConversationKey(signer.secretKey, input.recipientPubkey);
  if (!key.ok) return key;
  const encryption = nip44Encrypt(
    plaintext,
    key.value,
    layer.nonce === undefined ? {} : { nonce: layer.nonce },
  );
  if (!encryption.ok) return encryption;
  const { kind, created_at, tags } = layer;
  const template = { kind, created_at, tags, content: encryption.value.payload };
  const signed = signEvent(
    template,
    signer.secretKey,
    input.auxRand === undefined ? {} : { auxRand: input.auxRand },
  );
  return signed.ok ? ok({ encryption: encryption.value, event: signed.value.event }) : signed;
};

export type UnwrapErrorCode =
  | "not-a-gift-wrap"
  | "decrypt-failed"
  | "invalid-seal"
  | "invalid-rumor"
  | "author-mismatch";
export type UnwrapError = ProtocolError<UnwrapErrorCode>;

export interface UnwrapSteps {
  readonly wrap: NostrEvent;
  /** Seal recovered by decrypting the wrap with the recipient key. */
  readonly seal: NostrEvent;
  /** Rumor recovered by decrypting the seal. `rumor.pubkey === seal.pubkey` is enforced. */
  readonly rumor: Rumor;
}

/** Peels a gift wrap with the recipient's secret key, verifying each layer. */
export const unwrapGiftWrap = (
  wrap: NostrEvent,
  recipientSecretKey: Uint8Array | Hex,
): Result<UnwrapSteps, UnwrapError> => {
  if (wrap.kind !== GIFT_WRAP_KIND)
    return fail("not-a-gift-wrap", `Expected kind 1059, got ${wrap.kind}`);
  const wrapValid = verifyEvent(wrap);
  if (!wrapValid.ok)
    return fail("not-a-gift-wrap", `Wrap is not a valid event: ${wrapValid.error.message}`);

  const sealJson = decryptFrom(recipientSecretKey, wrap);
  if (!sealJson.ok) return sealJson;
  const sealParsed = parseJson(sealJson.value);
  if (!sealParsed.ok) return fail("invalid-seal", "Seal is not JSON");
  const sealShape = validateEventShape(sealParsed.value);
  if (!sealShape.ok) return fail("invalid-seal", sealShape.error.message);
  const seal = sealShape.value;
  const sealValid = verifyEvent(seal);
  if (!sealValid.ok)
    return fail("invalid-seal", `Seal is not a valid event: ${sealValid.error.message}`);
  if (seal.kind !== SEAL_KIND) return fail("invalid-seal", `Expected kind 13, got ${seal.kind}`);

  const rumorJson = decryptFrom(recipientSecretKey, seal);
  if (!rumorJson.ok) return rumorJson;
  const rumorParsed = parseJson(rumorJson.value);
  if (!rumorParsed.ok) return fail("invalid-rumor", "Rumor is not JSON");
  const rumor = validateRumorShape(rumorParsed.value);
  if (!rumor.ok) return fail("invalid-rumor", rumor.error.message);
  if (computeEventId(rumor.value).id !== rumor.value.id)
    return fail("invalid-rumor", "Rumor id does not match its content");
  // Without this check anyone could seal a rumor that claims to be from someone else.
  if (rumor.value.pubkey !== seal.pubkey)
    return fail("author-mismatch", "Rumor author differs from the seal signer");
  return ok({ wrap, seal, rumor: rumor.value });
};

const decryptFrom = (
  recipientSecretKey: Uint8Array | Hex,
  event: NostrEvent,
): Result<string, UnwrapError> => {
  const key = nip44ConversationKey(recipientSecretKey, event.pubkey);
  if (!key.ok) return fail("decrypt-failed", key.error.message);
  const plain = nip44Decrypt(event.content, key.value);
  return plain.ok ? ok(plain.value.plaintext) : fail("decrypt-failed", plain.error.message);
};
