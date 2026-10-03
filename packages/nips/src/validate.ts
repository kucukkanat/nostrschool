/**
 * Validates an editor value against a spec part. Owner: validator agent.
 *
 * Never throws on bad input — every problem is an issue with a JSON path, so the editor can map
 * it to a CodeMirror diagnostic range and the form can mark the field. Messages are not produced
 * here: `code` + `params` are rendered with `getDictionary(locale).nips.issues[code]`.
 *
 * Paths may continue INTO a JSON-encoded string: an error in kind 0 metadata is reported at
 * ["content", "name"], one inside a zap receipt's embedded request at ["tags", 4, 1, "kind"].
 * The JSON text has no node there, so the editor should map such a path to its longest prefix
 * that exists (the string) and can still show the inner part ("name") in the message.
 *
 * A malformed spec (an invalid `pattern` regex) is a programming error and does throw.
 */
import {
  computeEventId,
  decodeBase64,
  isValidPublicKey,
  type Nip19Prefix,
  type NostrEvent,
  nip19Decode,
  utf8Decode,
  verifyEvent,
} from "@nostrschool/protocol";
import type {
  ContentSpec,
  DocumentSpec,
  EncodingSpec,
  EventShape,
  FieldType,
  HttpRequestSpec,
  JsonPath,
  JsonSchema,
  KindSelector,
  TagFieldSpec,
  TagSpec,
  TextKey,
  WireMessageSpec,
} from "./spec.ts";
import { kindSelected, tagSpecId } from "./spec.ts";

export type ValidationSeverity = "error" | "warning" | "info";

export const VALIDATION_CODES = [
  // Structure
  "invalid-json", // the JSON text does not parse (editor reports it with the parse offset)
  "wrong-type", // params: { expected, actual }
  "missing-field", // params: { field }
  "unknown-field", // params: { field } (warning)
  "too-few-items", // params: { min }
  "too-many-items", // params: { max }
  // Field types
  "invalid-hex", // params: { bytes }
  "invalid-pubkey",
  "invalid-event-id",
  "invalid-relay-url",
  "invalid-url",
  "invalid-timestamp",
  "invalid-kind",
  "kind-not-allowed", // params: { kind, allowed }
  "invalid-addr",
  "invalid-bech32", // params: { prefixes }
  "invalid-enum", // params: { value, allowed }
  "pattern-mismatch",
  "too-short", // params: { min }
  "too-long", // params: { max }
  "invalid-number",
  "out-of-range", // params: { min, max } ("-∞" / "∞" when one side is open)
  "invalid-json-string", // a `json`/`event-json` field that does not parse
  "invalid-base64",
  // Events
  "wrong-kind", // params: { kind, expected }
  "missing-tag", // params: { tag }
  "missing-one-of", // params: { tags } — none of a `requireOneOf` group is present
  "duplicate-tag", // params: { tag } — a non-repeatable tag appears twice
  "unknown-tag", // params: { tag } (info, or warning when the shape says unknownTags: "warn")
  "tag-too-short", // params: { tag, min }
  "tag-too-long", // params: { tag, max } (warning: clients may append extra values)
  "deprecated", // a deprecated tag/field is used (warning)
  "content-required",
  "content-not-empty", // warning
  "content-not-json",
  "content-not-encrypted", // params: { scheme }
  "id-mismatch", // params: { expected }
  "bad-signature",
  "unsigned", // no id/sig yet (info) — the editor offers "sign with demo key"
  "signature-not-allowed", // a rumor (signature: "none") carries a sig
  // Messages
  "wrong-message-type", // params: { type, expected }
] as const;

export type ValidationCode = (typeof VALIDATION_CODES)[number];

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: ValidationCode;
  /** Where in the value: ["tags", 2, 1]. [] = the whole value. See the file comment for strings. */
  readonly path: JsonPath;
  /** Placeholders for the localized message. */
  readonly params?: { readonly [name: string]: string | number };
  /** The spec explanation of the field at `path`, if any (so the panel can show "why"). */
  readonly explain?: TextKey;
}

