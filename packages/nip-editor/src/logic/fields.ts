/**
 * Field-type helpers shared by the forms and the pure state helpers: sensible default values
 * (so a freshly added tag or field is already valid and teaches by example) and schema walks.
 */
import {
  eventsByKind,
  FIXTURE_EVENTS,
  FIXTURE_NOW,
  getPersona,
  isPersonaId,
  type Persona,
  type PersonaId,
  RELAYS,
} from "@nostrschool/fixtures";
import type { FieldType, JsonSchema, JsonValue, PersonaRef } from "@nostrschool/nips";

export const DEFAULT_SIGNER: PersonaId = "alice";

/** The persona behind a ref, falling back to the default signer for unknown refs. */
export const personaOf = (ref: PersonaRef | undefined): Persona =>
  getPersona(ref !== undefined && isPersonaId(ref) ? ref : DEFAULT_SIGNER);

/** Someone other than the signer, for "to whom" defaults (p tags, recipients). */
const counterpart = (): Persona => getPersona("bob");

const firstEventId = (): string => {
  const note = eventsByKind(1)[0] ?? FIXTURE_EVENTS[0];
  return note?.id ?? "0".repeat(64);
};

/** A valid example value for a field type (strings: tags and inputs are strings). */
export const defaultForField = (field: FieldType, placeholder?: string): string => {
  if (placeholder !== undefined && placeholder !== "") return placeholder;
  switch (field.type) {
    case "pubkey":
      return counterpart().pubkey;
    case "event-id":
      return firstEventId();
    case "hex32":
      return "0".repeat(64);
    case "hex":
      return "00".repeat(field.bytes ?? 32);
    case "relay-url":
      return RELAYS[0]?.url ?? "wss://relay.alpha.example";
    case "url":
      return field.schemes?.[0] === undefined || field.schemes[0].startsWith("http")
        ? "https://example.com"
        : `${field.schemes[0]}:example`;
    case "timestamp":
      return String(FIXTURE_NOW);
    case "kind":
      return String(field.kinds?.[0] ?? 1);
    case "addr":
      return `${field.kinds?.[0] ?? 30023}:${counterpart().pubkey}:example`;
    case "bech32":
      return field.prefixes.includes("npub")
        ? `${field.uri === true ? "nostr:" : ""}${counterpart().npub}`
        : "";
    case "enum":
      return field.values[0]?.value ?? "";
    case "number":
      return String(field.min ?? 0);
    case "json":
      return JSON.stringify(skeleton(field.schema));
    case "text":
    case "event-json":
    case "base64":
      return "";
  }
};

/** A minimal value that satisfies a schema's structure (required members, minimum lengths). */
export const skeleton = (schema: JsonSchema): JsonValue => {
  switch (schema.type) {
    case "object":
      return Object.fromEntries(
        (schema.required ?? []).flatMap((k) => {
          const s = schema.properties[k];
          return s === undefined ? [] : [[k, skeleton(s)]];
        }),
      );
    case "array":
      return Array.from({ length: schema.minItems ?? 0 }, () => skeleton(schema.items));
    case "tuple":
      return schema.items.slice(0, schema.minItems ?? schema.items.length).map(skeleton);
    case "string":
      return schema.field === undefined ? "" : defaultForField(schema.field);
    case "number":
      return schema.minimum ?? 0;
    case "boolean":
      return false;
    case "null":
    case "any":
      return null;
    case "any-of":
      return schema.options[0] === undefined ? null : skeleton(schema.options[0]);
    case "event":
      return { kind: 1, created_at: FIXTURE_NOW, tags: [], content: "" };
    case "filter":
      return { kinds: [1], limit: 10 };
  }
};

const typeOfValue = (v: JsonValue | undefined): JsonSchema["type"] | "undefined" =>
  v === undefined
    ? "undefined"
    : v === null
      ? "null"
      : Array.isArray(v)
        ? "array"
        : typeof v === "object"
          ? "object"
          : typeof v === "string"
            ? "string"
            : typeof v === "number"
              ? "number"
              : "boolean";

/** The any-of option that fits a value best (same JSON type), else the first. */
export const pickOption = (
  options: readonly JsonSchema[],
  value: JsonValue | undefined,
): JsonSchema | undefined => {
  const t = typeOfValue(value);
  return (
    options.find(
      (o) =>
        o.type === t ||
        (t === "array" && o.type === "tuple") ||
        (t === "object" && (o.type === "event" || o.type === "filter")),
    ) ?? options[0]
  );
};

/** The schema describing one child of `schema` (property name or array index). */
export const childSchema = (
  schema: JsonSchema,
  seg: string | number,
  value: JsonValue | undefined,
): JsonSchema | undefined => {
  const s = schema.type === "any-of" ? pickOption(schema.options, value) : schema;
  if (s === undefined) return undefined;
  if (s.type === "object" && typeof seg === "string")
    return (
      s.properties[seg] ??
      (typeof s.additionalProperties === "object" ? s.additionalProperties : undefined)
    );
  if (s.type === "array" && typeof seg === "number") return s.items;
  if (s.type === "tuple" && typeof seg === "number") return s.items[seg] ?? s.rest;
  return undefined;
};

/** Child value of a JSON value at one path segment. */
export const childValue = (
  value: JsonValue | undefined,
  seg: string | number,
): JsonValue | undefined => {
  if (Array.isArray(value)) return typeof seg === "number" ? value[seg] : undefined;
  if (value !== null && typeof value === "object" && typeof seg === "string")
    return (value as { readonly [k: string]: JsonValue })[seg];
  return undefined;
};

/** Walks a schema along a path; the any-of option is chosen by the value found there. */
export const schemaAt = (
  schema: JsonSchema,
  value: JsonValue | undefined,
  path: readonly (string | number)[],
): JsonSchema | undefined => {
  let s: JsonSchema | undefined = schema;
  let v = value;
  for (const seg of path) {
    if (s === undefined) return undefined;
    s = childSchema(s, seg, v);
    v = childValue(v, seg);
  }
  return s?.type === "any-of" ? (pickOption(s.options, v) ?? s) : s;
};
