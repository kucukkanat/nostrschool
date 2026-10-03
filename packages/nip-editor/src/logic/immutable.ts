/**
 * Immutable updates on plain JSON values. Forms never mutate the value they were given; they
 * hand a new value back, which keeps form → JSON sync a single assignment.
 */
import type { JsonPath, JsonValue } from "@nostrschool/nips";

type JsonObject = { readonly [key: string]: JsonValue };

const isObject = (v: JsonValue | undefined): v is JsonObject =>
  v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);

/** `value` with the node at `path` replaced (missing containers are created). */
export const setIn = (value: JsonValue, path: JsonPath, next: JsonValue): JsonValue => {
  const [seg, ...rest] = path;
  if (seg === undefined) return next;
  if (typeof seg === "number") {
    const arr = Array.isArray(value) ? [...value] : [];
    while (arr.length < seg) arr.push("");
    arr[seg] = setIn(arr[seg] ?? null, rest, next);
    return arr;
  }
  const obj = isObject(value) ? value : {};
  return { ...obj, [seg]: setIn(obj[seg] ?? null, rest, next) };
};

/** `value` without the node at `path` (array items are spliced out, object keys deleted). */
export const removeIn = (value: JsonValue, path: JsonPath): JsonValue => {
  const [seg, ...rest] = path;
  if (seg === undefined) return value;
  if (rest.length > 0) {
    const child = getIn(value, [seg]);
    return child === undefined ? value : setIn(value, [seg], removeIn(child, rest));
  }
  if (Array.isArray(value) && typeof seg === "number") return value.filter((_, i) => i !== seg);
  if (isObject(value) && typeof seg === "string")
    return Object.fromEntries(Object.entries(value).filter(([k]) => k !== seg));
  return value;
};

/** The node at `path`, if present. */
export const getIn = (value: JsonValue | undefined, path: JsonPath): JsonValue | undefined => {
  let v = value;
  for (const seg of path) {
    if (Array.isArray(v) && typeof seg === "number") v = v[seg];
    else if (isObject(v) && typeof seg === "string") v = v[seg];
    else return undefined;
  }
  return v;
};

/** Array with item `from` moved to index `to` (clamped). */
export const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  const out = [...items];
  const [item] = out.splice(from, 1);
  if (item === undefined) return out;
  out.splice(Math.max(0, Math.min(to, out.length)), 0, item);
  return out;
};
