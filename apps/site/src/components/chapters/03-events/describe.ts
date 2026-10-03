/**
 * Locale-aware, pure text builders for chapter 03 (kept out of the .svelte files so they are
 * unit-tested without rendering).
 */
import { format, formatDate, getDictionary, type Locale } from "@nostrschool/i18n";
import {
  type EventShapeError,
  getKindInfo,
  type KindCategory,
  type Tag,
} from "@nostrschool/protocol";
import { type TagKind, tagKind, VERIFY_STAGES, type VerifyStage, type VerifyView } from "./lab.ts";

const t = (locale: Locale) => getDictionary(locale).chapters.ch03;

export interface KindSummary {
  readonly name: string;
  readonly description?: string;
  readonly category?: KindCategory;
  readonly categoryName?: string;
}

/** Name + storage category of a kind, falling back gracefully for kinds we don't list. */
export const kindSummary = (locale: Locale, kind: number): KindSummary => {
  const dict = getDictionary(locale);
  const info = getKindInfo(kind);
  const names: Readonly<Record<string, { readonly name: string; readonly description: string }>> =
    dict.kinds.names;
  const entry = info === undefined ? undefined : names[info.i18nKey];
  if (info === undefined || entry === undefined)
    return { name: format(t(locale).kindUnknown, { kind }) };
  return {
    name: entry.name,
    description: entry.description,
    category: info.category,
    categoryName: dict.kinds.categories[info.category],
  };
};

export const tagLabel = (locale: Locale, tag: Tag): string => {
  const kind: TagKind = tagKind(tag);
  return format(t(locale).tags.names[kind], { name: tag[0] });
};

export const createdAtText = (locale: Locale, createdAt: number): string =>
  format(t(locale).createdAtHuman, {
    date: formatDate(locale, new Date(createdAt * 1000), {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    }),
  });

export const verdictText = (locale: Locale, view: VerifyView): string =>
  t(locale).verdict[view.code ?? "valid"];

export const shapeErrorText = (locale: Locale, error: EventShapeError): string =>
  format(t(locale).inspector.errors[error.code], {
    field: error.field ?? "",
    message: error.message,
  });

export interface StageModel {
  readonly id: VerifyStage;
  readonly label: string;
  readonly description: string;
  readonly value?: string;
}

/**
 * Pipeline stages for a verification view. Values appear only for stages the animation has
 * reached (`reached` = index of the last revealed stage), so the outcome isn't spoiled early.
 */
export const pipelineStages = (
  locale: Locale,
  view: VerifyView,
  reached: number,
): readonly StageModel[] => {
  const p = t(locale).pipeline;
  const idOk = view.computedId === view.claimedId;
  // The signature is only checked once the id matches (same order as verifyEvent).
  const sig = !idOk ? p.skipped : view.status === "ok" ? p.sigValid : p.sigInvalid;
  const values: Record<VerifyStage, string> = {
    serialize: view.serialized,
    hash: view.computedId,
    compare: idOk ? p.idMatch : p.idMismatch,
    schnorr: sig,
  };
  return VERIFY_STAGES.map((id, i) => {
    const base = { id, label: p.stages[id].label, description: p.stages[id].description };
    return i <= reached ? { ...base, value: values[id] } : base;
  });
};

/** Index of the stage where the animation stops: the failing check, or the last one. */
export const finalStage = (view: VerifyView): number => view.errorAt ?? VERIFY_STAGES.length - 1;
