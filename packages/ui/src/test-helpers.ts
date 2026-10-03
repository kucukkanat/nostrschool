/** Shared test utilities (real DOM via happy-dom; no mocks). */
import { createRawSnippet, type Snippet } from "svelte";

export const text = (s: string): Snippet =>
  createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));

interface HappyDomWindow {
  readonly happyDOM: { readonly settings: { device: { prefersReducedMotion: string } } };
}

/** Flips happy-dom's real media-query state (what matchMedia reports), then restores it. */
export const withReducedMotion = async (fn: () => unknown | Promise<unknown>): Promise<void> => {
  const device = (globalThis.window as unknown as HappyDomWindow).happyDOM.settings.device;
  const before = device.prefersReducedMotion;
  device.prefersReducedMotion = "reduce";
  try {
    await fn();
  } finally {
    device.prefersReducedMotion = before;
  }
};

export const tick = (ms = 0): Promise<void> => new Promise((r) => setTimeout(r, ms));
