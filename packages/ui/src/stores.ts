/** Persisted per-viewer UI preferences (localStorage via @nanostores/persistent; safe when unavailable). */
import { persistentAtom } from "@nanostores/persistent";

/** "Always expand Under-the-hood drawers for me." */
export const $alwaysExpandDrawers = persistentAtom<boolean>("nostrschool:always-expand", false, {
  encode: (v) => (v ? "1" : "0"),
  decode: (s) => s === "1",
});