export interface ValidationReport {
  /** No issue with severity "error". */
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

/** What to validate against. Mirrors `SpecPart` but carries only what validation needs. */
export type SpecTarget =
  | { readonly kind: "event"; readonly part: EventShape }
  | { readonly kind: "message"; readonly part: WireMessageSpec }
  | { readonly kind: "document"; readonly part: DocumentSpec }
  | { readonly kind: "http"; readonly part: HttpRequestSpec }
  | { readonly kind: "encoding"; readonly part: EncodingSpec };

export interface ValidateOptions {
  /** Recompute the id and verify the Schnorr signature (default true). */
  readonly verifySignature?: boolean;
  /**
   * Event shapes of the same spec, by id: lets `{ type: "event", shape }` schemas, `event-json`
   * fields and an HTTP request's `authEvent` validate nested events (zap receipt → zap request).
   */
  readonly shapes?: { readonly [id: string]: EventShape };
}

type Issues = readonly ValidationIssue[];
type Params = { readonly [name: string]: string | number };

// ── Small builders ─────────────────────────────────────────────────────────────────────────────

const issue = (
  severity: ValidationSeverity,
  code: ValidationCode,
  path: JsonPath,
  params?: Params,
  explain?: TextKey,
): ValidationIssue => ({
  severity,
  code,
  path,
  ...(params === undefined ? {} : { params }),
  ...(explain === undefined ? {} : { explain }),
});

const error = (code: ValidationCode, path: JsonPath, params?: Params, explain?: TextKey) =>
  issue("error", code, path, params, explain);

const samePath = (a: JsonPath, b: JsonPath): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/** Attaches `explain` to the issues reported exactly at `path` that do not carry one yet. */
const explained = (issues: Issues, path: JsonPath, explain: TextKey | undefined): Issues =>
  explain === undefined
    ? issues
    : issues.map((i) =>
        i.explain === undefined && samePath(i.path, path) ? { ...i, explain } : i,
      );

const isRecord = (v: unknown): v is { readonly [key: string]: unknown } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** JSON type name of a value, for `wrong-type` params. */
export const jsonTypeOf = (v: unknown): string =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v;

const wrongType = (expected: string, value: unknown, path: JsonPath): ValidationIssue =>
  error("wrong-type", path, { expected, actual: jsonTypeOf(value) });

const parseJson = (text: string): { readonly ok: true; readonly value: unknown } | undefined => {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    // Not JSON is an expected outcome here, reported by the caller as an issue.
    return undefined;
  }
};

/** "1, 7" or "30000–39999": readable list of kind selectors for `wrong-kind`. */
export const describeKinds = (selectors: readonly KindSelector[]): string =>
  selectors.map((s) => (typeof s === "number" ? String(s) : `${s.from}–${s.to}`)).join(", ");

// ── Field types ────────────────────────────────────────────────────────────────────────────────

const HEX64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const NIP19_PREFIXES: readonly string[] = ["npub", "nsec", "note", "nprofile", "nevent", "naddr"];
const isNip19Prefix = (hrp: string): hrp is Nip19Prefix => NIP19_PREFIXES.includes(hrp);

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

/**
 * Bech32 checksum without the 90-char limit (ncryptsec, nostr+walletconnect-style prefixes
 * are not NIP-19 entities, so protocol's nip19Decode cannot check them).
 */
const bech32ChecksumOk = (lower: string, sep: number): boolean => {
  const hrp = lower.slice(0, sep);
  const data = Array.from(lower.slice(sep + 1), (c) => BECH32_CHARSET.indexOf(c));
  if (data.length < 6 || data.includes(-1)) return false;
  const codes = Array.from(hrp, (c) => c.charCodeAt(0));
  const values = [...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31), ...data];
  const chk = values.reduce((acc, v) => {
    const top = acc >>> 25;
    return BECH32_GEN.reduce(
      (c, g, i) => ((top >> i) & 1 ? c ^ g : c),
      ((acc & 0x1ffffff) << 5) ^ v,
    );
  }, 1);
  return chk === 1;
};

const checkBech32 = (s: string, prefixes: readonly string[], uri: boolean): boolean => {
  if (uri && !/^nostr:/i.test(s)) return false;
  const body = uri ? s.slice("nostr:".length) : s;
  const lower = body.toLowerCase();
  const sep = lower.lastIndexOf("1");
  const hrp = lower.slice(0, sep);
  if ((body !== lower && body !== body.toUpperCase()) || sep < 1 || !prefixes.includes(hrp))
    return false;
  if (!bech32ChecksumOk(lower, sep)) return false;
  // NIP-19 entities also need the right byte length / TLV records.
  return !isNip19Prefix(hrp) || nip19Decode(lower).ok;
};

/** Parses a JSON number or a decimal string (tags carry numbers as strings). */
const numeric = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && DECIMAL.test(v)
      ? Number(v)
      : undefined;

const isKindNumber = (n: number | undefined): n is number =>
  n !== undefined && Number.isInteger(n) && n >= 0 && n <= 65535;

const checkKind = (
  value: unknown,
  kinds: readonly number[] | undefined,
  path: JsonPath,
  bad: ValidationCode,
): Issues => {
  const n = numeric(value);
  if (!isKindNumber(n)) return [error(bad, path)];
  return kinds === undefined || kinds.includes(n)
    ? []
    : [error("kind-not-allowed", path, { kind: n, allowed: kinds.join(", ") })];
};

const urlWithScheme = (s: string, schemes: readonly string[]): boolean => {
  if (!URL.canParse(s)) return false;
  // WHATWG parsing already requires a host for http(s)/ws(s); magnet:/mailto: have none.
  return schemes.includes(new URL(s).protocol.slice(0, -1));
};

