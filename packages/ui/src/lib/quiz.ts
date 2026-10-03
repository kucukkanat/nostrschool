import type { QuizOption } from "../types.ts";

/** Correct iff the selection equals the set of correct options (order-insensitive). */
export const gradeQuiz = (options: readonly QuizOption[], selected: readonly string[]): boolean => {
  const correct = new Set(options.filter((o) => o.correct).map((o) => o.id));
  const chosen = new Set(selected);
  return correct.size === chosen.size && [...chosen].every((id) => correct.has(id));
};

/** Next selection after (un)checking `id`: radios replace, checkboxes add/remove. */
export const toggleSelection = (
  selected: readonly string[],
  id: string,
  checked: boolean,
  multiple: boolean,
): readonly string[] => {
  if (!multiple) return checked ? [id] : selected.filter((s) => s !== id);
  const rest = selected.filter((s) => s !== id);
  return checked ? [...rest, id] : rest;
};
