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
  .packet {
    display: inline-flex;
    align-items: center;
    padding: var(--space-3xs) var(--space-sm);
    border-radius: var(--radius-pill);
    background: var(--packet-bg);
    color: var(--color-on-packet);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    letter-spacing: var(--font-letter-spacing-wide);
    line-height: var(--font-line-height-tight);
    box-shadow: var(--shadow-sm);
    white-space: nowrap;
  }
  .sm {
    padding: 0 var(--space-xs);
    font-size: var(--font-size-xs);
  }
</style>
