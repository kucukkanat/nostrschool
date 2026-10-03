/** Input validation for chart data. `Result` is protocol's, re-exported by ui's light entry. */
import { err, ok, type Result } from "@nostrschool/ui/result.ts";
import type { Datum, LineSeries, TreeNode } from "./types.ts";

export { ok, type Result };

export type ChartErrorCode = "empty" | "duplicate-id" | "non-finite" | "negative" | "mixed-x";

export interface ChartError {
  readonly code: ChartErrorCode;
  readonly message: string;
}

export const fail = (code: ChartErrorCode, message: string): Result<never, ChartError> =>
  err({ code, message });

const firstDuplicate = (ids: readonly string[]): string | undefined =>
  ids.find((id, i) => ids.indexOf(id) !== i);

/** Checks ids are unique and values finite (and ≥ 0 when `nonNegative`, e.g. donut shares). */
export const validateData = (
  data: readonly Datum[],
  { nonNegative = false }: { readonly nonNegative?: boolean } = {},
): Result<readonly Datum[], ChartError> => {
  if (data.length === 0) return fail("empty", "no data");
  const dup = firstDuplicate(data.map((d) => d.id));
  if (dup !== undefined) return fail("duplicate-id", `duplicate datum id "${dup}"`);
  const bad = data.find((d) => !Number.isFinite(d.value));
  if (bad !== undefined) return fail("non-finite", `value of "${bad.id}" is not a finite number`);
  const neg = nonNegative ? data.find((d) => d.value < 0) : undefined;
  if (neg !== undefined) return fail("negative", `value of "${neg.id}" is negative`);
  return ok(data);
};

/** Series ids unique, y finite, and x either all Dates or all numbers (one scale per chart). */
export const validateSeries = (
  series: readonly LineSeries[],
): Result<{ readonly series: readonly LineSeries[]; readonly time: boolean }, ChartError> => {
  const points = series.flatMap((s) => s.points);
  if (points.length === 0) return fail("empty", "no points");
  const dup = firstDuplicate(series.map((s) => s.id));
  if (dup !== undefined) return fail("duplicate-id", `duplicate series id "${dup}"`);
  const time = points[0]?.x instanceof Date;
  if (points.some((p) => p.x instanceof Date !== time))
    return fail("mixed-x", "x values mix Dates and numbers");
  if (points.some((p) => !Number.isFinite(p.y) || !Number.isFinite(+p.x)))
    return fail("non-finite", "a point has a non-finite x or y");
  return ok({ series, time });
};

/** Tree ids unique, leaf values finite and ≥ 0, and at least one positive leaf. */
export const validateTree = (root: TreeNode): Result<TreeNode, ChartError> => {
  const walk = (n: TreeNode): readonly TreeNode[] => [n, ...(n.children ?? []).flatMap(walk)];
  const nodes = walk(root);
  const dup = firstDuplicate(nodes.map((n) => n.id));
  if (dup !== undefined) return fail("duplicate-id", `duplicate node id "${dup}"`);
  const leaves = nodes.filter((n) => (n.children ?? []).length === 0);
  const bad = leaves.find((n) => !Number.isFinite(n.value ?? 0));
  if (bad !== undefined) return fail("non-finite", `value of "${bad.id}" is not a finite number`);
  const neg = leaves.find((n) => (n.value ?? 0) < 0);
  if (neg !== undefined) return fail("negative", `value of "${neg.id}" is negative`);
  if (!leaves.some((n) => (n.value ?? 0) > 0)) return fail("empty", "tree has no positive values");
  return ok(root);
};
