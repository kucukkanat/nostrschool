/** Input validation shared by every diagram: data errors surface as a visible, typed failure. */
import { fail, ok, type ProtocolError, type Result } from "@nostrschool/protocol";

export type DiagramErrorCode = "duplicate-id" | "unknown-ref" | "invalid-value";
export type DiagramError = ProtocolError<DiagramErrorCode>;

/** All ids are distinct; returns them as a set for later reference checks. */
export const uniqueIds = (
  items: readonly { readonly id: string }[],
  what: string,
): Result<ReadonlySet<string>, DiagramError> => {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) return fail("duplicate-id", `Duplicate ${what} id "${id}"`);
    seen.add(id);
  }
  return ok(seen);
};

/** Every reference points at a known id. */
export const knownRefs = (
  ids: ReadonlySet<string>,
  refs: readonly string[],
  what: string,
): Result<true, DiagramError> => {
  const missing = refs.find((r) => !ids.has(r));
  return missing === undefined ? ok(true) : fail("unknown-ref", `Unknown ${what} "${missing}"`);
};

/** Integer clamp; non-finite input falls back to `min` so a bad binding can't break rendering. */
export const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min;
