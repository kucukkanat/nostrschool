/**
 * Event-part helpers: build the editable event from a spec example, match tags to their spec,
 * add tags from templates and sign with a persona's demo key.
 */
import { FIXTURE_NOW } from "@nostrschool/fixtures";
import {
  type EventShape,
  type EventTemplateJson,
  type JsonValue,
  type PersonaRef,
  type TagSpec,
  tagSpecId,
} from "@nostrschool/nips";
import {
  err,
  nip04Decrypt,
  nip04Encrypt,
  nip44ConversationKey,
  nip44Decrypt,
  nip44Encrypt,
  type ProtocolError,
  type Result,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";
import { DEFAULT_SIGNER, defaultForField, personaOf } from "./fields.ts";

type JsonObject = { readonly [key: string]: JsonValue };

export const isJsonObject = (v: JsonValue | undefined): v is JsonObject =>
  v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);

/** Canonical NIP-01 key order, so the JSON reads like events in the wild. */
const EVENT_KEYS = ["id", "pubkey", "created_at", "kind", "tags", "content", "sig"] as const;

export const orderEvent = (event: JsonObject): JsonObject => {
  const known = EVENT_KEYS.flatMap((k) => (k in event ? [[k, event[k]] as const] : []));
  const rest = Object.entries(event).filter(
    ([k]) => !(EVENT_KEYS as readonly string[]).includes(k),
  );
  return Object.fromEntries([...known, ...rest]) as JsonObject;
};

/** An unsigned event (with the signer's pubkey) from a template. */
export const eventFromTemplate = (template: EventTemplateJson, signer: PersonaRef): JsonObject =>
  orderEvent({
    pubkey: personaOf(signer).pubkey,
    created_at: template.created_at ?? FIXTURE_NOW,
    kind: template.kind,
    tags: template.tags.map((t) => [...t]),
    content: template.content,
  });

const firstKind = (shape: EventShape): number => {
  const s = shape.kinds[0];
  return s === undefined ? 1 : typeof s === "number" ? s : s.from;
};

/** A new tag row for a tag spec: its template, else valid defaults for the required fields. */
export const tagTemplate = (tag: TagSpec): string[] => {
  if (tag.template !== undefined) return [...tag.template];
  // Keep fields up to the last required one (positional-optional fields may only trail).
  const lastRequired = tag.fields.findLastIndex((f) => f.optional !== true);
  const values = tag.fields
    .slice(0, lastRequired + 1)
    .map((f) => defaultForField(f.type, f.placeholder));
  if (tag.when !== undefined) {
    while (values.length < tag.when.index) values.push("");
    values[tag.when.index - 1] = tag.when.equals;
  }
  return [tag.name, ...values];
};

/** Minimal event for a shape without examples: first kind, required tags, empty content. */
export const eventSkeleton = (shape: EventShape, signer: PersonaRef = DEFAULT_SIGNER): JsonObject =>
  eventFromTemplate(
    {
      kind: firstKind(shape),
      tags: shape.tags.filter((t) => t.presence === "required").map(tagTemplate),
      content: "",
    },
    signer,
  );

/** The tag spec a concrete tag row follows: same name, and a `when` that matches if any. */
export const matchTagSpec = (shape: EventShape, tag: readonly JsonValue[]): TagSpec | undefined => {
  const named = shape.tags.filter((t) => t.name === tag[0]);
  return (
    named.find((t) => t.when !== undefined && tag[t.when.index] === t.when.equals) ??
    named.find((t) => t.when === undefined) ??
    named[0]
  );
};

export { tagSpecId };

export type SignError = ProtocolError<"not-an-event" | "invalid-key">;

