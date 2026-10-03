/**
 * NipSpec: a machine-readable description of what a NIP lets you build, written by hand per NIP
 * (`src/specs/nip-<id>.ts`). It drives the editor form, the JSON lint, the "explain" panel and
 * the how-it-works walkthrough.
 *
 * Rules for spec data:
 * - Pure JSON-serialisable data (no functions, no class instances, no `undefined` values): the
 *   site passes a spec to a Svelte island as a prop, and editor state goes into the URL hash.
 * - No user-visible prose. Every explanation is a `TextKey` into that NIP's i18n strings
 *   (`getNipStrings(locale, id).text[key]`, files `packages/i18n/src/locales/<loc>/nips/rN.ts`).
 *   `specs.test.ts` fails on a key that has no English text, and on English text no spec uses.
 */
import type { MessageDirection, NipId } from "./types.ts";

/** Key into the NIP's i18n `text` record. Convention: kebab-case, dotted by area ("tag.e.marker"). */
export type TextKey = string;

/** Any JSON value; spec examples and editor values are plain JSON. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** Address of a node inside a JSON value: ["tags", 0, 1] is the first value of the first tag. */
export type JsonPath = readonly (string | number)[];

/** Persona id from @nostrschool/fixtures ("alice" … "grace"); kept as a string so this package does not depend on fixtures. */
export type PersonaRef = string;

// ── Field types ───────────────────────────────────────────────────────────────────────────────

export interface EnumOption {
  readonly value: string;
  readonly explain?: TextKey;
}

/**
 * Semantic type of a string value (a tag position, a JSON string, an HTTP header, an encoding
 * input). The editor picks the input widget from it, the validator the check.
 */
export type FieldType =
  /** Lower-case hex of exactly `bytes` bytes (32 → 64 chars). Use the specific types below when they apply. */
  | { readonly type: "hex"; readonly bytes?: number }
  /** 32-byte lower-case hex that is not a pubkey or event id (hashes, d-tag digests, preimages…). */
  | { readonly type: "hex32" }
  /** 32-byte x-only secp256k1 public key, hex. Persona picker in the editor. */
  | { readonly type: "pubkey" }
  /** 32-byte event id, hex. Picker over fixture events in the editor. */
  | { readonly type: "event-id" }
  /**
   * ws:// or wss:// URL. Picker over fixture relays. `literals`: exact non-URL values the NIP
   * also allows in this position (NIP-62's "ALL_RELAYS"), offered next to the relays.
   */
  | { readonly type: "relay-url"; readonly literals?: readonly EnumOption[] }
  /** Absolute URL; `schemes` restricts it (default http, https). */
  | { readonly type: "url"; readonly schemes?: readonly string[] }
  /** Unix seconds as a decimal string (tags) or number (JSON). */
  | { readonly type: "timestamp" }
  /** Event kind number; `kinds` narrows the picker and the check. */
  | { readonly type: "kind"; readonly kinds?: readonly number[] }
  /** Addressable-event coordinate "kind:pubkey:d-tag"; `kinds` narrows the kind part. */
  | { readonly type: "addr"; readonly kinds?: readonly number[] }
  /** NIP-19 bech32 entity (or "nostr:" URI when `uri`), one of `prefixes` ("npub", "nevent"…). */
  | { readonly type: "bech32"; readonly prefixes: readonly string[]; readonly uri?: boolean }
  /** One of `values`. `open`: other values are allowed (warning, not error). */
  | { readonly type: "enum"; readonly values: readonly EnumOption[]; readonly open?: boolean }
  /** Free text. `pattern` is a JS regex source (anchored by the validator). */
  | {
      readonly type: "text";
      readonly pattern?: string;
      readonly multiline?: boolean;
      readonly minLength?: number;
      readonly maxLength?: number;
    }
  /** Decimal number as a string (tags) or number (JSON). */
  | {
      readonly type: "number";
      readonly integer?: boolean;
      readonly min?: number;
      readonly max?: number;
    }
  /** A JSON-encoded string whose parsed value must match `schema` (e.g. a stringified filter). */
  | { readonly type: "json"; readonly schema: JsonSchema }
  /** A JSON-encoded, signed Nostr event (zap receipt `description`, kind 6 repost content). */
  | { readonly type: "event-json"; readonly kinds?: readonly number[] }
  /** Base64 text; `of: "event"` = a base64 JSON event (NIP-98 `Authorization: Nostr …`). */
  | { readonly type: "base64"; readonly of?: "event" | "bytes" };

