/**
 * Pure editor helpers (no DOM): initial values, the shareable URL hash, JSON path ↔ text range
 * mapping, explanations for a path and lint diagnostics. Owner: editor agent.
 */

import { isPersonaId } from "@nostrschool/fixtures";
import {
  type EventShape,
  findSpecPart,
  type JsonPath,
  type JsonSchema,
  type JsonValue,
  type NipSpec,
  type RequireOneOf,
  SPEC_PART_KINDS,
  type SpecPart,
  type SpecPartKind,
  type ValidationIssue,
} from "@nostrschool/nips";
import { err, ok, type Result } from "@nostrschool/protocol";
import { eventFromTemplate, eventSkeleton, isJsonObject, matchTagSpec } from "./logic/event.ts";
import { DEFAULT_SIGNER, defaultForField, schemaAt, skeleton } from "./logic/fields.ts";
import { locate, parseJsonNodes, pathIn } from "./logic/json-locate.ts";
import type {
  BuiltinField,
  EditorState,
  ExplainTarget,
  HashError,
  JsonDiagnostic,
  RuleExplain,
} from "./types.ts";

/** The value an editor starts with for a part: the example's JSON, or a minimal valid skeleton. */
export const initialValue = (part: SpecPart, exampleId?: string): JsonValue => {
  const pick = <T extends { readonly id: string }>(xs: readonly T[]): T | undefined =>
    xs.find((x) => x.id === exampleId) ?? xs[0];
  switch (part.kind) {
    case "event": {
      const ex = pick(part.part.examples);
      return ex === undefined
        ? eventSkeleton(part.part)
        : eventFromTemplate(ex.template, ex.signer ?? DEFAULT_SIGNER);
    }
    case "message": {
      const ex = pick(part.part.examples);
      return ex === undefined
        ? [
            part.part.type,
            ...part.part.elements.filter((e) => e.optional !== true).map((e) => skeleton(e.schema)),
          ]
        : [...ex.message];
    }
    case "document":
      return pick(part.part.examples)?.value ?? skeleton(part.part.schema);
    case "http": {
      const ex = pick(part.part.examples);
      if (ex !== undefined)
        return ex.body === undefined
          ? { url: ex.url, headers: { ...ex.headers } }
          : { url: ex.url, headers: { ...ex.headers }, body: ex.body };
      const headers = Object.fromEntries(
        part.part.headers.filter((h) => h.required).map((h) => [h.name, ""]),
      );
      return part.part.body === undefined
        ? { url: part.part.urlTemplate, headers }
        : { url: part.part.urlTemplate, headers, body: skeleton(part.part.body.schema) };
    }
    case "encoding": {
      const ex = pick(part.part.examples);
      if (ex !== undefined)
        return Object.fromEntries(
          Object.entries(ex.inputs).map(([k, v]) => [k, typeof v === "string" ? v : [...v]]),
        );
      return Object.fromEntries(
        part.part.inputs
          .filter((i) => i.optional !== true)
          .map((i) => [
            i.name,
            i.repeatable === true ? [defaultForField(i.type)] : defaultForField(i.type),
          ]),
      );
    }
  }
};

// ── URL hash ────────────────────────────────────────────────────────────────────────────────

const HASH_KEY = "edit";

const toBase64Url = (text: string): string => {
  let bin = "";
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string): string | undefined => {
  // Validated up front, so atob cannot throw: only base64url characters, and no length ≡ 1 mod 4.
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return undefined;
  const b64 = text.replaceAll("-", "+").replaceAll("_", "/");
  const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) =>
    c.charCodeAt(0),
  );
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    // The fatal decoder throws TypeError on bytes that are not UTF-8: not our encoding.
    if (e instanceof TypeError) return undefined;
    throw e;
  }
};

