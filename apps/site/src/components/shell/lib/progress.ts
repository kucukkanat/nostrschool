/**
 * Course progress: which chapters the learner marked complete, persisted in localStorage.
 * One store instance is shared by every island on the page (rail, grid, course map, complete
 * button) through module identity, so marking a chapter done updates all of them at once.
 */
import { err, ok, type ProtocolError, parseJson, type Result } from "@nostrschool/protocol";
import { atom, type ReadableAtom } from "nanostores";
import { CHAPTERS, type ChapterRef, type ChapterSlug } from "~/lib/chapters";
import {
  browserStorage,
  type KeyValueStorage,
  readItem,
  type StorageError,
  warnStorage,
  writeItem,
} from "./storage.ts";

export const PROGRESS_STORAGE_KEY = "nostrschool:completed";

export type Completed = readonly ChapterSlug[];
export type ProgressParseError = ProtocolError<"invalid-json" | "not-an-array">;

/** Course order, deduped, unknown slugs dropped (old/renamed chapters must not break the UI). */
export const normalizeCompleted = (slugs: readonly unknown[]): Completed =>
  CHAPTERS.filter((c) => slugs.includes(c.slug)).map((c) => c.slug);

export const parseCompleted = (raw: string | null): Result<Completed, ProgressParseError> => {
  if (raw === null) return ok([]);
  const parsed = parseJson(raw);
  if (!parsed.ok) return parsed;
  return Array.isArray(parsed.value)
    ? ok(normalizeCompleted(parsed.value))
    : err({ code: "not-an-array", message: `expected an array, got ${typeof parsed.value}` });
};

export const withCompleted = (completed: Completed, slug: ChapterSlug, done: boolean): Completed =>
  normalizeCompleted(done ? [...completed, slug] : completed.filter((s) => s !== slug));

const [firstChapter] = CHAPTERS;

/** First chapter not yet done; when everything is done, the first one (to revisit). */
export const nextChapter = (completed: Completed): ChapterRef =>
  CHAPTERS.find((c) => !completed.includes(c.slug)) ?? firstChapter;

export type ChapterStatus = "done" | "current" | "upcoming";

export const chapterStatus = (completed: Completed, slug: ChapterSlug): ChapterStatus =>
  completed.includes(slug) ? "done" : nextChapter(completed).slug === slug ? "current" : "upcoming";

export interface ProgressStore {
  readonly $completed: ReadableAtom<Completed>;
  readonly setCompleted: (slug: ChapterSlug, done: boolean) => Result<Completed, StorageError>;
  /** Re-reads storage (e.g. after another tab changed it). */
  readonly reload: () => void;
}

/** `storage` undefined = in-memory only (SSR, or storage blocked). */
export const createProgressStore = (storage: KeyValueStorage | undefined): ProgressStore => {
  const load = (): Completed => {
    if (storage === undefined) return [];
    const raw = readItem(storage, PROGRESS_STORAGE_KEY);
    if (!raw.ok) {
      warnStorage("progress unavailable", raw.error);
      return [];
    }
    const parsed = parseCompleted(raw.value);
    if (!parsed.ok) console.warn(`[shell] ignoring corrupt progress: ${parsed.error.code}`);
    return parsed.ok ? parsed.value : [];
  };
  const $completed = atom<Completed>(load());
  const setCompleted = (slug: ChapterSlug, done: boolean): Result<Completed, StorageError> => {
    const next = withCompleted($completed.get(), slug, done);
    // Update the UI even if persisting fails: progress then lives for this page view only.
    $completed.set(next);
    if (storage === undefined) return ok(next);
    const saved = writeItem(storage, PROGRESS_STORAGE_KEY, JSON.stringify(next));
    return saved.ok ? ok(next) : saved;
  };
  return { $completed, setCompleted, reload: () => $completed.set(load()) };
};

const storage = browserStorage();

/** App-wide singleton used by the shell islands. */
export const progress: ProgressStore = createProgressStore(storage.ok ? storage.value : undefined);
