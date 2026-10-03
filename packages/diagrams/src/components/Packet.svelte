<script lang="ts">
  import { PACKET_COLORS } from "../packets.ts";
  import type { PacketProps } from "../types.ts";

  const { type, label, size = "md", testid = `packet-${type}` }: PacketProps = $props();
</script>

<span
  class="packet {size}"
  data-testid={testid}
  data-type={type}
  style:--packet-bg={PACKET_COLORS[type]}
  >{label ?? type}</span
>

<style>
  /* A rubber-stamped tag: riso spot fill, 1.5px ink outline, hard 2px misregistration shadow. */
  .packet {
    display: inline-flex;
    align-items: center;
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--packet-bg);
    color: var(--color-on-packet);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    letter-spacing: var(--font-letter-spacing-wide);
    line-height: var(--font-line-height-tight);
    box-shadow: var(--shadow-pop-sm);
    white-space: nowrap;
  }
  .sm {
    padding: 0 var(--space-2xs);
    font-size: var(--font-size-xs);
    box-shadow: var(--shadow-sm);
  }
</style>
