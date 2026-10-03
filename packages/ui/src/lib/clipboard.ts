// Deep import keeps crypto deps (nostr-tools) out of islands that only need Result.
import { fail, ok, type ProtocolError, type Result } from "@nostrschool/protocol/result.ts";

export type ClipboardError = ProtocolError<"unavailable" | "write-failed">;

/** Minimal clipboard surface; defaults to the browser's (absent on insecure origins and SSR). */
export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

export const copyText = async (
  text: string,
  clipboard: ClipboardLike | null = globalThis.navigator?.clipboard ?? null,
): Promise<Result<void, ClipboardError>> => {
  if (clipboard === null) return fail("unavailable", "Clipboard API is not available");
  try {
    await clipboard.writeText(text);
    return ok(undefined);
  } catch (error) {
    // Permission denials are expected user-facing states, so they become typed errors.
    return fail("write-failed", String(error));
  }
};