/** `#edit=<base64url(JSON)>` (no personal data: values come from public demo fixtures). */
export const encodeEditorHash = (state: EditorState): string => {
  // Key order fixed so the same state always yields the same link.
  const data = {
    part: { kind: state.part.kind, id: state.part.id },
    value: state.value,
    ...(state.example === undefined ? {} : { example: state.example }),
    ...(state.signer === undefined ? {} : { signer: state.signer }),
  };
  return `#${HASH_KEY}=${toBase64Url(JSON.stringify(data))}`;
};

const hashFail = (code: HashError["code"], message: string): Result<never, HashError> =>
  err({ code, message });

/** Reads `#edit=…` back, checking the part exists in `spec`. */
export const decodeEditorHash = (hash: string, spec: NipSpec): Result<EditorState, HashError> => {
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get(HASH_KEY);
  if (raw === null || raw === "") return hashFail("no-state", "The URL hash has no editor state");
  const text = fromBase64Url(raw);
  if (text === undefined) return hashFail("invalid-encoding", "The editor state is not base64url");
  const parsed = parseJsonNodes(text);
  if (!parsed.ok) return hashFail("invalid-json", parsed.error.message);
  const data = JSON.parse(text) as JsonValue;
  const partData = isJsonObject(data) ? data["part"] : undefined;
  if (!isJsonObject(data) || !isJsonObject(partData) || !("value" in data))
    return hashFail("invalid-json", "The editor state needs a part and a value");
  const kind = partData["kind"];
  const id = partData["id"];
  const example = data["example"];
  const signer = data["signer"];
  if (
    typeof kind !== "string" ||
    !(SPEC_PART_KINDS as readonly string[]).includes(kind) ||
    typeof id !== "string" ||
    (example !== undefined && typeof example !== "string") ||
    (signer !== undefined && (typeof signer !== "string" || !isPersonaId(signer)))
  )
    return hashFail("invalid-json", "The editor state has an invalid part, example or signer");
  const part = { kind: kind as SpecPartKind, id };
  if (findSpecPart(spec, part) === undefined)
    return hashFail("unknown-part", `NIP-${spec.nip} has no ${kind} part "${id}"`);
  const value = data["value"] ?? null;
  return ok({
    part,
    value,
    ...(example === undefined ? {} : { example }),
    ...(signer === undefined ? {} : { signer }),
  });
};

// ── Paths and ranges ────────────────────────────────────────────────────────────────────────

/** JSON path of the node at a character offset of `json` (undefined outside any node). */
export const pathAtOffset = (json: string, offset: number): JsonPath | undefined => {
  const root = parseJsonNodes(json);
  return root.ok ? pathIn(root.value, offset) : undefined;
};

/** Character range of the node at `path` in `json` (undefined if absent). */
export const rangeOfPath = (
  json: string,
  path: JsonPath,
): { readonly from: number; readonly to: number } | undefined => {
  const root = parseJsonNodes(json);
  if (!root.ok) return undefined;
  const hit = locate(root.value, path);
  return hit === undefined ? undefined : { from: hit.node.from, to: hit.node.to };
};

// ── Explanations ────────────────────────────────────────────────────────────────────────────

const startsWith = (path: JsonPath, prefix: JsonPath): boolean =>
  prefix.length <= path.length && prefix.every((seg, i) => path[i] === seg);

const BUILTIN: readonly BuiltinField[] = [
  "id",
  "pubkey",
  "created_at",
  "kind",
  "tags",
  "content",
  "sig",
];

/** The shape's `requireOneOf` rules picked by `keep`, with the tags that satisfy each right now. */
const rulesOf = (
  shape: EventShape,
  tags: readonly JsonValue[],
  keep: (rule: RequireOneOf) => boolean,
): { readonly rules?: readonly RuleExplain[] } => {
  const names = new Set(tags.map((t) => (Array.isArray(t) ? t[0] : undefined)));
  const rules = (shape.requireOneOf ?? []).filter(keep).map((r) => ({
    explain: r.explain,
    tags: r.tags,
    present: r.tags.filter((n) => names.has(n)),
  }));
  return rules.length === 0 ? {} : { rules };
};

