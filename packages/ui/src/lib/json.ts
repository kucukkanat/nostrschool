/** Turns any value into a render-ready JSON tree with dot-joined paths ("tags.0.1"). */
export type JsonLeafType = "string" | "number" | "boolean" | "null";

interface NodeBase {
  /** Dot-joined keys/indices from the root; "" for the root itself. */
  readonly path: string;
  /** Property name or array index; undefined for the root. */
  readonly key: string | number | undefined;
  readonly depth: number;
}
export type JsonNode =
  | (NodeBase & { readonly kind: "leaf"; readonly type: JsonLeafType; readonly text: string })
  | (NodeBase & {
      readonly kind: "branch";
      readonly type: "object" | "array";
      readonly children: readonly JsonNode[];
    });

const joinPath = (parent: string, key: string | number): string =>
  parent === "" ? String(key) : `${parent}.${key}`;

const leafType = (v: unknown): JsonLeafType =>
  typeof v === "string"
    ? "string"
    : typeof v === "number"
      ? "number"
      : typeof v === "boolean"
        ? "boolean"
        : "null";

export const toJsonTree = (
  value: unknown,
  path = "",
  key: string | number | undefined = undefined,
  depth = 0,
): JsonNode => {
  // Round-trip through JSON semantics first so what we show is exactly what JSON.stringify emits
  // (Uint8Array → object, undefined/functions → null), never something a relay wouldn't see.
  const v: unknown = value instanceof Date ? value.toISOString() : value;
  if (Array.isArray(v))
    return {
      kind: "branch",
      type: "array",
      path,
      key,
      depth,
      children: v.map((item: unknown, i) => toJsonTree(item, joinPath(path, i), i, depth + 1)),
    };
  if (typeof v === "object" && v !== null)
    return {
      kind: "branch",
      type: "object",
      path,
      key,
      depth,
      children: Object.entries(v)
        .filter(([, child]) => child !== undefined && typeof child !== "function")
        .map(([k, child]) => toJsonTree(child, joinPath(path, k), k, depth + 1)),
    };
  const type = leafType(v);
  const text = type === "null" ? "null" : JSON.stringify(v);
  return { kind: "leaf", type, path, key, depth, text };
};

/** True when `path` is highlighted or contains a highlighted descendant (kept expanded). */
export const containsHighlight = (path: string, highlights: readonly string[]): boolean =>
  highlights.some((h) => h === path || path === "" || h.startsWith(`${path}.`));
