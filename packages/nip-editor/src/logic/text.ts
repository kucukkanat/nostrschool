/** String lookups for the editor: its own chrome strings and a NIP's TextKeys. */
import { getDictionary, getNipStrings, type Locale } from "@nostrschool/i18n";
import type { TextKey, ValidationReport } from "@nostrschool/nips";

export const editorStrings = (locale: Locale) => getDictionary(locale).nips.editor;
export type EditorStrings = ReturnType<typeof editorStrings>;

/**
 * Resolves a NIP's TextKeys: the locale's text, then English (range files are translated after
 * spec authors write them), then the key itself so a missing string is visible, never blank.
 */
export const nipText = (locale: Locale, nip: string): ((key: TextKey) => string) => {
  const own = getNipStrings(locale, nip)?.text ?? {};
  const en = getNipStrings("en", nip)?.text ?? {};
  return (key) => own[key] ?? en[key] ?? key;
};

/** True when the NIP's strings define `key` (used to hide empty explanations). */
export const hasNipText = (nip: string, key: TextKey | undefined): key is TextKey =>
  key !== undefined && getNipStrings("en", nip)?.text[key] !== undefined;

/** Count of issues by severity bucket: errors+warnings are "problems", info are "notes". */
export const issueCounts = (
  report: ValidationReport | undefined,
): { readonly problems: number; readonly notes: number } => {
  const issues = report?.issues ?? [];
  const problems = issues.filter((i) => i.severity !== "info").length;
  return { problems, notes: issues.length - problems };
};