const range = (n: number, min: number | undefined, max: number | undefined, path: JsonPath) =>
  (min !== undefined && n < min) || (max !== undefined && n > max)
    ? [error("out-of-range", path, { min: min ?? "-∞", max: max ?? "∞" })]
    : [];

/** Base64 → UTF-8 text, or undefined when it is not base64. */
const base64Text = (s: string): string | undefined => {
  const bytes = BASE64.test(s) ? decodeBase64(s) : undefined;
  return bytes?.ok === true ? utf8Decode(bytes.value) : undefined;
};

/** Checks a string-valued field. Numbers are accepted where the type is numeric (JSON). */
const stringField = (
  s: string,
  field: FieldType,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const fail = (code: ValidationCode, params?: Params): Issues => [error(code, path, params)];
  switch (field.type) {
    case "hex": {
      const bytes = field.bytes ?? 32;
      return new RegExp(`^[0-9a-f]{${bytes * 2}}$`).test(s) ? [] : fail("invalid-hex", { bytes });
    }
    case "hex32":
      return HEX64.test(s) ? [] : fail("invalid-hex", { bytes: 32 });
    case "pubkey":
      return isValidPublicKey(s) ? [] : fail("invalid-pubkey");
    case "event-id":
      return HEX64.test(s) ? [] : fail("invalid-event-id");
    case "relay-url":
      return urlWithScheme(s, ["ws", "wss"]) || (field.literals ?? []).some((l) => l.value === s)
        ? []
        : fail("invalid-relay-url");
    case "url":
      return urlWithScheme(s, field.schemes ?? ["http", "https"]) ? [] : fail("invalid-url");
    case "timestamp":
    case "number":
    case "kind":
      return numberField(s, field, path);
    case "addr": {
      const m = /^(\d+):([0-9a-f]{64}):(.*)$/s.exec(s);
      if (m === null || !isValidPublicKey(m[2] ?? "")) return fail("invalid-addr");
      return checkKind(m[1], field.kinds, path, "invalid-addr");
    }
    case "bech32":
      return checkBech32(s, field.prefixes, field.uri === true)
        ? []
        : fail("invalid-bech32", { prefixes: field.prefixes.join(", ") });
    case "enum": {
      if (field.values.some((v) => v.value === s)) return [];
      const params = { value: s, allowed: field.values.map((v) => v.value).join(", ") };
      return [issue(field.open === true ? "warning" : "error", "invalid-enum", path, params)];
    }
    case "text": {
      const length = [...s].length;
      if (field.pattern !== undefined && !new RegExp(`^(?:${field.pattern})$`, "su").test(s))
        return fail("pattern-mismatch");
      if (field.minLength !== undefined && length < field.minLength)
        return fail("too-short", { min: field.minLength });
      if (field.maxLength !== undefined && length > field.maxLength)
        return fail("too-long", { max: field.maxLength });
      return [];
    }
    case "json": {
      const parsed = parseJson(s);
      return parsed === undefined
        ? fail("invalid-json-string")
        : validateSchema(parsed.value, field.schema, path, options);
    }
    case "event-json": {
      const parsed = parseJson(s);
      if (parsed === undefined) return fail("invalid-json-string");
      return eventWithKinds(parsed.value, field.kinds, path, options);
    }
    case "base64": {
      const text = base64Text(s);
      if (text === undefined) return fail("invalid-base64");
      if (field.of !== "event") return [];
      const parsed = parseJson(text);
      return parsed === undefined
        ? fail("invalid-json-string")
        : validateEvent(parsed.value, path, { signing: "required", options });
    }
  }
};

const numberField = (
  value: unknown,
  field: FieldType & { readonly type: "timestamp" | "number" | "kind" },
  path: JsonPath,
): Issues => {
  if (field.type === "kind") return checkKind(value, field.kinds, path, "invalid-kind");
  const n = numeric(value);
  if (field.type === "timestamp")
    // Above 10^11 is almost certainly milliseconds (year 5138 in seconds).
    return n !== undefined && Number.isInteger(n) && n >= 0 && n < 1e11
      ? []
      : [error("invalid-timestamp", path)];
  if (n === undefined || (field.integer === true && !Number.isInteger(n)))
    return [error("invalid-number", path)];
  return range(n, field.min, field.max, path);
};

/**
 * Validates one value against a field type (form inputs validate per keystroke with this).
 * Values are strings (tags, headers, encoding inputs); `timestamp`, `number` and `kind` also
 * accept JSON numbers.
 */
export const validateField = (
  value: unknown,
  field: FieldType,
  path: JsonPath = [],
  options: ValidateOptions = {},
): Issues => {
  if (
    typeof value === "number" &&
    (field.type === "timestamp" || field.type === "number" || field.type === "kind")
  )
    return numberField(value, field, path);
  return typeof value === "string"
    ? stringField(value, field, path, options)
    : [wrongType("string", value, path)];
};