/** Signs the editable event with a persona's demo key: real id, pubkey and Schnorr sig. */
export const signDraft = (value: JsonValue, signer: PersonaRef): Result<JsonObject, SignError> => {
  if (!isJsonObject(value)) return err({ code: "not-an-event", message: "Not an event object" });
  const { kind, created_at, tags, content } = {
    kind: value["kind"],
    created_at: value["created_at"],
    tags: value["tags"],
    content: value["content"],
  };
  const typedTags: Tag[] = [];
  for (const t of Array.isArray(tags) ? tags : []) {
    const [name, ...rest] = Array.isArray(t) ? t : [];
    if (typeof name !== "string" || !rest.every((x) => typeof x === "string")) break;
    typedTags.push([name, ...(rest as string[])]);
  }
  if (
    typeof kind !== "number" ||
    typeof created_at !== "number" ||
    typeof content !== "string" ||
    !Array.isArray(tags) ||
    typedTags.length !== tags.length
  )
    return err({
      code: "not-an-event",
      message: "An event needs a numeric kind and created_at, string tags and string content",
    });
  const persona = personaOf(signer);
  // Zero aux randomness: the same draft always gets the same signature, so shared links and
  // tests are reproducible. Fine for public demo keys; real signers should use fresh randomness.
  const signed = signEvent({ kind, created_at, tags: typedTags, content }, persona.secretKey, {
    auxRand: new Uint8Array(32),
  });
  if (!signed.ok) return err({ code: "invalid-key", message: signed.error.message });
  return { ok: true, value: orderEvent({ ...value, ...signed.value.event }) };
};

/** Drops id and sig (the event changed, so they would no longer match). */
export const unsign = (event: JsonObject): JsonObject =>
  Object.fromEntries(Object.entries(event).filter(([k]) => k !== "id" && k !== "sig"));

export type CryptoFailure = ProtocolError<"crypto">;

/** Encrypts `plaintext` from the signer to `recipient` (hex pubkey) with demo keys. */
export const encryptFor = (
  scheme: "nip44" | "nip04",
  plaintext: string,
  signer: PersonaRef,
  recipient: string,
  /** Fixed nonce (NIP-44, 32 bytes) or IV (NIP-04, 16 bytes) for reproducible demos; random when absent. */
  nonce?: Uint8Array,
): Result<string, CryptoFailure> => {
  const sk = personaOf(signer).secretKey;
  const fromErr = (e: { readonly message: string }) =>
    err({ code: "crypto" as const, message: e.message });
  if (scheme === "nip04") {
    const r = nip04Encrypt(plaintext, sk, recipient, nonce === undefined ? {} : { iv: nonce });
    return r.ok ? { ok: true, value: r.value.payload } : fromErr(r.error);
  }
  const key = nip44ConversationKey(sk, recipient);
  if (!key.ok) return fromErr(key.error);
  const r = nip44Encrypt(plaintext, key.value, nonce === undefined ? {} : { nonce });
  return r.ok ? { ok: true, value: r.value.payload } : fromErr(r.error);
};

/** Decrypts a payload addressed between the signer and `peer` (symmetric for both schemes). */
export const decryptFrom = (
  scheme: "nip44" | "nip04",
  payload: string,
  signer: PersonaRef,
  peer: string,
): Result<string, CryptoFailure> => {
  const sk = personaOf(signer).secretKey;
  const fromErr = (e: { readonly message: string }) =>
    err({ code: "crypto" as const, message: e.message });
  if (scheme === "nip04") {
    const r = nip04Decrypt(payload, sk, peer);
    return r.ok ? r : fromErr(r.error);
  }
  const key = nip44ConversationKey(sk, peer);
  if (!key.ok) return fromErr(key.error);
  const r = nip44Decrypt(payload, key.value);
  return r.ok ? { ok: true, value: r.value.plaintext } : fromErr(r.error);
};

/** First `p` tag's pubkey (the usual recipient of encrypted content), if any. */
export const firstRecipient = (event: JsonValue): string | undefined => {
  const tags = isJsonObject(event) ? event["tags"] : undefined;
  if (!Array.isArray(tags)) return undefined;
  for (const t of tags)
    if (Array.isArray(t) && t[0] === "p" && typeof t[1] === "string") return t[1];
  return undefined;
};
