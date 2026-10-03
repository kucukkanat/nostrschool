/**
 * Public props of every UI primitive. Components are locale-agnostic: anything with built-in
 * text takes `locale` and reads `getDictionary(locale).ui`. Interactive components REQUIRE a
 * `testid` (rendered as `data-testid`); sub-elements get `${testid}-<part>` ids (documented per prop).
 */
import type { GlossaryId, Locale } from "@nostrschool/i18n";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type Size = "sm" | "md" | "lg";
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface ButtonProps {
  readonly testid: string;
  readonly variant?: "primary" | "secondary" | "ghost" | "danger";
  readonly size?: Size;
  readonly type?: "button" | "submit" | "reset";
  readonly disabled?: boolean;
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  readonly loading?: boolean;
  /** Makes it a toggle button (aria-pressed). */
  readonly pressed?: boolean;
  /** Renders an `<a>` styled as a button (use `href()` from the site for internal links). */
  readonly href?: string;
  /** Required when the button has only an icon. */
  readonly ariaLabel?: string;
  readonly onclick?: (event: MouseEvent) => void;
  readonly icon?: Snippet;
  readonly children?: Snippet;
}

export interface CardProps {
  readonly testid?: string;
  readonly as?: "div" | "article" | "section" | "aside";
  readonly variant?: "plain" | "raised" | "outlined" | "highlight";
  readonly padding?: Size;
  readonly header?: Snippet;
  readonly footer?: Snippet;
  readonly children: Snippet;
}

/** "Under the hood" disclosure. Honors the persisted "always expand for me" preference. */
export interface DrawerProps {
  /** Parts: `${testid}-toggle`, `${testid}-content`, `${testid}-always`. */
  readonly testid: string;
  readonly locale: Locale;
  /** Defaults to the localized "Under the hood". */
  readonly title?: string;
  /** Bindable. Initial value is overridden to true when the user chose "always expand". */
  open?: boolean;
  readonly children: Snippet;
}

/** Inline glossary term with a hover/focus card linking to the glossary page. */
export interface TermProps {
  readonly id: GlossaryId;
  readonly locale: Locale;
  /** Link target for "read more", e.g. `href(locale, "glossary/#relay")` — the site builds it. */
  readonly glossaryHref: string;
  /** Parts: `${testid}-card`. Defaults to `term-${id}`. */
  readonly testid?: string;
  /** Visible text; defaults to the glossary term name. */
  readonly children?: Snippet;
}

export interface ToggleProps {
  readonly testid: string;
  /** Bindable. */
  checked?: boolean;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly onchange?: (checked: boolean) => void;
}

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/** WAI-ARIA tabs (arrow keys move, Home/End jump). Parts: `${testid}-tab-${id}`, `${testid}-panel`. */
export interface TabsProps {
  readonly testid: string;
  readonly tabs: readonly TabItem[];
  /** Bindable; defaults to the first enabled tab. */
  selected?: string;
  /** Accessible name of the tablist. */
  readonly label: string;
  readonly onchange?: (id: string) => void;
  readonly panel: Snippet<[selectedId: string]>;
}

export type CodeLanguage = "json" | "ts" | "js" | "bash" | "text";

export interface CodeBlockProps {
  /** Parts: `${testid}-copy`. */
  readonly testid: string;
  readonly locale: Locale;
  readonly code: string;
  readonly lang?: CodeLanguage;
  readonly caption?: string;
  /** 1-based line numbers to emphasize. */
  readonly highlightLines?: readonly number[];
  /** Shows a CopyButton (default true). */
  readonly copyable?: boolean;
}

/**
 * Pretty, token-colored JSON tree. Paths are dot-joined keys/indices from the root,
 * e.g. `"tags.0.1"`. Parts: `${testid}-path-${path}` on every value node.
 */
