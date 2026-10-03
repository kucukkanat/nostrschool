/**
 * @nostrschool/ui — Svelte 5 primitives, the mascot event bus and motion helpers.
 * Props interfaces are exported for typed wrappers; see types.ts for data-testid parts.
 */

export * from "./actions.ts";
export * from "./bus.ts";
export { default as Badge } from "./components/Badge.svelte";
export { default as Button } from "./components/Button.svelte";
export { default as Callout } from "./components/Callout.svelte";
export { default as Card } from "./components/Card.svelte";
export { default as CodeBlock } from "./components/CodeBlock.svelte";
export { default as CopyButton } from "./components/CopyButton.svelte";
export { default as Drawer, default as UnderTheHood } from "./components/Drawer.svelte";
export { default as JsonView } from "./components/JsonView.svelte";
export { default as PlaybackControls } from "./components/PlaybackControls.svelte";
export { default as Quiz } from "./components/Quiz.svelte";
export { default as Stepper } from "./components/Stepper.svelte";
export { default as Tabs } from "./components/Tabs.svelte";
export { default as Takeaway } from "./components/Takeaway.svelte";
export { default as Term } from "./components/Term.svelte";
export { default as Toggle } from "./components/Toggle.svelte";
export { default as Tooltip } from "./components/Tooltip.svelte";
export { default as VisuallyHidden } from "./components/VisuallyHidden.svelte";
export { type ClipboardError, type ClipboardLike, copyText } from "./lib/clipboard.ts";
export { type BurstOutcome, burstFrom, burstOptions, themeColors } from "./lib/confetti.ts";
export { resolveTerm, type TermCard } from "./lib/glossary.ts";
export { type CodeToken, type CodeTokenType, highlightLines } from "./lib/highlight.ts";
export { containsHighlight, type JsonLeafType, type JsonNode, toJsonTree } from "./lib/json.ts";
export { viewportShift } from "./lib/popover.ts";
export { gradeQuiz, toggleSelection } from "./lib/quiz.ts";
export { rovingIndex } from "./lib/roving.ts";
export * from "./motion.ts";
export * from "./stores.ts";
export type * from "./types.ts";
