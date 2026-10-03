/**
 * A small JSON parser that remembers where every node sits in the text. JSON.parse can't tell
 * us offsets (and its error positions differ between engines), but the editor needs both: the
 * caret → path for the explain panel, path → range for lint and highlights, and a stable parse
 * error offset for the "invalid-json" diagnostic.
 */
import type { JsonPath, JsonValue } from "@nostrschool/nips";
import { err, ok, type ProtocolError, type Result } from "@nostrschool/protocol";

export interface Span {
  readonly from: number;
  readonly to: number;
}

export type JsonNode =
  | (Span & { readonly type: "object"; readonly entries: readonly JsonEntry[] })
  | (Span & { readonly type: "array"; readonly items: readonly JsonNode[] })
  | (Span & { readonly type: "string"; readonly value: string })
  | (Span & { readonly type: "number"; readonly value: number })
  | (Span & { readonly type: "boolean"; readonly value: boolean })
  | (Span & { readonly type: "null" });

export interface JsonEntry {
  readonly key: string;
  readonly keySpan: Span;
  readonly value: JsonNode;
}

export interface JsonParseError extends ProtocolError<"invalid-json"> {
  /** Character offset of the first unexpected character. */
  readonly offset: number;
}

class ParseFailure extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(message);
  }
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
// biome-ignore lint/suspicious/noControlCharactersInRegex: JSON forbids raw control characters in strings, so the class must name them.
const STRING = /"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/y;

/** Parses `text`, returning the node tree with offsets or the offset of the first error. */
export const parseJsonNodes = (text: string): Result<JsonNode, JsonParseError> => {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text.charAt(i))) i++;
  };
  const fail = (what: string): never => {
    throw new ParseFailure(`${what} at offset ${i}`, i);
  };
  const match = (re: RegExp): string | undefined => {
    re.lastIndex = i;
    const m = re.exec(text);
    if (m === null) return undefined;
    i += m[0].length;
    return m[0];
  };
  const str = (): Span & { value: string } => {
    const from = i;
    const raw = match(STRING) ?? fail("Invalid string");
    return { from, to: i, value: JSON.parse(raw) as string };
  };
  const value = (): JsonNode => {
    ws();
    const from = i;
    const c = text.charAt(i);
    if (c === "{") {
      i++;
      const entries: JsonEntry[] = [];
      ws();
      if (text.charAt(i) === "}") return { type: "object", from, to: ++i, entries };
      for (;;) {
        ws();
        if (text.charAt(i) !== '"') fail("Expected a property name");
        const k = str();
        ws();
        if (text.charAt(i) !== ":") fail("Expected ':'");
        i++;
        entries.push({ key: k.value, keySpan: { from: k.from, to: k.to }, value: value() });
        ws();
        if (text.charAt(i) === ",") i++;
        else if (text.charAt(i) === "}") return { type: "object", from, to: ++i, entries };
        else fail("Expected ',' or '}'");
      }
    }
    if (c === "[") {
      i++;
      const items: JsonNode[] = [];
      ws();
      if (text.charAt(i) === "]") return { type: "array", from, to: ++i, items };
      for (;;) {
        items.push(value());
        ws();
        if (text.charAt(i) === ",") i++;
        else if (text.charAt(i) === "]") return { type: "array", from, to: ++i, items };
        else fail("Expected ',' or ']'");
      }
    }
    if (c === '"') return { type: "string", ...str() };
    for (const [word, v] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return v === null
          ? { type: "null", from, to: i }
          : { type: "boolean", from, to: i, value: v };
      }
    }
    const num = match(NUMBER);
    if (num !== undefined) return { type: "number", from, to: i, value: Number(num) };
    return fail(i >= text.length ? "Unexpected end of input" : "Unexpected character");
  };
  try {
    const root = value();
    ws();
    if (i < text.length) fail("Unexpected text after the JSON value");
    return ok(root);
  } catch (e) {
    // Only our own ParseFailure is expected here; anything else is a bug and must surface.
    if (!(e instanceof ParseFailure)) throw e;
    return err({ code: "invalid-json", message: e.message, offset: e.offset });
  }
};

/** The plain value of a node tree (equal to JSON.parse of the same text). */
export const nodeValue = (node: JsonNode): JsonValue => {
  switch (node.type) {
    case "object":
      return Object.fromEntries(node.entries.map((e) => [e.key, nodeValue(e.value)]));
    case "array":
      return node.items.map(nodeValue);
    case "null":
      return null;
    default:
      return node.value;
  }
};

/** The child node at one path segment. */
const child = (node: JsonNode, seg: string | number): JsonEntry | JsonNode | undefined => {
  if (node.type === "object" && typeof seg === "string")
    return node.entries.findLast((e) => e.key === seg);
  if (node.type === "array" && typeof seg === "number") return node.items[seg];
  return undefined;
};

const asNode = (x: JsonEntry | JsonNode): JsonNode => ("key" in x ? x.value : x);

/** Node (and, for an object member, its key span) at `path`. */
export const locate = (
  root: JsonNode,
  path: JsonPath,
): { readonly node: JsonNode; readonly keySpan?: Span } | undefined => {
  let node = root;
  let keySpan: Span | undefined;
  for (const seg of path) {
    const next = child(node, seg);
    if (next === undefined) return undefined;
    keySpan = "key" in next ? next.keySpan : undefined;
    node = asNode(next);
  }
  return keySpan === undefined ? { node } : { node, keySpan };
};

/** Deepest path whose node (or member key) contains `offset`; [] for the root itself. */
export const pathIn = (root: JsonNode, offset: number): JsonPath | undefined => {
  const inside = (s: Span) => offset >= s.from && offset <= s.to;
  if (!inside(root)) return undefined;
  const path: (string | number)[] = [];
  let node: JsonNode = root;
  for (;;) {
    let next: JsonNode | undefined;
    if (node.type === "object") {
      const e = node.entries.find((x) => inside(x.keySpan) || inside(x.value));
      if (e !== undefined) {
        path.push(e.key);
        next = e.value;
      }
    } else if (node.type === "array") {
      const idx = node.items.findIndex(inside);
      const item = node.items[idx];
      if (item !== undefined) {
        path.push(idx);
        next = item;
      }
    }
    if (next === undefined) return path;
    node = next;
  }
};