// ── Schemas ────────────────────────────────────────────────────────────────────────────────────

const objectSchema = (
  o: { readonly [key: string]: unknown },
  schema: JsonSchema & { readonly type: "object" },
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const missing = (schema.required ?? [])
    .filter((key) => o[key] === undefined)
    .map((field) => error("missing-field", path, { field }, schema.properties[field]?.explain));
  const fields = Object.entries(o).flatMap(([key, v]) => {
    const prop = schema.properties[key];
    const at = [...path, key];
    if (prop !== undefined) return validateSchema(v, prop, at, options);
    const extra = schema.additionalProperties;
    if (extra === false) return [issue("warning", "unknown-field", at, { field: key })];
    return typeof extra === "object" ? validateSchema(v, extra, at, options) : [];
  });
  return [...missing, ...fields];
};

const itemCount = (n: number, min: number | undefined, max: number | undefined, path: JsonPath) => [
  ...(min !== undefined && n < min ? [error("too-few-items", path, { min })] : []),
  ...(max !== undefined && n > max ? [error("too-many-items", path, { max })] : []),
];

const tupleSchema = (
  arr: readonly unknown[],
  schema: JsonSchema & { readonly type: "tuple" },
  path: JsonPath,
  options: ValidateOptions,
): Issues => [
  ...itemCount(
    arr.length,
    schema.minItems ?? schema.items.length,
    schema.rest === undefined ? schema.items.length : undefined,
    path,
  ),
  ...arr.flatMap((v, i) => {
    const item = schema.items[i] ?? schema.rest;
    return item === undefined ? [] : validateSchema(v, item, [...path, i], options);
  }),
];

/** Every schema type whose JSON type matches `value` (to pick the closest any-of option). */
const schemaAccepts = (schema: JsonSchema, value: unknown): boolean => {
  const t = jsonTypeOf(value);
  switch (schema.type) {
    case "object":
    case "event":
    case "filter":
      return t === "object";
    case "array":
    case "tuple":
      return t === "array";
    case "any-of":
      return schema.options.some((o) => schemaAccepts(o, value));
    default:
      // "any" never gets here: an any-of with an "any" option always has a clean result.
      return t === schema.type;
  }
};

const anyOfSchema = (
  value: unknown,
  schema: JsonSchema & { readonly type: "any-of" },
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const results = schema.options.map((o) => validateSchema(value, o, path, options));
  const clean = results.find((r) => !r.some((i) => i.severity === "error"));
  if (clean !== undefined) return clean;
  // No option fits: report the closest one (same JSON type) precisely, else a type error.
  const sameType = schema.options.flatMap((o, i) => (schemaAccepts(o, value) ? [i] : []));
  const only = sameType.length === 1 ? results[sameType[0] ?? 0] : undefined;
  return only ?? [wrongType(schema.options.map((o) => o.type).join(" | "), value, path)];
};

const STRING_LIST: JsonSchema = { type: "array", items: { type: "string" } };
const hexList = (field: FieldType): JsonSchema => ({
  type: "array",
  items: { type: "string", field },
});
const UINT: JsonSchema = { type: "number", integer: true, minimum: 0 };

/** NIP-01 REQ filter fields (mirrors protocol's validateFilter, but with typed issues). */
const FILTER_PROPERTIES: { readonly [key: string]: JsonSchema } = {
  ids: hexList({ type: "event-id" }),
  authors: hexList({ type: "hex32" }),
  kinds: { type: "array", items: { type: "number", integer: true, minimum: 0, maximum: 65535 } },
  since: UINT,
  until: UINT,
  limit: UINT,
  search: { type: "string" },
  // NIP-01: #e and #p are the only tag filters whose values must be 64-char hex.
  "#e": hexList({ type: "event-id" }),
  "#p": hexList({ type: "hex32" }),
};

