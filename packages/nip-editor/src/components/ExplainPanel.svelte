<script lang="ts">
  import { format } from "@nostrschool/i18n";
  import type { JsonPath } from "@nostrschool/nips";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import { issueMessage } from "../logic/validate.ts";
  import type { ExplainPanelProps } from "../types.ts";

  const { testid, locale, nip, target, locate, onselectpath }: ExplainPanelProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const message = $derived(issueMessage(locale));
  const own = $derived(hasNipText(nip, target?.explain) ? target?.explain : undefined);
  const samePath = (a: JsonPath, b: JsonPath) =>
    a.length === b.length && a.every((p, k) => p === b[k]);
  /**
   * Issues below the selected node (all of them when the root is selected) say where they are, so
   * a phone user, who cannot hover the JSON squiggles, can tell which field is wrong and jump to it.
   */
  const where = (path: JsonPath): string | undefined =>
    target === undefined || path.length === 0 || samePath(path, target.path)
      ? undefined
      : locate?.(path) || path.join(" › ");
  const enumValues = $derived(target?.field?.type === "enum" ? target.field.values : []);
</script>

<section class="explain" data-testid={testid} aria-live="polite" aria-labelledby="{testid}-title">
  {#if target === undefined}
    <h3 class="title" id="{testid}-title" data-testid="{testid}-title">{t.explain.title}</h3>
    <p class="empty" data-testid="{testid}-body">{t.explain.empty}</p>
  {:else}
    <h3 class="title" id="{testid}-title" data-testid="{testid}-title">
      {#if target.breadcrumb.length === 0}
        {t.explain.title}
      {:else}
        {#each target.breadcrumb as crumb, i (i)}
          {#if i > 0}
            <span class="sep" aria-hidden="true">›</span>
          {/if}
          <code>{crumb}</code>
        {/each}
      {/if}
    </h3>
    <dl class="facts" data-testid="{testid}-type">
      {#if target.field !== undefined}
        <dt>{t.explain.type}</dt>
        <dd>{t.fieldTypes[target.field.type]}</dd>
      {:else if target.schemaType !== undefined}
        <dt>{t.explain.type}</dt>
        <dd>{t.schemaTypes[target.schemaType]}</dd>
      {/if}
      {#if target.tag !== undefined}
        <dt>{t.explain.field}</dt>
        <dd>
          <code>{target.tag.name}</code>
          ·
          {t.presence[target.tag.presence]}
          {#if target.tag.repeatable}
            · {t.tags.repeatable}
          {/if}
        </dd>
      {/if}
    </dl>
    <div class="body" data-testid="{testid}-body">
      {#if own !== undefined}
        <p>{text(own)}</p>
      {/if}
      {#if target.builtin !== undefined}
        <p class:muted={own !== undefined}>{t.builtin[target.builtin]}</p>
      {/if}
      {#if own === undefined && target.builtin === undefined}
        <p class="muted">{t.explain.noText}</p>
      {/if}
      {#if enumValues.length > 0}
        <p class="allowed-title">{t.explain.allowed}</p>
        <ul class="allowed">
          {#each enumValues as option (option.value)}
            <li>
              <code>{option.value}</code>
              {#if hasNipText(nip, option.explain)}
                — {text(option.explain)}
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if target.rules !== undefined}
      <section class="rules" data-testid="{testid}-rules" aria-labelledby="{testid}-rules-title">
        <p class="rules-title" id="{testid}-rules-title">{t.explain.rules}</p>
        {#each target.rules as rule, i (i)}
          {@const met = rule.present.length > 0}
          <div class="rule" data-testid="{testid}-rule-{i}" data-met={met}>
            <p>{text(rule.explain)}</p>
            <p>
              {t.explain.anyOf}
              {#each rule.tags as name (name)}
                {" "}<code class:present={rule.present.includes(name)}>{name}</code>
              {/each}
            </p>
            <p class="status">
              {met
                ? format(t.explain.ruleMet, { tags: rule.present.join(", ") })
                : t.explain.ruleUnmet}
            </p>
          </div>
        {/each}
      </section>
    {/if}
    {#if target.issues.length > 0}
      <ul class="issues" data-testid="{testid}-issues">
        {#each target.issues as issue, i (i)}
          {@const at = where(issue.path)}
          <li data-severity={issue.severity}>
            {#if at !== undefined && onselectpath !== undefined}
              <button
                type="button"
                class="jump"
                data-testid="{testid}-issue-{i}"
                title={format(t.explain.goTo, { field: at })}
                onclick={() => onselectpath(issue.path)}
              >
                <span class="sev" aria-hidden="true">{issue.severity === "info" ? "i" : "!"}</span>
                <span><code class="at">{at}</code>: {message(issue)}</span>
              </button>
            {:else}
              <span class="sev" aria-hidden="true">{issue.severity === "info" ? "i" : "!"}</span>
              <span>
                {#if at !== undefined}
                  <code class="at">{at}</code>:
                {/if}
                {message(issue)}
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  /* An index card clipped to the notebook: ruled top edge, ink outline, hard shadow. */
  .explain {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-block-start-width: var(--border-width-heavy);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
    min-inline-size: 0;
  }
  .title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2xs);
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    overflow-wrap: anywhere;
  }
  .title code {
    padding: 0 var(--space-3xs);
    background: var(--color-highlight);
    color: var(--color-on-highlight);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  .sep {
    color: var(--color-text-subtle);
  }
  .facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-3xs) var(--space-sm);
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .facts:empty {
    display: none;
  }
  dt {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }
  dd {
    margin: 0;
  }
  .facts code {
    font-family: var(--font-family-mono);
  }
  .body p {
    margin: 0 0 var(--space-xs);
    line-height: var(--font-line-height-relaxed);
  }
  .muted,
  .empty {
    color: var(--color-text-muted);
  }
  .empty {
    margin: 0;
  }
  .allowed-title {
    font-weight: var(--font-weight-semibold);
  }
  .allowed {
    margin: 0;
    padding-inline-start: var(--space-md);
    font-size: var(--font-size-sm);
  }
  .allowed code {
    font-family: var(--font-family-mono);
  }
  .rules {
    display: grid;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
  }
  .rules-title {
    margin: 0;
    font-weight: var(--font-weight-semibold);
  }
  .rule {
    padding: var(--space-2xs) var(--space-xs);
    border-inline-start: var(--border-width-thick) solid var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .rule[data-met="true"] {
    border-color: var(--color-success);
    background: var(--color-success-subtle);
  }
  .rule p {
    margin: 0 0 var(--space-3xs);
    line-height: var(--font-line-height-relaxed);
  }
  .rule code {
    padding: 0 var(--space-3xs);
    font-family: var(--font-family-mono);
  }
  .rule code.present {
    background: var(--color-highlight);
    color: var(--color-on-highlight);
  }
  .status {
    font-weight: var(--font-weight-semibold);
  }
  .issues {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-sm);
  }
  .issues li {
    display: flex;
    gap: var(--space-xs);
    align-items: baseline;
    padding: var(--space-2xs) var(--space-xs);
    border-inline-start: var(--border-width-thick) solid var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .issues li[data-severity="warning"] {
    border-color: var(--color-warning);
    background: var(--color-warning-subtle);
  }
  .issues li[data-severity="info"] {
    border-color: var(--color-info);
    background: var(--color-info-subtle);
  }
  .at {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-semibold);
    overflow-wrap: anywhere;
  }
  .jump {
    display: flex;
    gap: var(--space-xs);
    align-items: baseline;
    inline-size: 100%;
    min-block-size: var(--size-control-sm);
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .jump:hover .at,
  .jump:focus-visible .at {
    text-decoration: underline;
  }
  .jump:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  @media (pointer: coarse) {
    .jump {
      min-block-size: var(--size-touch-target);
    }
  }
  .sev {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
  }
</style>
