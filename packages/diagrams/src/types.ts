/**
 * Public props of the diagram components. All diagrams:
 * - take `title` (accessible name) and `locale` (built-in strings come from `getDictionary(locale).diagrams`/`.ui`)
 * - take `testid` and prefix every interactive part with it (parts listed per prop)
 * - narrate the current step in an aria-live region (`${testid}-narration`)
 * - read colors only from tokens (`vars` from @nostrschool/tokens) and honor reduced motion
 * - reserve their height (min `--size-diagram-min-height`) so hydration causes no layout shift
 */
import type { Locale } from "@nostrschool/i18n";
import type { MessageType } from "@nostrschool/protocol";
import type { Snippet } from "svelte";

interface DiagramBase {
  readonly testid: string;
  readonly locale: Locale;
  readonly title: string;
  /** Optional longer description for screen readers (aria-describedby). */
  readonly description?: string;
}

/** Wire verbs + `custom` for non-Nostr arrows (HTTP, Lightning…). Colors: `--color-packet-<type>`. */
export type PacketType = MessageType | "custom";

/* ---------- SequenceDiagram ---------- */

export type LaneKind = "user" | "client" | "relay" | "signer" | "server" | "wallet" | "extension";

export interface SequenceLane {
  readonly id: string;
  readonly label: string;
  readonly kind?: LaneKind;
}

export interface SequenceMessage {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  /** Short arrow label, e.g. `["REQ", "sub1", {...}]` abbreviated. */
  readonly label: string;
  readonly packet?: PacketType;
  /** Narration announced when this message becomes current. */
  readonly narration?: string;
  /** Raw payload, shown in the detail panel (e.g. the JSON frame). */
  readonly payload?: unknown;
}

/**
 * Lanes + messages; one message per step. Step/play/scrub via PlaybackControls.
 * Parts: `${testid}-lane-${laneId}`, `${testid}-message-${messageId}`, `${testid}-controls-*`,
 * `${testid}-narration`, `${testid}-detail`.
 */
export interface SequenceDiagramProps extends DiagramBase {
  readonly lanes: readonly SequenceLane[];
  readonly messages: readonly SequenceMessage[];
  /** Bindable index of the current message (-1 = nothing sent yet). Default -1. */
  step?: number;
  /** Bindable autoplay state. */
  playing?: boolean;
  /** Base ms between steps at speed 1 (default `tokens.motion.duration.step`). */
  readonly stepMs?: number;
  readonly onstep?: (step: number, message: SequenceMessage | undefined) => void;
  /** Custom detail panel for the current message. */
  readonly detail?: Snippet<[SequenceMessage]>;
}

/* ---------- Pipeline ---------- */

export interface PipelineStage {
  readonly id: string;
  readonly label: string;
  /** The stage's output, e.g. the serialized string or the hash (monospace, truncated with expand). */
  readonly value?: string;
  readonly description?: string;
}

export type PipelineStatus = "idle" | "running" | "ok" | "error";

/**
 * Left-to-right (stacked on mobile) stages with animated hand-offs; values "roll" on change.
 * Parts: `${testid}-stage-${id}` (`data-state="pending|active|done|error"`), `${testid}-narration`.
 */
export interface PipelineProps extends DiagramBase {
  readonly stages: readonly PipelineStage[];
  /** Bindable index of the stage being highlighted. */
  active?: number;
  readonly status?: PipelineStatus;
  /** Stage index that failed when `status` is "error". */
  readonly errorAt?: number;
}

/* ---------- Swimlane ---------- */

export interface SwimlaneLane {
  readonly id: string;
  readonly label: string;
}

export interface SwimlaneStep {
  readonly id: string;
  readonly lane: string;
  readonly label: string;
  /** Optional arrow to another lane. */
  readonly to?: string;
  readonly packet?: PacketType;
  readonly narration?: string;
  readonly payload?: unknown;
}

/** Parts: `${testid}-lane-${id}`, `${testid}-step-${id}`, `${testid}-controls-*`, `${testid}-narration`. */
export interface SwimlaneProps extends DiagramBase {
  readonly lanes: readonly SwimlaneLane[];
  readonly steps: readonly SwimlaneStep[];
  /** Bindable 0-based current step. */
  current?: number;
  playing?: boolean;
  readonly onstep?: (index: number, step: SwimlaneStep | undefined) => void;
}

/* ---------- ForceGraph ---------- */

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  /** Image URL / data URI (e.g. persona avatar). */
  readonly avatar?: string;
}

export interface GraphLink {
  readonly source: string;
  readonly target: string;
  readonly kind?: "follows" | "mutual" | "relay";
}

/**
 * d3-force layout (static, pre-ticked layout under reduced motion). Nodes are focusable
 * buttons in a roving-tabindex list. Parts: `${testid}-node-${id}` (`aria-pressed` when selected),
 * `${testid}-narration`, `${testid}-table` (text alternative: adjacency list).
 */
export interface ForceGraphProps extends DiagramBase {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
  /** Bindable selected node id. */
  selected?: string | null;
  /** Ids to emphasize (e.g. the selected node's follows). */
  readonly highlight?: readonly string[];
  readonly width?: number;
  readonly height?: number;
  readonly onselect?: (id: string | null) => void;
}

/* ---------- Packet ---------- */

/** A small colored pill for a wire message, usable inline or animated along a path. */
export interface PacketProps {
  readonly type: PacketType;
  /** Defaults to the type itself, e.g. "REQ". */
  readonly label?: string;
  readonly size?: "sm" | "md";
  readonly testid?: string;
}
