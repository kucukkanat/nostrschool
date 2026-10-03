<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { pop, shake } from "../actions.ts";
  import { emit } from "../bus.ts";
  import { burstFrom } from "../lib/confetti.ts";
  import { gradeQuiz, toggleSelection } from "../lib/quiz.ts";
  import type { QuizProps } from "../types.ts";
  import Button from "./Button.svelte";

  const { testid, locale, question, options, multiple = false, onanswer }: QuizProps = $props();
  const t = $derived(getDictionary(locale).ui.quiz);
  const uid = $props.id();
  let selected = $state<readonly string[]>([]);
  let result = $state<boolean | undefined>(undefined);
  let root = $state<HTMLFieldSetElement>();
  const answered = $derived(result !== undefined);

  const check = () => {
    const correct = gradeQuiz(options, selected);
    result = correct;
    emit(correct ? "quiz:correct" : "quiz:wrong", { quizId: testid });
    onanswer?.(correct, selected);
    if (root === undefined) return;
    if (correct) void burstFrom(root);
    else shake(root);
  };
  const retry = () => {
    selected = [];
    result = undefined;
  };
  // Only the learner's own choices are marked, so a retry stays a real retry (no answer reveal).
  const verdict = (id: string, correct: boolean): "right" | "wrong" | undefined =>
    answered && selected.includes(id) ? (correct ? "right" : "wrong") : undefined;
</script>

<fieldset
  bind:this={root}
  class="quiz"
  data-testid={testid}
  data-result={result === undefined ? "pending" : result ? "correct" : "wrong"}
  aria-describedby="{uid}-hint"
>
  <legend class="question">{question}</legend>
  <p id="{uid}-hint" class="hint">{multiple ? t.selectMany : t.selectOne}</p>
  <div class="options">
    {#each options as option (option.id)}
      {@const state = verdict(option.id, option.correct)}
      <label class="option" data-state={state} class:chosen={selected.includes(option.id)}>
        <input
          type={multiple ? "checkbox" : "radio"}
          name="{uid}-options"
          value={option.id}
          data-testid="{testid}-option-{option.id}"
          checked={selected.includes(option.id)}
          disabled={answered}
          onchange={(e) =>
            (selected = toggleSelection(selected, option.id, e.currentTarget.checked, multiple))}
        >
        <span class="mark" aria-hidden="true"
          >{state === "right" ? "✓" : state === "wrong" ? "✗" : ""}</span
        >
        <span class="text">
          <span>{option.label}</span>
          {#if state !== undefined && option.explanation}
            <small class="explanation" data-testid="{testid}-explanation-{option.id}">
              {option.explanation}
            </small>
          {/if}
        </span>
      </label>
    {/each}
  </div>
  <div class="actions">
    {#if answered}
      <Button testid="{testid}-retry" variant="secondary" size="sm" onclick={retry}
        >{t.retry}</Button
      >
    {:else}
      <Button testid="{testid}-check" size="sm" disabled={selected.length === 0} onclick={check}>
        {t.check}
      </Button>
    {/if}
    <p class="feedback" data-testid="{testid}-feedback" aria-live="polite">
      {#if result !== undefined}
        {#key result}
          <!-- A rubber stamp: the glyph and the words carry the verdict, the tint only echoes it. -->
          <span class="verdict" data-verdict={result ? "right" : "wrong"} use:pop={{ from: 0.92 }}>
            <span class="glyph" aria-hidden="true">{result ? "✓" : "✗"}</span>
            {result ? t.correct : t.wrong}
          </span>
        {/key}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  /* A worksheet page: ink-outlined sheet, answer slips that lift under the pointer, and a stamped
     verdict. Right/wrong is always carried by a glyph + text, never by tint alone. */
  .quiz {
    min-inline-size: 0;
    margin: var(--space-xl) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }
  /* Mirrors tokens.breakpoint.sm (480px). */
  @media (min-width: 480px) {
    .quiz {
      padding: var(--space-lg);
    }
  }
  .question {
    float: left;
    inline-size: 100%;
    padding: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-snug);
    text-wrap: balance;
  }
  .hint {
    clear: both;
    margin: var(--space-2xs) 0 var(--space-md);
    padding-top: var(--space-2xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .options {
    display: grid;
    gap: var(--space-sm);
  }
  .option {
    --option-shadow: var(--shadow-pressed);
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    min-height: var(--size-touch-target);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--option-shadow);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  @media (hover: hover) {
    .option:hover:not(:has(input:disabled)) {
      --option-shadow: var(--shadow-pop-sm);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  /* "Selected" = ink outline + orange misregistration shadow (orange is never the line itself). */
  .option.chosen {
    --option-shadow: var(--shadow-accent);
    background: var(--color-primary-subtle);
  }
  .option[data-state="right"] {
    background: var(--color-success-subtle);
  }
  .option[data-state="wrong"] {
    background: var(--color-danger-subtle);
  }
  .option:has(input:disabled) {
    cursor: default;
  }
  input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: inherit;
  }
  .mark {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    margin-top: var(--space-3xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-raised);
    color: var(--color-on-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-black);
    line-height: 1;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  input[type="checkbox"] + .mark {
    border-radius: var(--radius-sm);
  }
  input:checked + .mark {
    background: var(--color-primary);
  }
  /* An empty checked mark gets an inner paper ring, so "checked" isn't signalled by orange alone. */
  input:checked + .mark:empty {
    box-shadow: inset 0 0 0 var(--space-2xs) var(--color-surface-raised);
    background: var(--color-text);
  }
  input:focus-visible + .mark {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .option[data-state="right"] .mark {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  .option[data-state="wrong"] .mark {
    background: var(--color-danger-solid);
    color: var(--color-on-danger);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  .explanation {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-md);
    margin-top: var(--space-md);
  }
  .feedback {
    margin: 0;
    min-block-size: var(--size-control-sm);
    display: flex;
    align-items: center;
  }
  .verdict {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-3xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-letter-spacing-wide);
    text-transform: uppercase;
    rotate: -2deg;
  }
  .verdict[data-verdict="right"] {
    background: var(--color-success-subtle);
  }
  .verdict[data-verdict="wrong"] {
    background: var(--color-danger-subtle);
  }
  .glyph {
    font-weight: var(--font-weight-black);
  }
</style>