const filterSchema = (value: unknown, path: JsonPath, options: ValidateOptions): Issues => {
  if (!isRecord(value)) return [wrongType("object", value, path)];
  const tagKeys = Object.keys(value).filter((k) => /^#[A-Za-z]$/.test(k));
  const properties = {
    ...Object.fromEntries(tagKeys.map((k) => [k, STRING_LIST])),
    ...FILTER_PROPERTIES,
  };
  return objectSchema(
    value,
    { type: "object", properties, additionalProperties: false },
    path,
    options,
  );
};

const schemaBody = (
  value: unknown,
  schema: JsonSchema,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  switch (schema.type) {
    case "object":
      return isRecord(value)
        ? objectSchema(value, schema, path, options)
        : [wrongType("object", value, path)];
    case "array":
      return Array.isArray(value)
        ? [
            ...itemCount(value.length, schema.minItems, schema.maxItems, path),
            ...value.flatMap((v, i) => validateSchema(v, schema.items, [...path, i], options)),
          ]
        : [wrongType("array", value, path)];
    case "tuple":
      return Array.isArray(value)
        ? tupleSchema(value, schema, path, options)
        : [wrongType("array", value, path)];
    case "string":
      if (typeof value !== "string") return [wrongType("string", value, path)];
      return schema.field === undefined ? [] : validateField(value, schema.field, path, options);
    case "number":
      if (typeof value !== "number") return [wrongType("number", value, path)];
      if (schema.integer === true && !Number.isInteger(value))
        return [error("invalid-number", path)];
      return range(value, schema.minimum, schema.maximum, path);
    case "boolean":
    case "null":
      return jsonTypeOf(value) === schema.type ? [] : [wrongType(schema.type, value, path)];
    case "any-of":
      return anyOfSchema(value, schema, path, options);
    case "event": {
      const shape = schema.shape === undefined ? undefined : options.shapes?.[schema.shape];
      const signing = schema.signed === false ? "optional" : "required";
      return validateEvent(value, path, {
        signing,
        options,
        ...(shape === undefined ? {} : { shape }),
      });
    }
    case "filter":
      return filterSchema(value, path, options);
    case "any":
      return [];
  }
};

/** Validates a JSON value against a schema. */
export const validateSchema = (
  value: unknown,
  schema: JsonSchema,
  path: JsonPath = [],
  options: ValidateOptions = {},
): Issues => {
  const deprecated =
    schema.deprecated === true ? [issue("warning", "deprecated", path, undefined)] : [];
  return explained(
    [...deprecated, ...schemaBody(value, schema, path, options)],
    path,
    schema.explain,
  );
};

// ── Events ─────────────────────────────────────────────────────────────────────────────────────

interface EventContext {
  readonly shape?: EventShape;
  /**
   * editor: the value being edited — missing id/pubkey/sig is one `unsigned` info.
   * required: a nested event that must be complete and signed. optional: a template is fine.
   */
  readonly signing: "editor" | "required" | "optional";
  readonly options: ValidateOptions;
}

const EVENT_KEYS = ["id", "pubkey", "created_at", "kind", "tags", "content", "sig"];

/** NIP-01 field checks. Returns the issues and whether the event is complete enough to hash. */
const eventFields = (
  o: { readonly [key: string]: unknown },
  path: JsonPath,
  ctx: EventContext,
): { readonly issues: Issues; readonly hashable: boolean } => {
  const at = (key: string | number, ...rest: (string | number)[]) => [...path, key, ...rest];
  const rumor = ctx.shape?.signature === "none";
  const signKeys = rumor ? ["pubkey", "id"] : ["pubkey", "id", "sig"];
  const unsignedKeys = signKeys.filter((k) => o[k] === undefined);
  const signing =
    ctx.signing === "editor" && unsignedKeys.length > 0
      ? [issue("info", "unsigned", path)]
      : ctx.signing === "required"
        ? unsignedKeys.map((field) => error("missing-field", path, { field }))
        : [];
  const required = ["created_at", "kind", "tags", "content"]
    .filter((k) => o[k] === undefined)
    .map((field) => error("missing-field", path, { field }));
  const typed = (key: string, expected: string, check: (v: unknown) => Issues): Issues => {
    const v = o[key];
    if (v === undefined) return [];
    return jsonTypeOf(v) === expected ? check(v) : [wrongType(expected, v, at(key))];
  };
  const fields = [
    ...typed("id", "string", (v) => validateField(v, { type: "event-id" }, at("id"))),
    ...typed("pubkey", "string", (v) => validateField(v, { type: "pubkey" }, at("pubkey"))),
    ...typed("created_at", "number", (v) =>
      validateField(v, { type: "timestamp" }, at("created_at")),
    ),
    ...typed("kind", "number", (v) => validateField(v, { type: "kind" }, at("kind"))),
    ...typed("tags", "array", (v) => tagsShape(v as readonly unknown[], at("tags"))),
    ...typed("content", "string", () => []),
    ...(rumor && o["sig"] !== undefined ? [error("signature-not-allowed", at("sig"))] : []),
    ...(rumor
      ? []
      : typed("sig", "string", (v) => validateField(v, { type: "hex", bytes: 64 }, at("sig")))),
  ];
  const unknown = Object.keys(o)
    .filter((k) => !EVENT_KEYS.includes(k))
    .map((field) => issue("warning", "unknown-field", at(field), { field }));
  return {
    issues: [...signing, ...required, ...fields, ...unknown],
    hashable: required.length === 0 && fields.length === 0,
  };
};

const tagsShape = (tags: readonly unknown[], path: JsonPath): Issues =>
  tags.flatMap((tag, i) => {
    if (!Array.isArray(tag)) return [wrongType("array", tag, [...path, i])];
    if (tag.length === 0) return [error("tag-too-short", [...path, i], { tag: "", min: 1 })];
    return tag.flatMap((v, j) =>
      typeof v === "string" ? [] : [wrongType("string", v, [...path, i, j])],
    );
  });

/** Recomputes the id and checks the signature of a well-formed event. */
const eventCrypto = (o: { readonly [key: string]: unknown }, path: JsonPath): Issues => {
  const { id, sig, pubkey } = o;
  if (typeof id !== "string" || typeof pubkey !== "string") return [];
  // eventFields proved every field well-formed before this runs.
  const event = o as unknown as NostrEvent;
  const expected = computeEventId(event).id;
  if (expected !== id) return [error("id-mismatch", [...path, "id"], { expected })];
  if (typeof sig !== "string") return [];
  return verifyEvent(event).ok ? [] : [error("bad-signature", [...path, "sig"])];
};

/** Which TagSpec of a shape describes `tag` (respecting `when` variants), if any. */
export const matchTagSpec = (shape: EventShape, tag: readonly string[]): TagSpec | undefined => {
  const named = shape.tags.filter((t) => t.name === tag[0]);
  return (
    named.find((t) => t.when !== undefined && tag[t.when.index] === t.when.equals) ??
    named.find((t) => t.when === undefined)
  );
};

/** Values before the last non-optional field are required ("" placeholders allowed). */
const minValues = (fields: readonly TagFieldSpec[]): number =>
  fields.reduce((min, f, i) => (f.optional === true ? min : i + 1), 0);

const tagAgainstSpec = (
  tag: readonly string[],
  spec: TagSpec,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const values = tag.slice(1);
  const min = minValues(spec.fields);
  const name = spec.name;
  const arity = [
    ...(values.length < min
      ? [error("tag-too-short", path, { tag: name, min }, spec.explain)]
      : []),
    ...(spec.rest === undefined && values.length > spec.fields.length
      ? [
          issue(
            "warning",
            "tag-too-long",
            path,
            { tag: name, max: spec.fields.length },
            spec.explain,
          ),
        ]
      : []),
  ];
  const fields = values.flatMap((v, j) => {
    const field = spec.fields[j] ?? spec.rest;
    if (field === undefined) return [];
    const at = [...path, j + 1];
    // "" keeps a later value's position; it only counts as a value for free text (["d", ""]).
    if (v === "" && field.type.type !== "text")
      return j < min && field.optional !== true
        ? [error("missing-field", at, { field: field.name }, field.explain)]
        : [];
    return explained(validateField(v, field.type, at, options), at, field.explain);
  });
  const deprecated =
    spec.deprecated === true ? [issue("warning", "deprecated", path, undefined, spec.explain)] : [];
  return [...deprecated, ...arity, ...fields];
};

const shapeTags = (
  tags: readonly (readonly string[])[],
  shape: EventShape,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const counts = new Map<string, number>();
  const perTag = tags.flatMap((tag, i) => {
    const at = [...path, i];
    const name = tag[0] ?? "";
    const spec = matchTagSpec(shape, tag);
    if (spec === undefined) {
      const variants = shape.tags.filter((t) => t.name === name && t.when !== undefined);
      const first = variants[0]?.when;
      if (first !== undefined) {
        const allowed = variants.map((t) => t.when?.equals).join(", ");
        const value = tag[first.index] ?? "";
        return [error("invalid-enum", [...at, first.index], { value, allowed })];
      }
      const severity = shape.unknownTags === "warn" ? "warning" : "info";
      return [issue(severity, "unknown-tag", at, { tag: name })];
    }
    const id = tagSpecId(spec);
    const seen = counts.get(id) ?? 0;
    counts.set(id, seen + 1);
    const duplicate =
      !spec.repeatable && seen > 0 ? [error("duplicate-tag", at, { tag: name }, spec.explain)] : [];
    return [...duplicate, ...tagAgainstSpec(tag, spec, at, options)];
  });
  const missing = shape.tags
    .filter((t) => t.presence !== "optional" && (counts.get(tagSpecId(t)) ?? 0) === 0)
    .map((t) =>
      issue(
        t.presence === "required" ? "error" : "info",
        "missing-tag",
        path,
        { tag: t.name },
        t.explain,
      ),
    );
  const names = new Set(tags.map((t) => t[0]));
  const missingOneOf = (shape.requireOneOf ?? [])
    .filter((r) => !r.tags.some((name) => names.has(name)))
    .map((r) => error("missing-one-of", path, { tags: r.tags.join(", ") }, r.explain));
  return [...missing, ...missingOneOf, ...perTag];
};

const NIP44_MIN_BYTES = 99; // version + 32 nonce + 34 padded ciphertext + 32 mac

const isEncrypted = (s: string, scheme: "nip44" | "nip04"): boolean => {
  if (scheme === "nip04") return /^[A-Za-z0-9+/]+=*\?iv=[A-Za-z0-9+/]{22}==$/.test(s);
  const bytes = BASE64.test(s) ? decodeBase64(s) : undefined;
  return bytes?.ok === true && bytes.value[0] === 2 && bytes.value.length >= NIP44_MIN_BYTES;
};

const shapeContent = (
  content: string,
  spec: ContentSpec,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  switch (spec.format) {
    case "text":
      if (content === "")
        return spec.required === true
          ? [error("content-required", path, undefined, spec.explain)]
          : [];
      return spec.field === undefined
        ? []
        : explained(validateField(content, spec.field, path, options), path, spec.explain);
    case "json": {
      const parsed = parseJson(content);
      return parsed === undefined
        ? [error("content-not-json", path, undefined, spec.explain)]
        : explained(validateSchema(parsed.value, spec.schema, path, options), path, spec.explain);
    }
    case "encrypted":
      return isEncrypted(content, spec.scheme)
        ? []
        : [
            error(
              "content-not-encrypted",
              path,
              { scheme: spec.scheme === "nip44" ? "NIP-44" : "NIP-04" },
              spec.explain,
            ),
          ];
    case "empty":
      return content === ""
        ? []
        : [issue("warning", "content-not-empty", path, undefined, spec.explain)];
  }
};

const eventAgainstShape = (
  o: { readonly [key: string]: unknown },
  shape: EventShape,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const { kind, tags, content } = o;
  const kindIssues =
    typeof kind === "number" && isKindNumber(kind) && !kindSelected(shape.kinds, kind)
      ? [
          error(
            "wrong-kind",
            [...path, "kind"],
            { kind, expected: describeKinds(shape.kinds) },
            shape.explain,
          ),
        ]
      : [];
  const wellFormedTags =
    Array.isArray(tags) && tagsShape(tags, []).length === 0
      ? (tags as readonly (readonly string[])[])
      : undefined;
  return [
    ...kindIssues,
    ...(wellFormedTags === undefined
      ? []
      : shapeTags(wellFormedTags, shape, [...path, "tags"], options)),
    ...(typeof content === "string"
      ? shapeContent(content, shape.content, [...path, "content"], options)
      : []),
  ];
};

const validateEvent = (value: unknown, path: JsonPath, ctx: EventContext): Issues => {
  if (!isRecord(value)) return [wrongType("object", value, path)];
  const { issues, hashable } = eventFields(value, path, ctx);
  const crypto = hashable && ctx.options.verifySignature !== false ? eventCrypto(value, path) : [];
  const shaped =
    ctx.shape === undefined ? [] : eventAgainstShape(value, ctx.shape, path, ctx.options);
  // Info, not a warning: legacy events are still valid to read and approve; new ones should
  // follow `replacedBy`. The editor lists it with the other issues, explained by the spec.
  const legacy = ctx.shape?.deprecated;
  const deprecated =
    legacy === undefined
      ? []
      : [
          issue(
            "info",
            "deprecated",
            path,
            legacy.replacedBy === undefined ? undefined : { replacedBy: legacy.replacedBy },
            legacy.explain,
          ),
        ];
  return [...deprecated, ...issues, ...crypto, ...shaped];
};

/** A nested signed event (event-json) whose kind may be restricted, matched to a shape if known. */
const eventWithKinds = (
  value: unknown,
  kinds: readonly number[] | undefined,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const base = validateEvent(value, path, { signing: "required", options });
  const kind = isRecord(value) ? value["kind"] : undefined;
  const allowed =
    kinds !== undefined && typeof kind === "number" && !kinds.includes(kind)
      ? [error("kind-not-allowed", [...path, "kind"], { kind, allowed: kinds.join(", ") })]
      : [];
  return [...base, ...allowed];
};

// ── Messages, documents, HTTP, encodings ───────────────────────────────────────────────────────

const validateMessage = (value: unknown, spec: WireMessageSpec, options: ValidateOptions) => {
  if (!Array.isArray(value)) return [wrongType("array", value, [])];
  const [type, ...rest] = value;
  const min = 1 + spec.elements.filter((e) => e.optional !== true && e.repeatable !== true).length;
  const typeIssues =
    typeof type !== "string"
      ? [wrongType("string", type, [0])]
      : type !== spec.type
        ? [error("wrong-message-type", [0], { type, expected: spec.type }, spec.explain)]
        : [];
  const last = spec.elements.at(-1);
  const max = last?.repeatable === true ? undefined : 1 + spec.elements.length;
  const elements = rest.flatMap((v, i) => {
    const el = spec.elements[i] ?? (last?.repeatable === true ? last : undefined);
    const at = [i + 1];
    return el === undefined
      ? []
      : explained(validateSchema(v, el.schema, at, options), at, el.explain);
  });
  return [...typeIssues, ...itemCount(value.length, min, max, []), ...elements];
};

/** A NIP-98-style "Nostr <base64>" header: the scheme word is not part of the base64 value. */
const headerValue = (raw: string, type: FieldType): string =>
  type.type === "base64" ? raw.replace(/^[A-Za-z]+ (?=\S)/, "") : raw;

const validateHttp = (value: unknown, spec: HttpRequestSpec, options: ValidateOptions): Issues => {
  if (!isRecord(value)) return [wrongType("object", value, [])];
  const { url, headers, body } = value;
  const urlIssues =
    url === undefined
      ? [error("missing-field", [], { field: "url" })]
      : validateField(url, { type: "url" }, ["url"]);
  const headerRecord = headers ?? {};
  if (!isRecord(headerRecord)) return [...urlIssues, wrongType("object", headers, ["headers"])];
  const authShape = spec.authEvent === undefined ? undefined : options.shapes?.[spec.authEvent];
  const headerIssues = spec.headers.flatMap((h) => {
    const key = Object.keys(headerRecord).find((k) => k.toLowerCase() === h.name.toLowerCase());
    const raw = key === undefined ? undefined : headerRecord[key];
    if (key === undefined || raw === undefined)
      return h.required ? [error("missing-field", ["headers"], { field: h.name }, h.explain)] : [];
    const at = ["headers", key];
    if (typeof raw !== "string") return [wrongType("string", raw, at)];
    const v = headerValue(raw, h.value);
    const checked =
      h.value.type === "base64" && h.value.of === "event" && authShape !== undefined
        ? authorization(v, authShape, at, options)
        : validateField(v, h.value, at, options);
    return explained(checked, at, h.explain);
  });
  const bodyIssues =
    body === undefined
      ? []
      : spec.body === undefined
        ? [issue("warning", "unknown-field", ["body"], { field: "body" })]
        : validateSchema(body, spec.body.schema, ["body"], options);
  return [...urlIssues, ...headerIssues, ...bodyIssues];
};

/** A base64 event validated against the request's auth event shape (NIP-98 kind 27235). */
const authorization = (
  s: string,
  shape: EventShape,
  path: JsonPath,
  options: ValidateOptions,
): Issues => {
  const text = base64Text(s);
  if (text === undefined) return [error("invalid-base64", path)];
  const parsed = parseJson(text);
  return parsed === undefined
    ? [error("invalid-json-string", path)]
    : validateEvent(parsed.value, path, { signing: "required", shape, options });
};

const validateEncoding = (value: unknown, spec: EncodingSpec, options: ValidateOptions): Issues => {
  if (!isRecord(value)) return [wrongType("object", value, [])];
  const known = spec.inputs.map((i) => i.name);
  const inputs = spec.inputs.flatMap((input) => {
    const v = value[input.name];
    const at = [input.name];
    const absent = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    if (absent)
      return input.optional === true
        ? []
        : [error("missing-field", [], { field: input.name }, input.explain)];
    if (input.repeatable !== true)
      return explained(validateField(v, input.type, at, options), at, input.explain);
    if (!Array.isArray(v)) return [wrongType("array", v, at)];
    return v.flatMap((item, k) =>
      explained(validateField(item, input.type, [...at, k], options), [...at, k], input.explain),
    );
  });
  const unknown = Object.keys(value)
    .filter((k) => !known.includes(k))
    .map((field) => issue("warning", "unknown-field", [field], { field }));
  return [...inputs, ...unknown];
};

// ── Entry points ───────────────────────────────────────────────────────────────────────────────

const report = (issues: Issues): ValidationReport => ({
  valid: !issues.some((i) => i.severity === "error"),
  issues,
});

/**
 * Validates `value` (already-parsed JSON: an event object, a message array, a document object,
 * an HTTP request `{ url, headers, body? }`, or an encoding's input record) against `target`.
 */
export const validateAgainstSpec = (
  value: unknown,
  target: SpecTarget,
  options: ValidateOptions = {},
): ValidationReport => {
  switch (target.kind) {
    case "event":
      return report(validateEvent(value, [], { shape: target.part, signing: "editor", options }));
    case "message":
      return report(validateMessage(value, target.part, options));
    case "document":
      return report(validateSchema(value, target.part.schema, [], options));
    case "http":
      return report(validateHttp(value, target.part, options));
    case "encoding":
      return report(validateEncoding(value, target.part, options));
  }
};

/**
 * Parses JSON text and validates it: what the editor runs on every change. A parse failure is
 * a single `invalid-json` issue at [] (the editor knows the parse offset; the engines' messages
 * differ, so none is passed on).
 */
export const validateJsonText = (
  text: string,
  target: SpecTarget,
  options: ValidateOptions = {},
): ValidationReport => {
  const parsed = parseJson(text);
  return parsed === undefined
    ? report([error("invalid-json", [])])
    : validateAgainstSpec(parsed.value, target, options);
};
