/**
 * Explicit, typed success/failure. Every fallible protocol function returns a Result instead
 * of throwing, so UI can show *why* something failed (a teaching moment) without try/catch.
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}
export type Result<T, E> = Ok<T> | Err<E>;

/** Uniform error payload: a machine-readable `code` (for i18n lookup/tests) and a dev message. */
export interface ProtocolError<C extends string = string> {
  readonly code: C;
  readonly message: string;
}

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/** Shorthand for `err({ code, message })`. */
export const fail = <C extends string>(code: C, message: string): Err<ProtocolError<C>> =>
  err({ code, message });

export const mapResult = <T, U, E>(r: Result<T, E>, f: (v: T) => U): Result<U, E> =>
  r.ok ? ok(f(r.value)) : r;

export const flatMapResult = <T, U, E, F>(
  r: Result<T, E>,
  f: (v: T) => Result<U, F>,
): Result<U, E | F> => (r.ok ? f(r.value) : r);

/**
 * Returns the value or throws. Only for tests, fixtures generation and build scripts where a
 * failure is a programming error — never in UI code paths.
 */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw new Error(`unwrap on Err: ${JSON.stringify(r.error)}`);
};