const fromSchema = (
  schema: JsonSchema | undefined,
): Pick<ExplainTarget, "explain" | "field" | "schemaType"> => {
  if (schema === undefined) return {};
  const field = schema.type === "string" ? schema.field : undefined;
  return {
    ...(schema.explain === undefined ? {} : { explain: schema.explain }),
    ...(field === undefined ? {} : { field }),
    schemaType: schema.type,
  };
};

/**
 * `path` cut at the first array index `value` no longer has, so a selection never outlives the
 * tag row or value it pointed at (removed in the form or the JSON). Paths into JSON-encoded
 * strings are kept as they are: their inner structure is not part of `value`.
 */
export const livePath = (value: JsonValue, path: JsonPath): JsonPath => {
  let node: JsonValue | undefined = value;
  for (const [k, seg] of path.entries()) {
    if (typeof node === "string") return path;
    const next: JsonValue | undefined =
      typeof seg === "number"
        ? Array.isArray(node)
          ? node[seg]
          : undefined
        : isJsonObject(node)
          ? node[seg]
          : undefined;
    if (typeof seg === "number" && next === undefined) return path.slice(0, k);
    node = next;
  }
  return path;
};

/** What the spec says about `path` in `value` (resolves tags by name/`when`, schema nodes, fields). */
export const explainAt = (
  part: SpecPart,
  value: JsonValue,
  path: JsonPath,
  issues: readonly ValidationIssue[],
): ExplainTarget => {
  const base = { path, issues: issues.filter((i) => startsWith(i.path, path)) };
  const crumbs = path.map(String);
  const segs = path.slice(1);
  const head = path[0];
  switch (part.kind) {
    case "event": {
      const shape = part.part;
      if (head === undefined) return { ...base, breadcrumb: [], explain: shape.explain };
      if (head === "tags" && typeof path[1] === "number") {
        const rawTags = isJsonObject(value) ? value["tags"] : undefined;
        const tags = Array.isArray(rawTags) ? rawTags : [];
        const row = tags[path[1]];
        const tag = Array.isArray(row) ? matchTagSpec(shape, row) : undefined;
        const pos = path[2];
        const name = Array.isArray(row) && typeof row[0] === "string" ? row[0] : "?";
        const related = rulesOf(shape, tags, (r) => r.tags.includes(name));
        if (tag === undefined)
          return { ...base, ...related, breadcrumb: ["tags", name], builtin: "tags" };
        if (typeof pos !== "number" || pos === 0)
          return { ...base, ...related, breadcrumb: ["tags", name], explain: tag.explain, tag };
        const f = tag.fields[pos - 1] ?? tag.rest;
        return f === undefined
          ? { ...base, breadcrumb: ["tags", name, String(pos)], tag }
          : { ...base, breadcrumb: ["tags", name, f.name], explain: f.explain, field: f.type, tag };
      }
      if (head === "tags" && path.length === 1) {
        const rawTags = isJsonObject(value) ? value["tags"] : undefined;
        const tags = Array.isArray(rawTags) ? rawTags : [];
        return {
          ...base,
          ...rulesOf(shape, tags, () => true),
          breadcrumb: ["tags"],
          builtin: "tags",
        };
      }
      if (head === "content") {
        const c = shape.content;
        const field = c.format === "text" ? c.field : undefined;
        return {
          ...base,
          breadcrumb: ["content"],
          builtin: "content",
          ...(c.explain === undefined ? {} : { explain: c.explain }),
          ...(field === undefined ? {} : { field }),
        };
      }
      const builtin = BUILTIN.find((b) => b === head);
      return builtin === undefined
        ? { ...base, breadcrumb: crumbs }
        : { ...base, breadcrumb: [builtin], builtin };
    }
    case "message": {
      const m = part.part;
      if (typeof head !== "number") return { ...base, breadcrumb: [m.type], explain: m.explain };
      if (head === 0) return { ...base, breadcrumb: [m.type], explain: m.explain };
      const last = m.elements.at(-1);
      const el = m.elements[head - 1] ?? (last?.repeatable === true ? last : undefined);
      if (el === undefined) return { ...base, breadcrumb: [m.type, String(head)] };
      const v = Array.isArray(value) ? value[head] : undefined;
      const s = schemaAt(el.schema, v, segs);
      const own = fromSchema(s);
      return {
        ...base,
        breadcrumb: [m.type, el.name, ...segs.map(String)],
        ...own,
        ...(own.explain === undefined && segs.length === 0 ? { explain: el.explain } : {}),
      };
    }
    case "document": {
      const s = schemaAt(part.part.schema, value, path);
      const own = fromSchema(s);
      return {
        ...base,
        breadcrumb: crumbs,
        ...own,
        ...(path.length === 0 && own.explain === undefined ? { explain: part.part.explain } : {}),
      };
    }
    case "http": {
      const r = part.part;
      if (head === "headers" && typeof path[1] === "string") {
        const name = path[1].toLowerCase();
        const h = r.headers.find((x) => x.name.toLowerCase() === name);
        return h === undefined
          ? { ...base, breadcrumb: ["headers", path[1]] }
          : { ...base, breadcrumb: ["headers", h.name], explain: h.explain, field: h.value };
      }
      if (head === "body" && r.body !== undefined) {
        const body = isJsonObject(value) ? value["body"] : undefined;
        return { ...base, breadcrumb: crumbs, ...fromSchema(schemaAt(r.body.schema, body, segs)) };
      }
      return { ...base, breadcrumb: crumbs.length === 0 ? [r.method] : crumbs, explain: r.explain };
    }
    case "encoding": {
      const e = part.part;
      const input = e.inputs.find((i) => i.name === head);
      return input === undefined
        ? { ...base, breadcrumb: crumbs, explain: e.explain }
        : { ...base, breadcrumb: [input.name], explain: input.explain, field: input.type };
    }
  }
};