export interface JsonViewProps {
  /**
   * Parts: `${testid}-root`, `${testid}-path-<path>`, `${testid}-toggle-<path|root>`,
   * `${testid}-select-<path>` (selectable container punctuation) and
   * `${testid}-summary-<path|root>` (collapsed "… N items" button).
   */
  readonly testid: string;
  readonly locale: Locale;
  readonly value: unknown;
  readonly highlightPaths?: readonly string[];
  /** Nodes deeper than this start collapsed (default: never). */
  readonly collapsedDepth?: number;
  /** Makes value nodes focusable/clickable (event inspector "explain this field"). */
  readonly onselectpath?: (path: string) => void;
}

export interface CalloutProps {
  readonly testid?: string;
  readonly locale: Locale;
  readonly tone: "info" | "tip" | "warning" | "danger" | "safety";
  /** Defaults to the localized tone name. */
  readonly title?: string;
  readonly children: Snippet;
}

export interface TakeawayProps {
  readonly testid?: string;
  readonly locale: Locale;
  /** Defaults to the localized "Key takeaways". */
  readonly title?: string;
  readonly points: readonly string[];
}

export interface QuizOption {
  readonly id: string;
  readonly label: string;
  readonly correct: boolean;
  /** Shown after answering, for this option. */
  readonly explanation?: string;
}

/**
 * Mini-quiz. Emits `quiz:correct` / `quiz:wrong` on the mascot bus with `{ quizId: testid }`.
 * Parts: `${testid}-option-${id}`, `${testid}-check`, `${testid}-feedback`, `${testid}-retry`.
 */
export interface QuizProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly question: string;
  readonly options: readonly QuizOption[];
  /** Multiple correct answers (checkboxes) vs. single (radios). Default false. */
  readonly multiple?: boolean;
  readonly onanswer?: (correct: boolean, selectedIds: readonly string[]) => void;
}

/** Copies `value`; optional confetti burst (skipped under reduced motion). */
export interface CopyButtonProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly value: string;
  /** Visible label; defaults to localized "Copy". */
  readonly label?: string;
  readonly confetti?: boolean;
  readonly size?: Size;
}

export type BadgeTone = Tone | "live" | "regular" | "replaceable" | "ephemeral" | "addressable";

export interface BadgeProps {
  readonly testid?: string;
  readonly tone?: BadgeTone;
  readonly size?: "sm" | "md";
  readonly children: Snippet;
}

export interface StepperStep {
  readonly id: string;
  readonly label: string;
}

/** Clickable list of steps (aria-current on the active one). Parts: `${testid}-step-${id}`. */
export interface StepperProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly steps: readonly StepperStep[];
  /** Bindable 0-based index. */
  current?: number;
  readonly onchange?: (index: number) => void;
}

/**
 * Play/pause/step/scrub for animated diagrams. Owns no timer: the parent advances `step`
 * while `playing` (diagrams do this). Parts: `${testid}-play`, `${testid}-back`,
 * `${testid}-forward`, `${testid}-reset`, `${testid}-scrub`, `${testid}-status`.
 */
export interface PlaybackControlsProps {
  readonly testid: string;
  readonly locale: Locale;
  /** Bindable 0-based. */
  step?: number;
  readonly totalSteps: number;
  /** Bindable. */
  playing?: boolean;
  /** Bindable playback rate multiplier (0.5 | 1 | 2). Omit to hide the speed control. */
  speed?: number;
  readonly onstep?: (step: number) => void;
}

export interface TooltipProps {
  readonly testid?: string;
  /** Plain-text tooltip (also used as the accessible description). */
  readonly content: string;
  readonly placement?: "top" | "bottom" | "left" | "right";
  readonly children: Snippet;
}

/** Screen-reader-only text. Extra attributes (role, aria-live, id …) pass through to the element. */
export interface VisuallyHiddenProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Element to render; pick a block element when hiding block content. Default `span`. */
  readonly as?: "span" | "div" | "p" | "h2" | "h3";
  readonly testid?: string;
  readonly children: Snippet;
}
