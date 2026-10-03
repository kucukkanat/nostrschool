<script lang="ts">
  import type { VisuallyHiddenProps } from "../types.ts";

  const { as = "span", testid, children, ...rest }: VisuallyHiddenProps = $props();
</script>

<!-- One shared screen-reader-only primitive instead of a hand-copied clip rule per component. -->
<svelte:element this={as} class="visually-hidden" data-testid={testid} {...rest}
  >{@render children()}</svelte:element
>

<style>
  .visually-hidden {
    position: absolute;
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    margin: calc(var(--border-width-thin) * -1);
    padding: 0;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
