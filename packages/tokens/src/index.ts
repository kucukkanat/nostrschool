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

/**
 * Color pairs (foreground, background) that must meet WCAG AA in BOTH themes.
 * `text` pairs need 4.5:1, `nonText` pairs (borders, focus rings, chart marks) need 3:1.
 */
export const CONTRAST_PAIRS: {
  readonly text: readonly (readonly [ColorToken, ColorToken])[];
  readonly nonText: readonly (readonly [ColorToken, ColorToken])[];
} = {
  text: [
    ...(
      ["text", "textMuted", "textSubtle", "textPrimary", "textSecondary", "textAccent"] as const
    ).flatMap((fg) =>
      (["bg", "surface", "surfaceRaised", "surfaceSunken"] as const).map((bg) => [fg, bg] as const),
    ),
    ["text", "primarySubtle"],
    ["textPrimary", "primarySubtle"],
    ["text", "secondarySubtle"],
    ["text", "accentSubtle"],
    ["textInverse", "surfaceInverse"],
    ["onPrimary", "primary"],
    ["onPrimary", "primaryHover"],
    ["onPrimary", "primaryActive"],
    ["onSecondary", "secondary"],
    ["onSecondary", "secondaryHover"],
    ["onAccent", "accent"],
    ["onAccent", "accentHover"],
    ["success", "successSubtle"],
    ["success", "surface"],
    ["warning", "warningSubtle"],
    ["warning", "surface"],
    ["danger", "dangerSubtle"],
    ["danger", "surface"],
    ["info", "infoSubtle"],
    ["info", "surface"],
    ["onSuccess", "successSolid"],
    ["onWarning", "warningSolid"],
    ["onDanger", "dangerSolid"],
    ["onInfo", "infoSolid"],
    ["onLive", "live"],
    ...(
      [
        "codeText",
        "codeKey",
        "codeString",
        "codeNumber",
        "codeBoolean",
        "codeNull",
        "codePunctuation",
      ] as const
    ).flatMap((fg) => [[fg, "codeBg"] as const, [fg, "codeHighlight"] as const]),
    ...(
      [
        "packetReq",
        "packetEvent",
        "packetEose",
        "packetOk",
        "packetClose",
        "packetClosed",
        "packetNotice",
        "packetAuth",
        "packetCount",
      ] as const
    ).map((bg) => ["onPacket", bg] as const),
    ...(["kindRegular", "kindReplaceable", "kindEphemeral", "kindAddressable"] as const).map(
      (bg) => ["onKind", bg] as const,
    ),
    ["text", "kindRegularSubtle"],
    ["text", "kindReplaceableSubtle"],
    ["text", "kindEphemeralSubtle"],
    ["text", "kindAddressableSubtle"],
    ["diagramLabel", "diagramNode"],
    ["diagramLabel", "diagramLane"],
    ["diagramLabel", "diagramLaneAlt"],
    ["diagramLabel", "diagramNodeDown"],
    ["text", "envelopeWrap"],
    ["text", "envelopeSeal"],
    ["text", "envelopeRumor"],
    ["text", "selection"],
  ],
  nonText: [
    ["borderStrong", "surface"],
    ["borderStrong", "bg"],
    ["focusRing", "bg"],
    ["focusRing", "surface"],
    ["focusRing", "surfaceRaised"],
    ["focusRing", "surfaceSunken"],
    // The ring often hugs a primary-filled button/tab, so it must also separate from primary.
    ["focusRing", "primary"],
    ...(
      [
        "chart1",
        "chart2",
        "chart3",
        "chart4",
        "chart5",
        "chart6",
        "chart7",
        "chart8",
        "chartAxis",
      ] as const
    ).map((fg) => [fg, "surface"] as const),
    ["diagramEdge", "surface"],
    ["diagramEdgeActive", "surface"],
    ["diagramEdgeDead", "surface"],
    ["diagramNodeStroke", "diagramNode"],
    ["diagramNodeDownStroke", "diagramNodeDown"],
    ["envelopeStroke", "surface"],
    ...(
      [
        "packetReq",
        "packetEvent",
        "packetEose",
        "packetOk",
        "packetClose",
        "packetClosed",
        "packetNotice",
        "packetAuth",
        "packetCount",
      ] as const
    ).map((fg) => [fg, "surface"] as const),
    ...(
      [
        "kindRegular",
        "kindReplaceable",
        "kindEphemeral",
        "kindAddressable",
        "live",
        "primary",
        "accent",
      ] as const
    ).map((fg) => [fg, "surface"] as const),
  ],
};
