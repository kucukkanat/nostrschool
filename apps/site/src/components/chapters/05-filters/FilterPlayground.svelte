<script lang="ts">
  /** /tools/filter-playground: the chapter builder with a JSON editor, plus a REQ runner. */
  import type { Locale } from "@nostrschool/i18n";
  import FilterBuilder from "./FilterBuilder.svelte";
  import { draftToFilter, EMPTY_DRAFT, type FilterDraft } from "./filter-logic.ts";
  import RelayRunner from "./RelayRunner.svelte";

  interface Props {
    readonly locale: Locale;
    readonly testid?: string;
  }

  const { locale, testid = "ch05-playground" }: Props = $props();
  let draft = $state<FilterDraft>(EMPTY_DRAFT);
</script>

<div data-testid={testid}>
  <FilterBuilder {locale} testid="{testid}-builder" bind:draft editor headingLevel={2} />
  <RelayRunner {locale} testid="{testid}-runner" filter={draftToFilter(draft)} />
</div>
