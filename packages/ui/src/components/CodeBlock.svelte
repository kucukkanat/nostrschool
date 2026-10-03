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
  /* A clipped printout: sunken paper, ink outline, mono type. The header strip carries the caption,
     a mono language tag and the copy button; the code scrolls inside itself, never the page. */
  .code {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "caption tools"
      "code code";
    min-inline-size: 0;
    margin: var(--space-lg) 0;
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    overflow: hidden;
    box-shadow: var(--shadow-pop-sm);
  }
  figcaption {
    grid-area: caption;
    align-self: center;
    min-inline-size: 0;
    padding: var(--space-2xs) var(--space-md);
    font-family: var(--font-family-body);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    overflow-wrap: anywhere;
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
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  pre {
    grid-area: code;
    margin: 0;
    border-top: var(--border-width-thin) dashed var(--color-border-strong);
    border-radius: 0;
    padding: var(--space-sm) 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    background: transparent;
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
  /* Highlighter on the line, with an accent-ink tick in the margin (orange itself is a fill only). */
  .hl {
    background: var(--color-code-highlight);
    border-left-color: var(--color-text-primary);
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
