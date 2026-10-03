<script lang="ts">
  /** Text with matched search terms wrapped in the brand's highlighter `<mark>`. */
  import { highlightSegments } from "./browse.ts";

  interface Props {
    readonly text: string;
    readonly terms: readonly string[];
  }

  const { text, terms }: Props = $props();
  const segments = $derived(highlightSegments(text, terms));
</script>

{#each segments as s, i (i)}
  {#if s.match}
    <mark>{s.text}</mark>
  {:else}
    {s.text}
  {/if}
{/each}
