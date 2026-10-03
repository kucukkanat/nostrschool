/**
 * Step state machine behind every steppable diagram. Pure so autoplay, stepping and the
 * "press play at the end restarts" rule are unit-testable without timers.
 */
export interface PlaybackState {
  readonly step: number;
  readonly playing: boolean;
}

/** One autoplay tick: advance, and stop once the last step is reached. */
export const tick = (s: PlaybackState, last: number): PlaybackState => {
  const step = Math.min(s.step + 1, last);
  return { step, playing: s.playing && step < last };
};

/** Pressing play at (or past) the end rewinds to `first` so play always shows something. */
export const play = (s: PlaybackState, first: number, last: number): PlaybackState => ({
  step: s.step >= last ? first : s.step,
  playing: last > first,
});

/** Delay between autoplay ticks; non-positive / non-finite speeds fall back to 1×. */
export const stepDelay = (baseMs: number, speed: number | undefined): number =>
  Math.max(0, baseMs) / (speed !== undefined && Number.isFinite(speed) && speed > 0 ? speed : 1);
