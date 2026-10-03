<script lang="ts">
  import { PACKET_COLORS } from "../../packets.ts";
  import type { PacketType } from "../../types.ts";

  // SVG twin of <Packet>: a pill centered on (x, y) for use inside diagrams.
  interface Props {
    readonly x: number;
    readonly y: number;
    readonly type: PacketType;
    readonly label: string;
  }
  const { x, y, type, label }: Props = $props();
  // Monospace glyphs are ~0.62em wide; --font-size-xs (12 units) → ~7.5 units per char, plus padding.
  const width = $derived(Math.max(36, label.length * 7.5 + 16));
</script>

<g class="wire-packet" transform="translate({x} {y})" data-type={type}>
  <rect x={-width / 2} y="-11" {width} height="22" rx="11" style:fill={PACKET_COLORS[type]} />
  <text class="wire-packet-text" text-anchor="middle" dominant-baseline="central">{label}</text>
</g>

<style>
  .wire-packet-text {
    fill: var(--color-on-packet);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
  }
</style>