export type FieldTypeName = FieldType["type"];

// ── JSON schema (a small, purpose-built subset; discriminated by `type`) ────────────────────

interface SchemaBase {
  readonly explain?: TextKey;
  readonly deprecated?: boolean;
}

export type JsonSchema =
  | (SchemaBase & {
      readonly type: "object";
      readonly properties: { readonly [key: string]: JsonSchema };
      readonly required?: readonly string[];
      /** false = unknown keys are a warning; a schema = every unknown key's value must match it. Default true. */
      readonly additionalProperties?: boolean | JsonSchema;
    })
  | (SchemaBase & {
      readonly type: "array";
      readonly items: JsonSchema;
      readonly minItems?: number;
      readonly maxItems?: number;
    })
  /** Fixed-position array: `items[i]` describes position i; `rest` the tail. */
  | (SchemaBase & {
      readonly type: "tuple";
      readonly items: readonly JsonSchema[];
      readonly minItems?: number;
      readonly rest?: JsonSchema;
    })
  | (SchemaBase & { readonly type: "string"; readonly field?: FieldType })
  | (SchemaBase & {
      readonly type: "number";
      readonly integer?: boolean;
      readonly minimum?: number;
      readonly maximum?: number;
    })
  | (SchemaBase & { readonly type: "boolean" })
  | (SchemaBase & { readonly type: "null" })
  | (SchemaBase & { readonly type: "any-of"; readonly options: readonly JsonSchema[] })
  /** A Nostr event object. `shape` = id of an EventShape in the same spec to validate against. */
  | (SchemaBase & {
      readonly type: "event";
      readonly shape?: string;
      readonly signed?: boolean;
    })
  /** A NIP-01 REQ filter object. */
  | (SchemaBase & { readonly type: "filter" })
  | (SchemaBase & { readonly type: "any" });

export type JsonSchemaType = JsonSchema["type"];

// ── Event specs ────────────────────────────────────────────────────────────────────────────────

/** A kind or an inclusive kind range. */
export type KindSelector = number | { readonly from: number; readonly to: number };

export type ContentSpec =
  | {
      readonly format: "text";
      readonly explain: TextKey;
      readonly required?: boolean;
      readonly multiline?: boolean;
      /** Semantic type of the whole content (a URL, "+"/"-" reaction enum…). */
      readonly field?: FieldType;
    }
  | { readonly format: "json"; readonly explain: TextKey; readonly schema: JsonSchema }
  | {
      readonly format: "encrypted";
      readonly explain: TextKey;
      readonly scheme: "nip44" | "nip04";
      /** What decrypts out of it (shown in the explainer; the editor can encrypt/decrypt with demo keys). */
      readonly plaintext: ContentSpec;
    }
  | { readonly format: "empty"; readonly explain?: TextKey };

export type ContentFormat = ContentSpec["format"];

/** One positional value of a tag, after the tag name. */
export interface TagFieldSpec {
  /** Short machine name shown as the column label ("event-id", "relay", "marker"). */
  readonly name: string;
  readonly type: FieldType;
  readonly explain: TextKey;
  /** Positional-optional: may be omitted (only trailing fields; "" placeholders allowed before a later value). */
  readonly optional?: boolean;
  readonly placeholder?: string;
}

export type TagPresence = "required" | "recommended" | "optional";