// ── Diagnostics ─────────────────────────────────────────────────────────────────────────────

/** Issues whose natural anchor is the member's key rather than its value. */
const KEY_CODES = new Set<ValidationIssue["code"]>(["unknown-field", "deprecated"]);

/** Maps validation issues to CodeMirror diagnostics with localized messages. */
export const issueDiagnostics = (
  json: string,
  issues: readonly ValidationIssue[],
  message: (issue: ValidationIssue) => string,
): readonly JsonDiagnostic[] => {
  const root = parseJsonNodes(json);
  return issues.map((issue) => {
    const text = message(issue);
    if (!root.ok) {
      // Text that doesn't parse: point at the parse error (one char, at least visible at EOF).
      const at = Math.min(root.error.offset, json.length);
      return {
        from: Math.max(0, at === json.length ? at - 1 : at),
        to: Math.max(at, Math.min(at + 1, json.length)),
        severity: issue.severity,
        message: text,
      };
    }
    // Missing things have no node: walk up to the nearest ancestor that exists.
    for (let n = issue.path.length; n >= 0; n--) {
      const hit = locate(root.value, issue.path.slice(0, n));
      if (hit === undefined) continue;
      const span = KEY_CODES.has(issue.code) && hit.keySpan !== undefined ? hit.keySpan : hit.node;
      // Document-level issues ("unsigned", a missing top-level field) anchor on the opening
      // bracket: underlining the whole document would bury every other diagnostic.
      const to = n === 0 ? Math.min(span.to, span.from + 1) : span.to;
      return { from: span.from, to, severity: issue.severity, message: text };
    }
    return { from: 0, to: json.length, severity: issue.severity, message: text };
  });
};

/** The JSON text the editor shows for a value (2-space indent, like most Nostr docs). */
export const formatJson = (value: JsonValue): string => JSON.stringify(value, null, 2);
