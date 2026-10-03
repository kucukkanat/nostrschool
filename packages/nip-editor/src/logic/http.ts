/**
 * HTTP parts: the editable value is `{ url, headers, body? }` (an HttpRequestExample without its
 * id/label). For NIP-98-style requests the auth event is built from the request itself (URL,
 * method, body hash), signed with a demo key and base64-encoded into the Authorization header.
 */
import type { EventShape, HttpRequestSpec, JsonValue, PersonaRef } from "@nostrschool/nips";
import { err, type Result, sha256Hex } from "@nostrschool/protocol";
import { eventFromTemplate, isJsonObject, type SignError, signDraft } from "./event.ts";

/** The header that carries the auth event: a base64-of-event header, else Authorization. */
export const authHeaderName = (spec: HttpRequestSpec): string =>
  spec.headers.find((h) => h.value.type === "base64" && h.value.of === "event")?.name ??
  "Authorization";

const utf8ToBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

/** Decodes standard base64 to UTF-8 text; undefined when it is not base64 (checked first, so atob never throws). */
export const base64ToUtf8 = (b64: string): string | undefined => {
  if (b64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return undefined;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * Builds and signs the auth event for the current request: the shape's first example with its
 * `u` / `method` / `payload` tags replaced by the request's real values.
 */
export const buildAuthEvent = (
  spec: HttpRequestSpec,
  shape: EventShape,
  value: JsonValue,
  signer: PersonaRef,
): Result<{ readonly event: JsonValue; readonly header: string }, SignError> => {
  const url = isJsonObject(value) ? value["url"] : undefined;
  if (!isJsonObject(value) || typeof url !== "string")
    return err({ code: "not-an-event", message: "The request needs a URL" });
  const base = shape.examples[0]?.template ?? { kind: 27235, tags: [], content: "" };
  const has = (name: string) => shape.tags.some((t) => t.name === name);
  const body = value["body"];
  const payload =
    body === undefined || body === null
      ? undefined
      : sha256Hex(typeof body === "string" ? body : JSON.stringify(body));
  const tags: string[][] = [
    ["u", url],
    ["method", spec.method],
    ...(payload !== undefined && has("payload") ? [["payload", payload]] : []),
    ...base.tags.filter((t) => !["u", "method", "payload"].includes(t[0] ?? "")).map((t) => [...t]),
  ];
  const signed = signDraft(eventFromTemplate({ ...base, tags }, signer), signer);
  if (!signed.ok) return signed;
  return {
    ok: true,
    value: { event: signed.value, header: `Nostr ${utf8ToBase64(JSON.stringify(signed.value))}` },
  };
};
