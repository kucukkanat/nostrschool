/**
 * Lightweight entry (`@nostrschool/ui/result.ts`) re-exporting protocol's `Result` helpers, so
 * packages that may depend on ui but not on protocol (mascot, charts) share one Result type
 * without pulling every Svelte component through the main entry.
 */
export {
  type Err,
  err,
  flatMapResult,
  isErr,
  isOk,
  mapResult,
  type Ok,
  ok,
  type Result,
} from "@nostrschool/protocol";
