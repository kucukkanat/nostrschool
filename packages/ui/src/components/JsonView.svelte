<script lang="ts">
  import { getDictionary, plural } from "@nostrschool/i18n";
  import { containsHighlight, type JsonNode, toJsonTree } from "../lib/json.ts";
  import type { JsonViewProps } from "../types.ts";

  const {
    testid,
    locale,
    value,
    highlightPaths = [],
    collapsedDepth,
    onselectpath,
  }: JsonViewProps = $props();
  const t = $derived(getDictionary(locale).ui.json);
  const tree = $derived(toJsonTree(value));
  const highlights = $derived(new Set(highlightPaths));
  /** User overrides of the default expansion, keyed by path. */
  let toggled = $state<Readonly<Record<string, boolean>>>({});

  const isOpen = (node: JsonNode): boolean =>
    toggled[node.path] ??
    (collapsedDepth === undefined ||
      node.depth < collapsedDepth ||
      // Never hide what the lesson is pointing at.
      containsHighlight(node.path, highlightPaths));
  const toggle = (node: JsonNode) => {
    toggled = { ...toggled, [node.path]: !isOpen(node) };
  };
  const partId = (path: string) => (path === "" ? `${testid}-root` : `${testid}-path-${path}`);
</script>

{#snippet keyLabel(
  node: JsonNode,
)}
  {#if typeof node.key === "string"}
    <span class="key">"{node.key}"</span><span class="p">: </span>
  {/if}
{/snippet}

{#snippet valueNode(
  node: JsonNode,
  last: boolean,
)}
  {@const hl = highlights.has(node.path)}
  {#if node.kind === "leaf"}
    <span class="row" class:hl>
      {@render keyLabel(node)}
      {#if onselectpath}
        <button
          type="button"
          class="leaf {node.type} selectable"
          data-testid={partId(node.path)}
          data-path={node.path}
          onclick={() => onselectpath(node.path)}
        >
          {node.text}
        </button>
      {:else}
        <span class="leaf {node.type}" data-testid={partId(node.path)} data-path={node.path}
          >{node.text}</span
        >
      {/if}
      {#if !last}
        <span class="p">,</span>
      {/if}
    </span>
  {:else}
    {@const open = isOpen(node)}
    {@const [o, c] = node.type === "array" ? ["[", "]"] : ["{", "}"]}
    <span
      class="row branch"
      class:hl
      data-testid={partId(node.path)}
      data-path={node.path}
      data-open={open}
    >
      {#if node.children.length > 0}
        <button
          type="button"
          class="twisty"
          data-testid="{testid}-toggle-{node.path === "" ? "root" : node.path}"
          aria-expanded={open}
          aria-label={open ? t.collapse : t.expand}
          onclick={() => toggle(node)}
        >
          <span aria-hidden="true">▸</span>
        </button>
      {/if}
      {@render keyLabel(node)}
      {#if onselectpath && node.path !== ""}
        <button
          type="button"
          class="p selectable"
          data-testid="{testid}-select-{node.path}"
          onclick={() => onselectpath(node.path)}
        >
          {o}
        </button>
      {:else}
        <span class="p">{o}</span>
      {/if}
      {#if open && node.children.length > 0}
        <span class="children">
          {#each node.children as child, i (child.path)}
            {@render valueNode(child, i === node.children.length - 1)}
          {/each}
        </span>
      {:else if node.children.length > 0}
        <button
          type="button"
          class="summary"
          data-testid="{testid}-summary-{node.path === "" ? "root" : node.path}"
          onclick={() => toggle(node)}
        >
          … {plural(locale, node.children.length, t.items)}
        </button>
      {/if}
      <span class="p">{c}</span>
      {#if !last}
        <span class="p">,</span>
      {/if}
    </span>
  {/if}
{/snippet}

<pre class="json" data-testid={testid}><code>{@render valueNode(tree, true)}</code></pre>

<style>
  .json {
    /* Own stacking context so the highlighter swipe (z-index -1) paints above this background. */
    isolation: isolate;
    min-inline-size: 0;
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-relaxed);
    /* Markup indentation must not leak into the output; values keep their own spaces. */
    white-space: normal;
  }
  .leaf,
  .key {
    white-space: pre-wrap;
  }
  .row {
    display: block;
    position: relative;
    border-radius: var(--radius-sm);
  }
  .children {
    display: block;
    padding-left: var(--space-md);
  }
  /* Mirrors tokens.breakpoint.sm (480px): deeper indents once a phone's width isn't the limit. */
  @media (min-width: 480px) {
    .children {
      padding-left: var(--space-lg);
    }
  }
  /* Highlighter pen: the marker swipes left to right once, then stays; an accent-ink tick marks the
     margin so the highlight doesn't rely on the fill colour alone. */
  .hl {
    box-shadow: inset var(--border-width-heavy) 0 0 var(--color-text-primary);
  }
  .hl::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: var(--color-code-highlight);
    transform-origin: left center;
    animation: swipe var(--motion-duration-slower) var(--motion-easing-decelerate);
  }
  @keyframes swipe {
    from {
      scale: 0 1;
    }
  }
  .key {
    color: var(--color-code-key);
  }
  .string {
    color: var(--color-code-string);
    overflow-wrap: anywhere;
  }
  .number {
    color: var(--color-code-number);
  }
  .boolean {
    color: var(--color-code-boolean);
  }
  .null {
    color: var(--color-code-null);
  }
  .p {
    color: var(--color-code-punctuation);
  }
  button {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    text-align: start;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .selectable {
    border-radius: var(--radius-sm);
    text-decoration: underline dotted var(--border-width-medium) currentColor;
    text-underline-offset: var(--space-3xs);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  @media (hover: hover) {
    .selectable:hover {
      background: var(--color-code-highlight);
      text-decoration-style: solid;
    }
  }
  .twisty {
    position: relative;
    display: inline-block;
    inline-size: var(--size-icon-sm);
    margin-left: calc(-1 * var(--size-icon-sm));
    color: var(--color-code-punctuation);
  }
  .twisty span {
    display: inline-block;
    transition: rotate var(--motion-duration-normal) var(--motion-easing-standard);
  }
  [data-open="true"] > .twisty span {
    rotate: 0.25turn;
  }
  /* Rows stay compact for reading; on touch the tiny controls get an invisible fingertip-sized
     hit area instead of 44px-tall rows. */
  @media (pointer: coarse) {
    .twisty::after,
    .selectable::after,
    .summary::after {
      content: "";
      position: absolute;
      inset-block: calc(-1 * var(--space-sm));
      inset-inline: calc(-1 * var(--space-xs));
    }
    .selectable,
    .summary {
      position: relative;
    }
  }
  .summary {
    color: var(--color-code-null);
    font-style: italic;
    text-decoration: underline dotted var(--border-width-medium) currentColor;
    text-underline-offset: var(--space-3xs);
  }
  button:focus-visible {
    outline: var(--border-width-medium) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
</style>
