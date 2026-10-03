/** Keyboard navigation for composite widgets (tabs, steppers): skips disabled items, wraps around. */
const NEXT = new Set(["ArrowRight", "ArrowDown"]);
const PREV = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Index to focus after `key` among `count` items starting at `from`, or undefined when the key
 * isn't a navigation key (let the browser handle it) or nothing is focusable.
 */
export const rovingIndex = (
  count: number,
  from: number,
  key: string,
  isDisabled: (index: number) => boolean = () => false,
): number | undefined => {
  const enabled = Array.from({ length: count }, (_, i) => i).filter((i) => !isDisabled(i));
  if (key === "Home") return enabled[0];
  if (key === "End") return enabled[enabled.length - 1];
  const step = NEXT.has(key) ? 1 : PREV.has(key) ? -1 : 0;
  if (step === 0) return undefined;
  for (let k = 1; k <= count; k++) {
    const i = (((from + step * k) % count) + count) % count;
    if (!isDisabled(i)) return i;
  }
  return undefined;
};
