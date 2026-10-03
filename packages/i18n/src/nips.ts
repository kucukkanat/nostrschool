/**
 * Per-NIP strings live in range files so spec authors and translators can work in parallel:
 * `locales/<loc>/nips/r1.ts` holds NIPs 01–19, r2 20–39, r3 40–59, r4 60–79, r5 80–99 and r6
 * every id with a letter (5A, 7D, A0, C7, EE…). Inside a file each NIP is keyed `n<id>`.
 */

/** Strings for one NIP. `text` holds every explanation its NipSpec references by TextKey. */
export interface NipStrings {
  /** Localized NIP title (may stay English where the community uses it as-is). */
  readonly title: string;
  /** One or two sentences in our own words: what the NIP is for. */
  readonly summary: string;
  readonly text: { readonly [key: string]: string };
}

export type NipStringsRange = { readonly [key: `n${string}`]: NipStrings };

export const NIP_RANGES = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;
export type NipRange = (typeof NIP_RANGES)[number];

/** Which range file holds a NIP id ("01" → "r1", "57" → "r3", "7D" → "r6"). */
export const nipRange = (id: string): NipRange => {
  if (!/^\d\d$/.test(id)) return "r6";
  const n = Number(id);
  return n < 20 ? "r1" : n < 40 ? "r2" : n < 60 ? "r3" : n < 80 ? "r4" : "r5";
};

/** The dictionary key of a NIP inside its range file: "01" → "n01". */
export const nipStringsKey = (id: string): `n${string}` => `n${id}`;
