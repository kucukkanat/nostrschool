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
        <span class="mark" aria-hidden="true"></span>
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
          <span class="verdict" use:pop={{ spring: "wobbly" }}>
            <span aria-hidden="true">{result ? "🎉" : "🤔"}</span>
            {result ? t.correct : t.wrong}
          </span>
        {/key}
      {/if}
    </p>
  </div>
</fieldset>

<style>
  .quiz {
    margin: var(--space-xl) 0;
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    min-inline-size: 0;
  }
  .quiz[data-result="correct"] {
    border-color: var(--color-success-solid);
  }
  .quiz[data-result="wrong"] {
    border-color: var(--color-danger-solid);
  }
  .question {
    float: left;
    inline-size: 100%;
    padding: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
  .hint {
    clear: both;
    margin: var(--space-2xs) 0 var(--space-md);
    padding-top: var(--space-2xs);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .options {
    display: grid;
    gap: var(--space-xs);
  }
  .option {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    min-height: var(--size-touch-target);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    cursor: pointer;
    transition:
      border-color var(--motion-duration-fast) var(--motion-easing-standard),
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .option:hover:not(:has(input:disabled)) {
    border-color: var(--color-primary);
    translate: var(--space-3xs) 0;
  }
  .option.chosen {
    border-color: var(--color-primary);
    background: var(--color-primary-subtle);
  }
  .option[data-state="right"] {
    border-color: var(--color-success-solid);
    background: var(--color-success-subtle);
  }
  .option[data-state="wrong"] {
    border-color: var(--color-danger-solid);
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
    flex: none;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    margin-top: var(--space-3xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface);
    transition:
      scale var(--motion-duration-normal) var(--motion-easing-bounce),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  input[type="checkbox"] + .mark {
    border-radius: var(--radius-sm);
  }
  input:checked + .mark {
    background: var(--color-primary);
    border-color: var(--color-primary-active);
    box-shadow: inset 0 0 0 var(--space-3xs) var(--color-surface);
    scale: 1.15;
  }
  input:focus-visible + .mark {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
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
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .verdict {
    display: inline-flex;
    gap: var(--space-xs);
    color: var(--color-text);
  }
</style>