export interface TagSpec {
  /** Unique within the event shape. Defaults to `name`; set it when `when` splits one tag name into variants. */
  readonly id?: string;
  /** The tag name (first array element): "e", "p", "imeta", "-". */
  readonly name: string;
  readonly explain: TextKey;
  readonly presence: TagPresence;
  readonly repeatable: boolean;
  readonly fields: readonly TagFieldSpec[];
  /** Variadic tail: every value after `fields` (e.g. imeta's "key value" entries). */
  readonly rest?: TagFieldSpec;
  /** This variant applies only when position `index` (1-based, after the name) equals `equals`. */
  readonly when?: { readonly index: number; readonly equals: string };
  /** Prefill for "add from template"; defaults to [name, ...field placeholders]. */
  readonly template?: readonly string[];
  readonly deprecated?: boolean;
}

export interface EventTemplateJson {
  readonly kind: number;
  /** Omitted = the editor uses FIXTURE_NOW. */
  readonly created_at?: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
}

export interface EventExample {
  readonly id: string;
  readonly label: TextKey;
  readonly explain?: TextKey;
  /** Who signs it in the editor's demo. Default "alice". */
  readonly signer?: PersonaRef;
  readonly template: EventTemplateJson;
}

export interface RequireOneOf {
  /** Tag names (`tag[0]`), any one of which satisfies the rule: ["E", "A", "I"]. */
  readonly tags: readonly string[];
  readonly explain: TextKey;
}

/**
 * Marks a shape the NIP keeps only for backwards compatibility (NIP-72's kind 1 community posts).
 * Such events still validate; the validator adds a `deprecated` info at the event's path,
 * explained by `explain`, so the editor shows it with the other issues.
 */
export interface ShapeDeprecation {
  readonly explain: TextKey;
  /** Id of the EventShape in the same spec that new events should use instead. */
  readonly replacedBy?: string;
}

export interface EventShape {
  /** Unique within the spec ("zap-request"). Used in URLs and `SpecPartKey`s. */
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly kinds: readonly KindSelector[];
  readonly content: ContentSpec;
  readonly tags: readonly TagSpec[];
  /**
   * "At least one of these tag names must appear" rules (NIP-22 root scope E/A/I, NIP-09 e/a).
   * Per-tag `presence` cannot express alternatives, so each group is checked as a whole:
   * none present → a `missing-one-of` error explained by `explain`.
   */
  readonly requireOneOf?: readonly RequireOneOf[];
  /** Tags not in `tags`: "allow" (default; only an `unknown-tag` info) or "warn" (a warning). */
  readonly unknownTags?: "allow" | "warn";
  /** "required" (default): a signed event. "none": a rumor (NIP-59) — id but no sig. */
  readonly signature?: "required" | "none";
  /** Legacy shape: still accepted, but new events should not be built this way. */
  readonly deprecated?: ShapeDeprecation;
  readonly examples: readonly EventExample[];
}

// ── Wire messages (client ⇄ relay) ─────────────────────────────────────────────────────────────

export interface MessageElementSpec {
  readonly name: string;
  readonly explain: TextKey;
  readonly schema: JsonSchema;
  readonly optional?: boolean;
  /** May repeat to the end of the array (REQ's filters). Only the last element. */
  readonly repeatable?: boolean;
}

export interface MessageExample {
  readonly id: string;
  readonly label: TextKey;
  readonly explain?: TextKey;
  readonly message: readonly JsonValue[];
}

export interface WireMessageSpec {
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly direction: MessageDirection;
  /** First array element: "REQ", "EVENT", "NEG-OPEN"… */
  readonly type: string;
  /** Positional elements after the type. */
  readonly elements: readonly MessageElementSpec[];
  /** Ids of messages that answer this one (REQ → EVENT, EOSE, CLOSED). */
  readonly replies?: readonly string[];
  readonly examples: readonly MessageExample[];
}

// ── HTTP (documents, endpoints, headers) ─────────────────────────────────────────────────────

export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpHeaderSpec {
  readonly name: string;
  readonly explain: TextKey;
  readonly value: FieldType;
  readonly required: boolean;
}

export interface JsonExample {
  readonly id: string;
  readonly label: TextKey;
  readonly explain?: TextKey;
  readonly value: JsonValue;
}

