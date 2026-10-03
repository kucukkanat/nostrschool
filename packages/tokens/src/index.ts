/**
 * @nostrschool/tokens — the single source of styling truth.
 *
 * In CSS: `@import "@nostrschool/tokens/tokens.css";` then use `var(--color-primary)` etc.
 * In TS (inline styles, SVG, D3): `vars.color.primary` → `"var(--color-primary)"` (theme-aware),
 * or `tokens.motion.duration.fast` → `120` (raw ms) when JS needs a number.
 */
import { cssVarNames, themes, tokens, vars } from "./generated/tokens.ts";

export { AA, contrastRatio, parseHex, relativeLuminance } from "./contrast.ts";
export { cssVarNames, themes, tokens, vars };

export type ThemeName = keyof typeof themes;
export type ColorToken = keyof typeof themes.light.color;
export type CssVarName = (typeof cssVarNames)[number];
export type SpaceToken = keyof typeof tokens.space;
export type RadiusToken = keyof typeof tokens.radius;
export type DurationToken = keyof typeof tokens.motion.duration;
export type EasingToken = keyof typeof tokens.motion.easing;
export type SpringToken = keyof typeof tokens.motion.spring;
export type BreakpointToken = keyof typeof tokens.breakpoint;

/** `cssVar("color-primary")` → `"var(--color-primary)"`, typo-checked against generated names. */
export const cssVar = (name: CssVarName, fallback?: string): string =>
  fallback === undefined ? `var(--${name})` : `var(--${name}, ${fallback})`;

/** Media query string for a breakpoint, e.g. `mediaUp("md")` → `"(min-width: 768px)"`. */
export const mediaUp = (bp: BreakpointToken): string => `(min-width: ${tokens.breakpoint[bp]}px)`;

type Pair = readonly [ColorToken, ColorToken];
const SURFACES = ["bg", "surface", "surfaceRaised", "surfaceSunken"] as const;
/** Surfaces diagrams, packets and chart marks are drawn on (sunken wells hold text only). */
const CANVASES = ["bg", "surface", "surfaceRaised"] as const;
const PACKETS = [
  "packetReq",
  "packetEvent",
  "packetEose",
  "packetOk",
  "packetClose",
  "packetClosed",
  "packetNotice",
  "packetAuth",
  "packetCount",
] as const;
const KINDS = ["kindRegular", "kindReplaceable", "kindEphemeral", "kindAddressable"] as const;
const CHARTS = [
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "chart6",
  "chart7",
  "chart8",
  "chartAxis",
] as const;
const CODE = [
  "codeText",
  "codeKey",
  "codeString",
  "codeNumber",
  "codeBoolean",
  "codeNull",
  "codePunctuation",
] as const;
/** Solid fills that carry `on-*` (ink) text. In the zine look they are outlined with border-strong. */
const FILLS = [
  "primary",
  "primaryHover",
  "primaryActive",
  "secondary",
  "secondaryHover",
  "accent",
  "accentHover",
  "successSolid",
  "warningSolid",
  "dangerSolid",
  "infoSolid",
  "live",
  "highlight",
  ...PACKETS,
  ...KINDS,
] as const;
const cross = <A extends ColorToken, B extends ColorToken>(
  fgs: readonly A[],
  bgs: readonly B[],
): readonly Pair[] => fgs.flatMap((fg) => bgs.map((bg) => [fg, bg] as const));

/**
 * Color pairs that must meet WCAG AA in BOTH themes (enforced by tokens.test.ts).
 * - `text`: 4.5:1. `nonText`: 3:1 (borders, focus rings, chart marks, edges).
 * - `focusFills`: when the focus ring hugs one of these fills, the ring OR the halo (the gap
 *   colour between ring and element, `focus-halo`) must reach 3:1 against it.
 * - `outlinedFills`: each fill must separate from the page/surfaces at 3:1 either by itself or
 *   through its border-strong outline (light theme: orange on paper is 2.7:1, the ink line is 15:1).
 */
export const CONTRAST_PAIRS: {
  readonly text: readonly Pair[];
  readonly nonText: readonly Pair[];
  readonly focusFills: readonly ColorToken[];
  readonly outlinedFills: readonly ColorToken[];
} = {
  text: [
    ...cross(
      [
        "text",
        "textMuted",
        "textSubtle",
        "textPrimary",
        "textSecondary",
        "textAccent",
        "success",
        "warning",
        "danger",
        "info",
      ],
      SURFACES,
    ),
    ...cross(
      ["text", "textMuted"],
      [
        "primarySubtle",
        "secondarySubtle",
        "accentSubtle",
        "successSubtle",
        "warningSubtle",
        "dangerSubtle",
        "infoSubtle",
      ],
    ),
    ["textPrimary", "primarySubtle"],
    ["textSecondary", "secondarySubtle"],
    ["textAccent", "accentSubtle"],
    ["success", "successSubtle"],
    ["warning", "warningSubtle"],
    ["danger", "dangerSubtle"],
    ["info", "infoSubtle"],
    ["textInverse", "surfaceInverse"],
    ...cross(["onPrimary"], ["primary", "primaryHover", "primaryActive"]),
    ...cross(["onSecondary"], ["secondary", "secondaryHover"]),
    ...cross(["onAccent"], ["accent", "accentHover"]),
    ["onSuccess", "successSolid"],
    ["onWarning", "warningSolid"],
    ["onDanger", "dangerSolid"],
    ["onInfo", "infoSolid"],
    ["onLive", "live"],
    ["onHighlight", "highlight"],
    ["text", "selection"],
    ...cross(CODE, ["codeBg", "codeHighlight"]),
    ...cross(["onPacket"], PACKETS),
    ...cross(["onKind"], KINDS),
    ...cross(
      ["text"],
      [
        "kindRegularSubtle",
        "kindReplaceableSubtle",
        "kindEphemeralSubtle",
        "kindAddressableSubtle",
      ],
    ),
    ...cross(["diagramLabel"], ["diagramNode", "diagramLane", "diagramLaneAlt", "diagramNodeDown"]),
    ...cross(["text"], ["envelopeWrap", "envelopeSeal", "envelopeRumor", "diagramHighlight"]),
  ],
  nonText: [
    ...cross(["borderStrong", "focusRing"], SURFACES),
    ["focusRing", "focusHalo"],
    ...cross([...CHARTS, ...PACKETS, ...KINDS, "live"], CANVASES),
    ...cross(["diagramEdge", "diagramEdgeActive", "diagramEdgeDead"], [...CANVASES, "diagramNode"]),
    ...cross(["textPrimary", "textSecondary", "textAccent"], CANVASES),
    ["diagramNodeStroke", "diagramNode"],
    ["diagramNodeStroke", "surface"],
    ["diagramNodeDownStroke", "diagramNodeDown"],
    ["envelopeStroke", "surface"],
    ...cross(["envelopeStroke"], ["envelopeWrap", "envelopeSeal", "envelopeRumor"]),
    ["mascotLine", "mascotBody"],
    ["mascotLine", "mascotBelly"],
    ["mascotLine", "mascotBeak"],
  ],
  focusFills: FILLS,
  outlinedFills: FILLS,
};
