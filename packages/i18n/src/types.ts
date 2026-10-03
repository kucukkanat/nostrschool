/**
 * A message leaf is a plain string (may contain `{placeholder}`s) or a plural object
 * resolved with `plural()`. Dictionaries are plain nested objects of those.
 */
export interface PluralMessage {
  readonly one: string;
  readonly other: string;
  /** Optional exact-zero form. */
  readonly zero?: string;
}

/**
 * Dot-separated paths to every string leaf of T, e.g. "common.nav.learn".
 * Plural objects are not included (use `plural()` with the object instead).
 */
export type MessagePath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends PluralMessage
      ? never
      : T[K] extends object
        ? MessagePath<T[K], `${Prefix}${K}.`>
        : never;
}[keyof T & string];

/** Values for `{placeholder}` interpolation. */
export type MessageParams = Readonly<Record<string, string | number>>;
