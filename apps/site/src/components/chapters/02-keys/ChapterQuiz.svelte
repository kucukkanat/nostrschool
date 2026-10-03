<script lang="ts">
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { Quiz } from "@nostrschool/ui";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch02.quiz);
  // Which option is right lives here (logic), the words live in i18n (content).
  const CORRECT = { q1: "b", q2: "a", q3: "c" } as const;
  const IDS = ["q1", "q2", "q3"] as const;
  const OPTION_IDS = ["a", "b", "c"] as const;
</script>

<div class="quizzes" data-testid="ch02-quiz">
  {#each IDS as id (id)}
    {@const q = t[id]}
    <Quiz
      testid="ch02-quiz-{id}"
      {locale}
      question={q.question}
      options={OPTION_IDS.map((o) => ({
        id: o,
        label: q.options[o].label,
        explanation: q.options[o].explanation,
        correct: CORRECT[id] === o,
      }))}
    />
  {/each}
</div>

<style>
  .quizzes {
    display: grid;
    gap: var(--space-lg);
  }
</style>
