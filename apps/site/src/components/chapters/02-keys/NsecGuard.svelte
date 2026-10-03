<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Badge, Button, emit, pop, shake } from "@nostrschool/ui";
  import {
    allSafe,
    judgeShare,
    SHARE_REQUESTS,
    type ShareChoice,
    type ShareRequest,
    type ShareVerdict,
  } from "./keys-logic.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch02.guard);

  type Verdicts = Partial<Record<ShareRequest["id"], ShareVerdict>>;
  let verdicts = $state<Verdicts>({});
  const safeCount = $derived(SHARE_REQUESTS.filter((r) => verdicts[r.id] === "safe").length);
  const perfect = $derived(allSafe(verdicts));

  const decide = (request: ShareRequest, choice: ShareChoice, event: MouseEvent) => {
    const verdict = judgeShare(request.asks, choice);
    verdicts = { ...verdicts, [request.id]: verdict };
    const card =
      event.currentTarget instanceof HTMLElement ? event.currentTarget.closest("li") : null;
    if (verdict === "danger") {
      if (card !== null) shake(card);
      emit("warning", { reason: `ch02-nsec-shared-${request.id}` });
    } else emit("quiz:correct", { quizId: `ch02-guard-${request.id}` });
    if (allSafe(verdicts)) emit("celebrate", { reason: "ch02-guard-perfect" });
  };

  const reset = () => {
    verdicts = {};
  };
</script>

<section class="guard" data-testid="ch02-guard" aria-labelledby="ch02-guard-title">
  <h3 id="ch02-guard-title" class="title">{t.title}</h3>
  <p class="desc">{t.description}</p>
  <ul class="cards">
    {#each SHARE_REQUESTS as request (request.id)}
      {@const verdict = verdicts[request.id]}
      {@const copy = t.requests[request.id]}
      <li class="card" data-testid="ch02-guard-{request.id}" data-verdict={verdict ?? "pending"}>
        <div class="who">
          <strong>{copy.who}</strong>
          <Badge
            testid="ch02-guard-{request.id}-asks"
            tone={request.asks === "nsec" ? "danger" : "success"}
            size="sm"
            >{format(t.asks, { key: request.asks })}</Badge
          >
        </div>
        <p class="msg">“{copy.message}”</p>
        {#if verdict === undefined}
          <div class="actions">
            <Button
              testid="ch02-guard-{request.id}-share"
              variant="secondary"
              size="sm"
              onclick={(e) => decide(request, "share", e)}
              >{t.share}</Button
            >
            <Button
              testid="ch02-guard-{request.id}-refuse"
              variant="ghost"
              size="sm"
              onclick={(e) => decide(request, "refuse", e)}
              >{t.refuse}</Button
            >
          </div>
        {:else}
          <p
            class="verdict {verdict}"
            role="status"
            data-testid="ch02-guard-{request.id}-verdict"
            use:pop
          >
            <span aria-hidden="true"
              >{verdict === "danger" ? "!" : verdict === "safe" ? "✓" : "ℹ"}</span
            >
            {t.verdicts[verdict]}
            {t.explain[request.asks]}
          </p>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="footer">
    <p class="score" aria-live="polite" data-testid="ch02-guard-score">
      {perfect ? t.allDone : format(t.score, { safe: safeCount, total: SHARE_REQUESTS.length })}
    </p>
    <Button testid="ch02-guard-reset" variant="ghost" size="sm" onclick={reset}>{t.reset}</Button>
  </div>
</section>

<style>
  .guard {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
  }
  .cards {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: 1fr;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .card {
    display: grid;
    gap: var(--space-xs);
    align-content: start;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    transition:
      border-color var(--motion-duration-normal) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .card[data-verdict="safe"] {
    border-color: var(--color-success);
  }
  .card[data-verdict="danger"] {
    border-color: var(--color-danger);
  }
  .card[data-verdict="overcautious"] {
    border-color: var(--color-info);
  }
  .who {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    justify-content: space-between;
    color: var(--color-text);
    font-family: var(--font-family-display);
  }
  .msg {
    margin: 0;
    color: var(--color-text);
    font-style: italic;
  }
  .actions,
  .footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }
  .footer {
    justify-content: space-between;
  }
  .verdict {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
  .verdict.safe {
    background: var(--color-success-subtle);
  }
  .verdict.danger {
    background: var(--color-danger-subtle);
  }
  .verdict.overcautious {
    background: var(--color-info-subtle);
  }
  .score {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }
  /* tokens.breakpoint.sm = 480px: a tighter frame so phones (320-414px) keep room for content. */
  @media (max-width: 480px) {
    .guard {
      padding: var(--space-md);
    }
  }
</style>
