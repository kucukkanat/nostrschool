import type { PipelineStatus } from "../types.ts";

export type StageState = "pending" | "active" | "done" | "error";

/**
 * Visual state of stage `index`. "ok" marks everything done; "error" marks stages before
 * `errorAt` (default: `active`) done and that one failed; otherwise stages before `active`
 * are done and `active` is highlighted.
 */
export const stageState = (
  index: number,
  active: number,
  status: PipelineStatus,
  errorAt: number = active,
): StageState => {
  if (status === "ok") return "done";
  const pivot = status === "error" ? errorAt : active;
  if (index < pivot) return "done";
  if (index > pivot) return "pending";
  return status === "error" ? "error" : "active";
};

/** Long values (hashes, serialized JSON) are clipped in the card; the full value is one click away. */
export const truncate = (
  value: string,
  max: number,
): { readonly text: string; readonly clipped: boolean } =>
  value.length <= max
    ? { text: value, clipped: false }
    : { text: `${value.slice(0, Math.max(0, max - 1))}…`, clipped: true };
