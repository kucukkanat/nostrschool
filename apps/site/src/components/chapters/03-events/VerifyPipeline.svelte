<script lang="ts">
  import { Pipeline } from "@nostrschool/diagrams";
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { duration, $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import { untrack } from "svelte";
  import { finalStage, pipelineStages } from "./describe.ts";
  import type { VerifyView } from "./lab.ts";

  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly view: VerifyView;
    /** Bump to replay the animation for the current `view`. */
    readonly run: number;
    /** Delay between stages; defaults to the "slower" motion token (0 under reduced motion). */
    readonly stepMs?: number;
    /** Called once the animation reaches its verdict. */
    readonly onsettle?: (view: VerifyView) => void;
  }

  const { testid, locale, view, run, stepMs, onsettle }: Props = $props();
  const p = $derived(getDictionary(locale).chapters.ch03.pipeline);

  let active = $state(-1);
  let settled = $state(false);
  const status = $derived(settled ? view.status : active < 0 ? "idle" : "running");
  // Reveal values up to the highlighted stage while running; everything once settled.
  const stages = $derived(pipelineStages(locale, view, settled ? finalStage(view) : active));

  $effect(() => {
    void run;
    const target = untrack(() => finalStage(view));
    const delay = untrack(() => stepMs ?? duration("slower", $reducedMotion));
    const settle = () => {
      active = target;
      settled = true;
      untrack(() => onsettle?.(view));
    };
    settled = false;
    if (delay === 0) {
      settle();
      return;
    }
    // One stage per tick: the eye follows the data flowing through the pipeline.
    active = 0;
    const timer = setInterval(() => {
      if (active >= target) {
        clearInterval(timer);
        settle();
      } else active += 1;
    }, delay);
    return () => clearInterval(timer);
  });
</script>

<div class="verify" data-testid="{testid}-wrap" data-status={status}>
  <Pipeline
    {testid}
    {locale}
    title={p.title}
    description={p.description}
    {stages}
    bind:active
    {status}
    {...view.errorAt === undefined ? {} : { errorAt: view.errorAt }}
  />
</div>

<style>
  .verify {
    min-height: var(--size-diagram-min-height);
  }
</style>