/** A JSON document served over HTTP (NIP-11 relay info, NIP-05 nostr.json). */
export interface DocumentSpec {
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly mediaType: string;
  /** Where it lives. Placeholders in angle brackets: "https://<domain>/.well-known/nostr.json?name=<local-part>". */
  readonly urlTemplate: string;
  readonly requestHeaders?: readonly HttpHeaderSpec[];
  readonly schema: JsonSchema;
  readonly examples: readonly JsonExample[];
}

export interface HttpResponseSpec {
  readonly status: number;
  readonly explain: TextKey;
  readonly mediaType?: string;
  readonly schema?: JsonSchema;
}

export interface HttpRequestExample {
  readonly id: string;
  readonly label: TextKey;
  readonly explain?: TextKey;
  readonly url: string;
  readonly headers: { readonly [name: string]: string };
  readonly body?: JsonValue;
}

/** An HTTP endpoint (NIP-96 upload, NIP-86 RPC) or authenticated request (NIP-98). */
export interface HttpRequestSpec {
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly method: HttpMethod;
  /** Path or URL template with <placeholders>. */
  readonly urlTemplate: string;
  readonly headers: readonly HttpHeaderSpec[];
  readonly body?: { readonly mediaType: string; readonly schema: JsonSchema };
  readonly responses: readonly HttpResponseSpec[];
  /** Id of an EventShape in this spec that authorizes the request (NIP-98 kind 27235). */
  readonly authEvent?: string;
  readonly examples: readonly HttpRequestExample[];
}

// ── Encodings (NIP-19, NIP-21, NIP-49, NIP-06, NIP-44 payloads) ────────────────────────────────

/** Codecs the editor implements (with @nostrschool/protocol); a spec picks one per encoding. */
export type EncodingCodec =
  | "npub"
  | "nsec"
  | "note"
  | "nprofile"
  | "nevent"
  | "naddr"
  | "nostr-uri"
  | "ncryptsec"
  | "mnemonic"
  | "nip44-payload"
  | "nip04-payload";

export const ENCODING_CODECS: readonly EncodingCodec[] = [
  "npub",
  "nsec",
  "note",
  "nprofile",
  "nevent",
  "naddr",
  "nostr-uri",
  "ncryptsec",
  "mnemonic",
  "nip44-payload",
  "nip04-payload",
];

export interface EncodingInputSpec {
  readonly name: string;
  readonly type: FieldType;
  readonly explain: TextKey;
  readonly optional?: boolean;
  readonly repeatable?: boolean;
}

export interface EncodingExample {
  readonly id: string;
  readonly label: TextKey;
  readonly explain?: TextKey;
  readonly inputs: { readonly [name: string]: string | readonly string[] };
}

export interface EncodingSpec {
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly codec: EncodingCodec;
  readonly inputs: readonly EncodingInputSpec[];
  /** Explanation of the encoded output (what each part of the string is). */
  readonly output: TextKey;
  readonly examples: readonly EncodingExample[];
}

// ── Process (behaviour-only NIPs: a sequence of steps between actors) ──────────────────────────

/** Same lane kinds as @nostrschool/diagrams SequenceDiagram. */
export type ActorKind = "user" | "client" | "relay" | "signer" | "server" | "wallet" | "extension";

export interface ProcessActor {
  readonly id: string;
  readonly label: TextKey;
  readonly kind: ActorKind;
}

export interface ProcessStep {
  readonly id: string;
  readonly from: string;
  /** Omitted = a local action of `from`. */
  readonly to?: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  /** Packet colour for the diagram: a wire message type ("REQ") or "custom". */
  readonly packet?: string;
  readonly payload?: JsonValue;
  /** A part of this spec this step shows (opens it in the editor). */
  readonly part?: SpecPartKey;
}

export interface ProcessSpec {
  readonly actors: readonly ProcessActor[];
  readonly steps: readonly ProcessStep[];
}

// ── Shared ─────────────────────────────────────────────────────────────────────────────────────

export type SpecPartKind = "event" | "message" | "document" | "http" | "encoding";
export const SPEC_PART_KINDS: readonly SpecPartKind[] = [
  "event",
  "message",
  "document",
  "http",
  "encoding",
];

/** Addresses one editable part of a spec: { kind: "event", id: "zap-request" }. */
export interface SpecPartKey {
  readonly kind: SpecPartKind;
  readonly id: string;
}

