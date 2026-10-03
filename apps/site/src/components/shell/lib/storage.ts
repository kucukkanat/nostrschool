/**
 * Guarded localStorage access. Storage can be missing (SSR, bun test without DOM) or throw on
 * access (Safari private mode, blocked cookies), so every read/write returns a Result and the
 * shell degrades to "nothing remembered" instead of crashing an island.
 */
import { err, ok, type ProtocolError, type Result } from "@nostrschool/protocol";

export type StorageError = ProtocolError<"unavailable" | "read-failed" | "write-failed">;

/** The subset of `Storage` the shell needs, so tests can pass any real Storage instance. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const browserStorage = (): Result<KeyValueStorage, StorageError> => {
  try {
    if (typeof localStorage === "undefined")
      return err({ code: "unavailable", message: "localStorage is not defined" });
    return ok(localStorage);
  } catch (error) {
    return err({ code: "unavailable", message: describe(error) });
  }
};

export const readItem = (
  storage: KeyValueStorage,
  key: string,
): Result<string | null, StorageError> => {
  try {
    return ok(storage.getItem(key));
  } catch (error) {
    return err({ code: "read-failed", message: describe(error) });
  }
};

/** `null` removes the key. */
export const writeItem = (
  storage: KeyValueStorage,
  key: string,
  value: string | null,
): Result<void, StorageError> => {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
    return ok(undefined);
  } catch (error) {
    return err({ code: "write-failed", message: describe(error) });
  }
};

/** Logs a storage failure once per call site; preferences are a nicety, never fatal. */
export const warnStorage = (what: string, error: StorageError): void => {
  console.warn(`[shell] ${what}: ${error.code} (${error.message})`);
};
