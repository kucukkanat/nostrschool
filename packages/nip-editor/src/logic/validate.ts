/**
 * Glue between the JSON text in the editor and the spec validator: parse (with a stable error
 * offset), then validate the parsed value against the selected part.
 */
import type { Locale } from "@nostrschool/i18n";
import { format, getDictionary, plural } from "@nostrschool/i18n";
import {
  type EventShape,
  type JsonValue,
  type NipSpec,
  type SpecPart,
  type ValidationIssue,
  type ValidationReport,
  validateAgainstSpec,
} from "@nostrschool/nips";
import { nodeValue, parseJsonNodes } from "./json-locate.ts";

export interface Checked {
  /** The parsed value, absent when the text does not parse. */
  readonly value?: JsonValue;
  readonly report: ValidationReport;
}

const shapesOf = (spec: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((spec.events ?? []).map((e) => [e.id, e]));

/** Validates an already-parsed value against a part (nested events resolve within the spec). */
export const checkValue = (spec: NipSpec, part: SpecPart, value: JsonValue): ValidationReport =>
  validateAgainstSpec(value, part, { shapes: shapesOf(spec) });

/** Parses `text` and validates it; a parse failure is one "invalid-json" error. */
export const checkText = (spec: NipSpec, part: SpecPart, text: string): Checked => {
  const parsed = parseJsonNodes(text);
  if (!parsed.ok)
    return {
      report: {
        valid: false,
        issues: [
          {
            severity: "error",
            code: "invalid-json",
            path: [],
            params: { offset: parsed.error.offset },
          },
        ],
      },
    };
  const value = nodeValue(parsed.value);
  return { value, report: checkValue(spec, part, value) };
};

/**
 * Localized message for an issue (params are formatted into `nips.issues[code]`). Count messages
 * are plural objects chosen by the `min` param, so "at least 1 value" reads correctly.
 */
export const issueMessage =
  (locale: Locale) =>
  (issue: ValidationIssue): string => {
    const template = getDictionary(locale).nips.issues[issue.code];
    const params = Object.fromEntries(
      Object.entries(issue.params ?? {}).map(([k, v]) => [k, String(v)]),
    );
    return typeof template === "string"
      ? format(template, params)
      : plural(locale, Number(issue.params?.["min"] ?? 0), template, params);
  };