/** One step of the "how this NIP works" walkthrough. `focus` highlights a part/path in the editor. */
export interface HowItWorksStep {
  readonly id: string;
  readonly title: TextKey;
  readonly body: TextKey;
  readonly focus?: { readonly part: SpecPartKey; readonly path?: JsonPath };
}

export type NipRelation =
  | "depends-on"
  | "extends"
  | "used-by"
  | "replaces"
  | "replaced-by"
  | "see-also";

export interface RelatedNip {
  readonly nip: NipId;
  readonly relation: NipRelation;
  readonly explain?: TextKey;
}

/** A multi-part flow inside one NIP: zap request → (LNURL) → zap receipt. */
export interface NipFlow {
  readonly id: string;
  readonly label: TextKey;
  readonly explain: TextKey;
  readonly steps: readonly { readonly part: SpecPartKey; readonly explain: TextKey }[];
}

export type NipSpecVariant = "event" | "message" | "document" | "encoding" | "http" | "process";
export const NIP_SPEC_VARIANTS: readonly NipSpecVariant[] = [
  "event",
  "message",
  "document",
  "encoding",
  "http",
  "process",
];

interface NipSpecBase {
  readonly nip: NipId;
  /** Stub awaiting its author: the UI shows the NIP text and a notice instead of an editor. */
  readonly todo?: boolean;
  readonly howItWorks: readonly HowItWorksStep[];
  readonly related: readonly RelatedNip[];
  readonly flows?: readonly NipFlow[];
  readonly events?: readonly EventShape[];
  readonly messages?: readonly WireMessageSpec[];
  readonly documents?: readonly DocumentSpec[];
  readonly http?: readonly HttpRequestSpec[];
  readonly encodings?: readonly EncodingSpec[];
  readonly process?: ProcessSpec;
}

/**
 * `variant` picks the primary renderer; the matching collection is required. Other collections
 * may appear as secondary parts (NIP-42: variant "message" with the AUTH messages, plus the
 * kind 22242 event in `events`; NIP-98: variant "http" whose request points at `events`).
 */
export type NipSpec =
  | (NipSpecBase & { readonly variant: "event"; readonly events: readonly EventShape[] })
  | (NipSpecBase & { readonly variant: "message"; readonly messages: readonly WireMessageSpec[] })
  | (NipSpecBase & { readonly variant: "document"; readonly documents: readonly DocumentSpec[] })
  | (NipSpecBase & { readonly variant: "encoding"; readonly encodings: readonly EncodingSpec[] })
  | (NipSpecBase & { readonly variant: "http"; readonly http: readonly HttpRequestSpec[] })
  | (NipSpecBase & { readonly variant: "process"; readonly process: ProcessSpec });

/** Any editable part, tagged with its kind. */
export type SpecPart =
  | { readonly kind: "event"; readonly part: EventShape }
  | { readonly kind: "message"; readonly part: WireMessageSpec }
  | { readonly kind: "document"; readonly part: DocumentSpec }
  | { readonly kind: "http"; readonly part: HttpRequestSpec }
  | { readonly kind: "encoding"; readonly part: EncodingSpec };

/** Every editable part of a spec, primary variant's parts first. */
export const specParts = (spec: NipSpec): readonly SpecPart[] => {
  const all: SpecPart[] = [
    ...(spec.events ?? []).map((part) => ({ kind: "event", part }) as const),
    ...(spec.messages ?? []).map((part) => ({ kind: "message", part }) as const),
    ...(spec.documents ?? []).map((part) => ({ kind: "document", part }) as const),
    ...(spec.http ?? []).map((part) => ({ kind: "http", part }) as const),
    ...(spec.encodings ?? []).map((part) => ({ kind: "encoding", part }) as const),
  ];
  return [
    ...all.filter((p) => p.kind === spec.variant),
    ...all.filter((p) => p.kind !== spec.variant),
  ];
};

/** Looks up a part by key. */
export const findSpecPart = (spec: NipSpec, key: SpecPartKey): SpecPart | undefined =>
  specParts(spec).find((p) => p.kind === key.kind && p.part.id === key.id);

