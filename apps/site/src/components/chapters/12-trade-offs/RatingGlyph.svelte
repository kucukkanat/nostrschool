<script lang="ts">
  /** Shape carries the rating (full / half / empty) so color is never the only cue. */
  import type { RatingName } from "./matrix.ts";

  const { rating }: { readonly rating: RatingName } = $props();
</script>

<svg class="glyph {rating}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
  <circle class="ring" cx="10" cy="10" r="7.5" />
  {#if rating === "good"}
    <circle class="fill" cx="10" cy="10" r="7.5" />
  {:else if rating === "mixed"}
    <path class="fill" d="M10 2.5 A7.5 7.5 0 0 1 10 17.5 Z" />
  {/if}
</svg>

<style>
  .glyph {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    flex: none;
  }
  .ring {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
  }
  .fill {
    fill: currentColor;
  }
  .good {
    color: var(--color-success);
  }
  .mixed {
    color: var(--color-warning);
  }
  .poor {
    color: var(--color-danger);
  }
</style>
