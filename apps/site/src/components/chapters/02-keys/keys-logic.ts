/**
 * Pure helpers behind chapter 02's interactives. Everything visual is derived from the real
 * NIP-19 encoding steps exposed by @nostrschool/protocol, so the animation can never drift from
 * what an actual encoder does.
 */
import {
  BECH32_CHARSET,
  type Bech32Steps,
  computeEventId,
  deriveSecretKey,
  fail,
  type Keypair,
  keypairFromSecret,
  type Nip19Error,
  type NostrEvent,
  nip19Encode,
  ok,
  type Result,
  verifyEvent,
} from "@nostrschool/protocol";

/** One 5-bit bech32 word and where it came from. */
export interface WordFrame {
  readonly index: number;
  /** The 5 bits, e.g. "01101" (checksum words have no source bits in the payload). */
  readonly bits: string;
  readonly value: number;
  readonly char: string;
  readonly checksum: boolean;
  /** Inclusive byte range of the payload this word reads from (data words only). */
  readonly bytes?: readonly [first: number, last: number];
}

const BITS_PER_WORD = 5;

/** Bytes as a "0101…" bit string (MSB first). */
export const bitsOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join("");

/** Which payload bytes the i-th 5-bit word straddles (a word spans at most 2 bytes). */
export const byteRangeOfWord = (index: number, byteLength: number): readonly [number, number] => {
  const first = Math.floor((index * BITS_PER_WORD) / 8);
  const last = Math.min(
    Math.floor((index * BITS_PER_WORD + BITS_PER_WORD - 1) / 8),
    byteLength - 1,
  );
  return [first, last];
};

const word = (value: number): string => value.toString(2).padStart(BITS_PER_WORD, "0");

/** Data words then checksum words, each mapped to its bech32 character. */
export const wordFrames = (steps: Bech32Steps): readonly WordFrame[] => [
  ...steps.words.map((value, index) => ({
    index,
    bits: word(value),
    value,
    char: BECH32_CHARSET.charAt(value),
    checksum: false,
    bytes: byteRangeOfWord(index, steps.dataBytes.length),
  })),
  ...steps.checksumWords.map((value, i) => ({
    index: steps.words.length + i,
    bits: word(value),
    value,
    char: BECH32_CHARSET.charAt(value),
    checksum: true,
  })),
];

/**
 * The bits of the bytes a data word straddles, and where its 5-bit window sits inside them.
 * The final word may run past the payload; bech32 pads it with zero bits, shown explicitly.
 */
export interface WordWindow {
  readonly bits: string;
  readonly start: number;
  readonly padding: number;
}
export const wordWindow = (frame: WordFrame, dataBytes: Uint8Array): WordWindow | undefined => {
  if (frame.bytes === undefined) return undefined;
  const [first, last] = frame.bytes;
  const real = bitsOf(dataBytes.slice(first, last + 1));
  const start = frame.index * BITS_PER_WORD - first * 8;
  const padding = Math.max(0, start + BITS_PER_WORD - real.length);
  return { bits: real + "0".repeat(padding), start, padding };
};

/** The encoded string as it looks after `revealed` words: `${hrp}1` + the first chars. */
export const partialEncoding = (steps: Bech32Steps, revealed: number): string =>
  `${steps.hrp}1${steps.dataChars.slice(0, Math.max(0, revealed))}`;

export type EncodeTarget = "npub" | "nsec";

export interface EncodeTrack {
  readonly steps: Bech32Steps;
  readonly frames: readonly WordFrame[];
}

/** NIP-19 steps + animation frames for a keypair's npub or nsec. */
export const encodeTrack = (kp: Keypair, target: EncodeTarget): Result<EncodeTrack, Nip19Error> => {
  const steps = nip19Encode(
    target === "npub" ? { type: "npub", data: kp.publicKey } : { type: "nsec", data: kp.secretKey },
  );
  return steps.ok ? ok({ steps: steps.value, frames: wordFrames(steps.value) }) : steps;
};

/** Hex split into byte pairs, so the UI can highlight the bytes a word reads from. */
export const hexBytes = (hex: string): readonly string[] => hex.match(/.{2}/g) ?? [];

/** Keeps the first/last `keep` characters; the rest becomes bullets of the same length. */
export const maskSecret = (secret: string, keep = 4): string =>
  secret.length <= keep * 2
    ? "•".repeat(secret.length)
    : `${secret.slice(0, keep)}${"•".repeat(secret.length - keep * 2)}${secret.slice(-keep)}`;

/**
 * The keypair shown before anyone clicks "generate": deterministic so server and client render
 * the same markup (no hydration mismatch). Its secret is public by design: sha256 of a label.
 */
