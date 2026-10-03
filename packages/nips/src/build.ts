/**
 * Builds starting values from a spec: what the editor shows before the user types anything.
 * Examples win (they are real, hand-written values); without one, a skeleton is built from the
 * schema — required tags from their templates, required fields with neutral defaults.
 */
import type {
  ContentSpec,
  DocumentSpec,
  EncodingExample,
  EncodingSpec,
  EventShape,
  EventTemplateJson,
  HttpRequestExample,
  HttpRequestSpec,
  JsonSchema,
  JsonValue,
  SpecPart,
  TagSpec,
  WireMessageSpec,
} from "./spec.ts";

export interface BuildOptions {
  /** Example to start from (its id); the first example when omitted, a skeleton when none. */
  readonly exampleId?: string;
  /** `created_at` for events whose template has none (the site passes FIXTURE_NOW). */
  readonly createdAt: number;
}

const pick = <T extends { readonly id: string }>(
  examples: readonly T[],
  id: string | undefined,
): T | undefined => (id === undefined ? examples[0] : examples.find((e) => e.id === id));

/** First kind a shape accepts (a range's lower bound). */
export const defaultKind = (shape: EventShape): number => {
  const first = shape.kinds[0];
  return first === undefined ? 1 : typeof first === "number" ? first : first.from;
};

/**
 * "Add from template" value for a tag: its `template`, else the name plus a placeholder for
 * every field up to the last required one (and the `when` position, filled with its value).
 */
export const tagTemplate = (tag: TagSpec): readonly string[] => {
  if (tag.template !== undefined) return tag.template;
  const required = tag.fields.reduce((n, f, i) => (f.optional === true ? n : i + 1), 0);
  const count = Math.max(required, tag.when?.index ?? 0);
  return [
    tag.name,
    ...tag.fields
      .slice(0, count)
      .map((f, i) => (tag.when?.index === i + 1 ? tag.when.equals : (f.placeholder ?? ""))),
  ];
};

/** A neutral value that has the schema's JSON shape (required parts only). */
export const defaultSchemaValue = (schema: JsonSchema): JsonValue => {
  switch (schema.type) {
    case "object":
      return Object.fromEntries(
        (schema.required ?? []).flatMap((k) => {
          const prop = schema.properties[k];
          return prop === undefined ? [] : [[k, defaultSchemaValue(prop)]];
        }),
      );
    case "array":
      return [];
    case "tuple":
      return schema.items.slice(0, schema.minItems ?? schema.items.length).map(defaultSchemaValue);
    case "string":
      return "";
    case "number":
      return schema.minimum ?? 0;
    case "boolean":
      return false;
    case "any-of": {
      const first = schema.options[0];
      return first === undefined ? null : defaultSchemaValue(first);
    }
    case "event":
      return { kind: 1, created_at: 0, tags: [], content: "" };
    case "filter":
      return {};
    case "null":
    case "any":
      return null;
  }
};

export const defaultContent = (content: ContentSpec): string =>
  content.format === "json" ? JSON.stringify(defaultSchemaValue(content.schema)) : "";

/** An unsigned event template for a shape: an example's template, else a skeleton. */
export const defaultEventTemplate = (
  shape: EventShape,
  options: BuildOptions,
): EventTemplateJson => {
  const example = pick(shape.examples, options.exampleId);
  if (example !== undefined) return { created_at: options.createdAt, ...example.template };
  return {
    kind: defaultKind(shape),
    created_at: options.createdAt,
    tags: shape.tags.filter((t) => t.presence === "required").map(tagTemplate),
    content: defaultContent(shape.content),
  };
};

export const defaultMessage = (
  spec: WireMessageSpec,
  options: Pick<BuildOptions, "exampleId"> = {},
): readonly JsonValue[] =>
  pick(spec.examples, options.exampleId)?.message ?? [
    spec.type,
    ...spec.elements.filter((e) => e.optional !== true).map((e) => defaultSchemaValue(e.schema)),
  ];

export const defaultDocument = (
  spec: DocumentSpec,
  options: Pick<BuildOptions, "exampleId"> = {},
): JsonValue => pick(spec.examples, options.exampleId)?.value ?? defaultSchemaValue(spec.schema);

/** The editable request: `{ url, headers, body? }` (what validateAgainstSpec checks). */
export const defaultHttpRequest = (
  spec: HttpRequestSpec,
  options: Pick<BuildOptions, "exampleId"> = {},
): Omit<HttpRequestExample, "id" | "label" | "explain"> => {
  const example = pick(spec.examples, options.exampleId);
  if (example !== undefined) {
    const { url, headers, body } = example;
    return body === undefined ? { url, headers } : { url, headers, body };
  }
  const headers = Object.fromEntries(
    spec.headers.filter((h) => h.required).map((h) => [h.name, ""]),
  );
  return spec.body === undefined
    ? { url: spec.urlTemplate, headers }
    : { url: spec.urlTemplate, headers, body: defaultSchemaValue(spec.body.schema) };
};

export const defaultEncodingInputs = (
  spec: EncodingSpec,
  options: Pick<BuildOptions, "exampleId"> = {},
): EncodingExample["inputs"] =>
  pick(spec.examples, options.exampleId)?.inputs ??
  Object.fromEntries(spec.inputs.map((i) => [i.name, i.repeatable === true ? [] : ""]));

/** Starting value for any spec part (the value validateAgainstSpec expects for its kind). */
export const defaultPartValue = (part: SpecPart, options: BuildOptions): JsonValue => {
  switch (part.kind) {
    case "event":
      return { ...defaultEventTemplate(part.part, options) };
    case "message":
      return defaultMessage(part.part, options);
    case "document":
      return defaultDocument(part.part, options);
    case "http":
      return { ...defaultHttpRequest(part.part, options) };
    case "encoding":
      return defaultEncodingInputs(part.part, options);
  }
};
