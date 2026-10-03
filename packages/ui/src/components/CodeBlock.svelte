<script lang="ts">
  import { highlightLines } from "../lib/highlight.ts";
  import type { CodeBlockProps } from "../types.ts";
  import CopyButton from "./CopyButton.svelte";

  const {
    testid,
    locale,
    code,
    lang = "text",
    caption,
    highlightLines: emphasized = [],
    copyable = true,
  }: CodeBlockProps = $props();
  const lines = $derived(highlightLines(code, lang));
  const marked = $derived(new Set(emphasized));
</script>

<figure class="code" data-testid={testid} data-lang={lang}>
  {#if caption}
    <figcaption data-testid="{testid}-caption">{caption}</figcaption>
  {/if}
  <div class="tools">
    <span class="lang" aria-hidden="true">{lang}</span>
    {#if copyable}
      <CopyButton testid="{testid}-copy" {locale} value={code} confetti />
    {/if}
  </div>
  <!-- Scrollable region must be focusable so keyboard users can scroll long lines. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable regions must be keyboard reachable (axe scrollable-region-focusable) -->
  <pre tabindex="0"><code>{#each lines as line, i (i)}<span
          class="line"
          class:hl={marked.has(i + 1)}
          data-testid={marked.has(i + 1) ? `${testid}-line-${i + 1}` : undefined}
          >{#each line as token, j (j)}<span class="t-{token.type}">{token.text}</span>{/each}</span
        >{"\n"}{/each}</code></pre>
</figure>

<style>
  .code {
    margin: var(--space-lg) 0;
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .code {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "caption tools"
      "code code";
  }
  figcaption {
    grid-area: caption;
    align-self: center;
    padding: var(--space-2xs) var(--space-md);
    font-family: var(--font-family-body);
    font-size: var(--font-size-sm);
  }
  .tools {
    grid-area: tools;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-xs);
  }
  .lang {
    color: var(--color-code-punctuation);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  pre {
    grid-area: code;
    margin: 0;
    border-top: var(--border-width-thin) solid var(--color-code-punctuation);
    padding: var(--space-md) 0;
    overflow-x: auto;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-relaxed);
    tab-size: 2;
  }
  pre:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: calc(-1 * var(--border-width-thick));
  }
  .line {
    display: inline-block;
    min-width: 100%;
    padding: 0 var(--space-md);
    border-left: var(--border-width-heavy) solid transparent;
  }
  .hl {
    background: var(--color-code-highlight);
    border-left-color: var(--color-primary);
  }
  .t-key {
    color: var(--color-code-key);
  }
  .t-string {
    color: var(--color-code-string);
  }
  .t-number {
    color: var(--color-code-number);
  }
  .t-boolean,
  .t-keyword {
    color: var(--color-code-boolean);
  }
  .t-null,
  .t-comment {
    color: var(--color-code-null);
  }
  .t-comment {
    font-style: italic;
  }
  .t-punctuation {
    color: var(--color-code-punctuation);
  }
</style>
