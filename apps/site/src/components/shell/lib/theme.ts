/**
 * Theme preference: "system" follows `prefers-color-scheme` (tokens.css handles that via media
 * query), "light"/"dark" force it with `<html data-theme>`. The pre-paint inline script in
 * BaseLayout mirrors `applyTheme` so there is no flash; keep both in sync.
 */
import type { Result } from "@nostrschool/protocol";
import { type KeyValueStorage, readItem, type StorageError, writeItem } from "./storage.ts";

export const THEME_PREFS = ["light", "dark", "system"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];
export type ResolvedTheme = Exclude<ThemePref, "system">;

export const THEME_STORAGE_KEY = "nostrschool:theme";

export const isThemePref = (value: unknown): value is ThemePref =>
  THEME_PREFS.some((p) => p === value);

/** Only forced themes are stored; anything else (missing, garbage) means "system". */
export const parseThemePref = (raw: string | null): ThemePref =>
  raw === "light" || raw === "dark" ? raw : "system";

export const resolveTheme = (pref: ThemePref, prefersDark: boolean): ResolvedTheme =>
  pref === "system" ? (prefersDark ? "dark" : "light") : pref;

export const applyTheme = (root: HTMLElement, pref: ThemePref): void => {
  if (pref === "system") delete root.dataset["theme"];
  else root.dataset["theme"] = pref;
};

export const loadThemePref = (storage: KeyValueStorage): Result<ThemePref, StorageError> => {
  const raw = readItem(storage, THEME_STORAGE_KEY);
  return raw.ok ? { ok: true, value: parseThemePref(raw.value) } : raw;
};

export const saveThemePref = (
  storage: KeyValueStorage,
  pref: ThemePref,
): Result<void, StorageError> =>
  writeItem(storage, THEME_STORAGE_KEY, pref === "system" ? null : pref);