/** True if `kind` is selected by any of the selectors. */
export const kindSelected = (selectors: readonly KindSelector[], kind: number): boolean =>
  selectors.some((s) => (typeof s === "number" ? s === kind : kind >= s.from && kind <= s.to));

/** The id a TagSpec is addressed by (its `id`, else its name). */
export const tagSpecId = (tag: TagSpec): string => tag.id ?? tag.name;

/**
 * Every TextKey a spec references, in first-use order. Walks the typed structure (not every
 * string), so example payloads that happen to contain "label" or "body" keys are never mistaken
 * for keys. specs.test.ts uses it to require English text for each key and no unused text.
 */
export const specTextKeys = (spec: NipSpec): readonly TextKey[] => {
  const keys: TextKey[] = [];
  const add = (...ks: readonly (TextKey | undefined)[]) => {
    for (const k of ks) if (k !== undefined) keys.push(k);
  };
  const field = (f: FieldType): void => {
    if (f.type === "enum") add(...f.values.map((v) => v.explain));
    if (f.type === "relay-url") add(...(f.literals ?? []).map((v) => v.explain));
    if (f.type === "json") schema(f.schema);
  };
  const schema = (s: JsonSchema): void => {
    add(s.explain);
    if (s.type === "object") {
      Object.values(s.properties).forEach(schema);
      if (typeof s.additionalProperties === "object") schema(s.additionalProperties);
    } else if (s.type === "array") schema(s.items);
    else if (s.type === "tuple") {
      s.items.forEach(schema);
      if (s.rest !== undefined) schema(s.rest);
    } else if (s.type === "string" && s.field !== undefined) field(s.field);
    else if (s.type === "any-of") s.options.forEach(schema);
  };
  const content = (c: ContentSpec): void => {
    add(c.explain);
    if (c.format === "json") schema(c.schema);
    else if (c.format === "encrypted") content(c.plaintext);
    else if (c.format === "text" && c.field !== undefined) field(c.field);
  };
  const typed = (x: { readonly explain: TextKey; readonly type: FieldType }) => {
    add(x.explain);
    field(x.type);
  };
  const header = (h: HttpHeaderSpec) => {
    add(h.explain);
    field(h.value);
  };
  const example = (x: { readonly label: TextKey; readonly explain?: TextKey }) =>
    add(x.label, x.explain);

  for (const s of spec.howItWorks) add(s.title, s.body);
  for (const r of spec.related) add(r.explain);
  for (const f of spec.flows ?? []) add(f.label, f.explain, ...f.steps.map((s) => s.explain));
  for (const e of spec.events ?? []) {
    add(e.label, e.explain, e.deprecated?.explain);
    for (const r of e.requireOneOf ?? []) add(r.explain);
    content(e.content);
    for (const t of e.tags) {
      add(t.explain);
      t.fields.forEach(typed);
      if (t.rest !== undefined) typed(t.rest);
    }
    e.examples.forEach(example);
  }
  for (const m of spec.messages ?? []) {
    add(m.label, m.explain);
    for (const el of m.elements) {
      add(el.explain);
      schema(el.schema);
    }
    m.examples.forEach(example);
  }
  for (const d of spec.documents ?? []) {
    add(d.label, d.explain);
    d.requestHeaders?.forEach(header);
    schema(d.schema);
    d.examples.forEach(example);
  }
  for (const r of spec.http ?? []) {
    add(r.label, r.explain);
    r.headers.forEach(header);
    if (r.body !== undefined) schema(r.body.schema);
    for (const res of r.responses) {
      add(res.explain);
      if (res.schema !== undefined) schema(res.schema);
    }
    r.examples.forEach(example);
  }
  for (const e of spec.encodings ?? []) {
    add(e.label, e.explain, e.output);
    e.inputs.forEach(typed);
    e.examples.forEach(example);
  }
  for (const a of spec.process?.actors ?? []) add(a.label);
  for (const s of spec.process?.steps ?? []) add(s.label, s.explain);
  return [...new Set(keys)];
};