export const SAMPLE_LABEL = "nostrschool:ch02:sample";
export const sampleKeypair = (): Keypair => {
  const kp = keypairFromSecret(deriveSecretKey(SAMPLE_LABEL));
  // sha256 output is out of range with probability ~2^-128; failing loudly is the honest fallback.
  if (!kp.ok) throw new Error(`Sample key invalid: ${kp.error.message}`);
  return kp.value;
};

// ---------------------------------------------------------------------------------------------
// Toy "clock" group: the one-way intuition behind secp256k1, at a size humans can see.
// Real Nostr keys do point multiplication on an elliptic curve with ~2^256 points; here we hop
// around a circle of N positions with a fixed stride G. Forward is easy, backward needs guessing.
// ---------------------------------------------------------------------------------------------

export interface ToyGroup {
  readonly n: number;
  readonly g: number;
}

/** Prime size so every stride visits every position (a cyclic group). */
export const TOY_GROUP: ToyGroup = { n: 61, g: 17 };

export type ToyError = { readonly code: "out-of-range"; readonly message: string };

const checkScalar = (k: number, group: ToyGroup): Result<number, ToyError> =>
  Number.isInteger(k) && k >= 1 && k < group.n
    ? ok(k)
    : fail("out-of-range", `Secret must be an integer between 1 and ${group.n - 1}`);

/** "Public point" = k hops of size g around the circle. */
export const toyPublic = (k: number, group: ToyGroup = TOY_GROUP): Result<number, ToyError> => {
  const valid = checkScalar(k, group);
  return valid.ok ? ok((valid.value * group.g) % group.n) : valid;
};

/** Every position visited while hopping k times (the forward path the diagram animates). */
export const toyHops = (
  k: number,
  group: ToyGroup = TOY_GROUP,
): Result<readonly number[], ToyError> => {
  const valid = checkScalar(k, group);
  if (!valid.ok) return valid;
  return ok(Array.from({ length: valid.value }, (_, i) => ((i + 1) * group.g) % group.n));
};

/** Brute force: the guesses an attacker makes (1, 2, 3 …) until one lands on `target`. */
export const toyBruteForce = (
  target: number,
  group: ToyGroup = TOY_GROUP,
): Result<readonly number[], ToyError> => {
  if (!Number.isInteger(target) || target < 1 || target >= group.n)
    return fail("out-of-range", `Target must be a position between 1 and ${group.n - 1}`);
  const guesses: number[] = [];
  for (let k = 1; k < group.n; k++) {
    guesses.push(k);
    if ((k * group.g) % group.n === target) return ok(guesses);
  }
  // Unreachable for a prime n (g generates the group); kept explicit rather than silent.
  return fail("out-of-range", `Target ${target} is not reachable with stride ${group.g}`);
};

/** SVG coordinates of position i on a circle (0 at 12 o'clock, clockwise). */
export const circlePoint = (
  i: number,
  n: number,
  radius: number,
  center: number,
): { readonly x: number; readonly y: number } => {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
};

// ---------------------------------------------------------------------------------------------
// "Who gets which key?" sorter (never share your nsec).
// ---------------------------------------------------------------------------------------------

export type KeyAsked = "npub" | "nsec";
export type ShareChoice = "share" | "refuse";
export type ShareVerdict = "safe" | "danger" | "overcautious";

export interface ShareRequest {
  /** Matches an i18n entry in `ch02.guard.requests`. */
  readonly id: "friend" | "support" | "giveaway" | "podcast";
  readonly asks: KeyAsked;
}

export const SHARE_REQUESTS: readonly ShareRequest[] = [
  { id: "friend", asks: "npub" },
  { id: "support", asks: "nsec" },
  { id: "podcast", asks: "npub" },
  { id: "giveaway", asks: "nsec" },
];

/** npub is meant to be public; an nsec request is always a red flag. */
export const judgeShare = (asks: KeyAsked, choice: ShareChoice): ShareVerdict =>
  asks === "nsec"
    ? choice === "share"
      ? "danger"
      : "safe"
    : choice === "share"
      ? "safe"
      : "overcautious";

export const allSafe = (verdicts: Readonly<Partial<Record<ShareRequest["id"], ShareVerdict>>>) =>
  SHARE_REQUESTS.every((r) => verdicts[r.id] === "safe");

// ---------------------------------------------------------------------------------------------
// Signature stamp: does a signature made over one message still verify after an edit?
// ---------------------------------------------------------------------------------------------

/**
 * Re-checks `signed.sig` against edited content. The id is recomputed honestly (as any client
 * would), so the failure surfaces as a bad signature rather than a mere id mismatch.
 */
export const stampStillValid = (signed: NostrEvent, content: string): boolean => {
  const { id: _id, sig, ...unsigned } = signed;
  const edited = { ...unsigned, content };
  return verifyEvent({ ...edited, id: computeEventId(edited).id, sig }).ok;
};
