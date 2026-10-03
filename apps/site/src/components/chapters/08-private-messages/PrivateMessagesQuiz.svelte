<script lang="ts">
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { Quiz } from "@nostrschool/ui";
  import { quizQuestions } from "./quiz.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch08.quiz);
  const questions = $derived(quizQuestions(t));
</script>

<section class="quiz" data-testid="ch08-quiz" aria-labelledby="ch08-quiz-title">
  <h3 id="ch08-quiz-title" class="title">{t.title}</h3>
  {#each questions as q (q.id)}
    <Quiz testid="ch08-quiz-{q.id}" {locale} question={q.question} options={q.options} />
  {/each}
</section>

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
</style>
