<script lang="ts">
  /** "What if…" toggles: bad days vs. each network, plus Nostr precautions that soften them. */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Mascot, type MascotPose } from "@nostrschool/mascot";
  import { emit, pop, Toggle } from "@nostrschool/ui";
  import { mascotRive } from "~/lib/href";
  import {
    evaluate,
    type MascotMood,
    mascotMood,
    PREPS,
    type PrepId,
    SCENARIOS,
    type ScenarioId,
    SEVERITIES,
    severityLevel,
    toggleIn,
  } from "./scenarios.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch12);
  const ts = $derived(t.scenarios);

  let active = $state.raw<ReadonlySet<ScenarioId>>(new Set<ScenarioId>(["lostKey"]));
  let preps = $state.raw<ReadonlySet<PrepId>>(new Set());

  const reports = $derived(evaluate(active, preps));
  const nostr = $derived(reports[0]?.overall ?? "fine");
  const mood = $derived(mascotMood(nostr, preps));
  const POSES: Readonly<Record<MascotMood, MascotPose>> = {
    calm: "idle",
    worried: "think",
    panic: "panic",
    prepared: "cheer",
  };

  const narration = $derived(
    active.size === 0
      ? ts.allClear
      : format(
          ts.narration,
          Object.fromEntries(reports.map((r) => [r.platform, ts.severities[r.overall]])),
        ),
  );

  const setPrep = (id: PrepId, on: boolean) => {
    const next = toggleIn(preps, id, on);
    const before = mascotMood(nostr, preps);
    preps = next;
    const after = mascotMood(evaluate(active, next)[0]?.overall ?? "fine", next);
    if (after === "prepared" && before !== "prepared")
      emit("celebrate", { reason: "ch12-prepared" });
  };
</script>

<section class="scenarios" data-testid="ch12-scenarios" aria-labelledby="ch12-scenarios-title">
  <header class="head">
    <div>
      <h3 id="ch12-scenarios-title" class="title">{ts.title}</h3>
      <p class="intro">{ts.intro}</p>
    </div>
    <div class="mascot" data-testid="ch12-scenarios-mood" data-mood={mood}>
      <Mascot
        {locale}
        size="sm"
        pose={POSES[mood]}
        say={ts.mascot[mood]}
        announce={false}
        testid="ch12-mascot"
        {...mascotRive}
      />
    </div>
  </header>

  <div class="switches">
    <fieldset class="group">
      <legend class="legend">{ts.whatIfLabel}</legend>
      {#each SCENARIOS as s (s)}
        <Toggle
          testid="ch12-scenario-{s}"
          label={ts.items[s].label}
          description={ts.items[s].description}
          checked={active.has(s)}
          onchange={(on) => (active = toggleIn(active, s, on))}
        />
      {/each}
    </fieldset>
    <fieldset class="group prep">
      <legend class="legend">{ts.prepLabel}</legend>
      <p class="hint">{ts.prepHint}</p>
      {#each PREPS as p (p)}
        <Toggle
          testid="ch12-prep-{p}"
          label={ts.preps[p].label}
          description={ts.preps[p].description}
          checked={preps.has(p)}
          onchange={(on) => setPrep(p, on)}
        />
      {/each}
    </fieldset>
  </div>

  <ul class="cards">
    {#each reports as r (r.platform)}
      <li
        class="card {r.overall}"
        class:nostr={r.platform === "nostr"}
        data-testid="ch12-outcome-{r.platform}"
        data-severity={r.overall}
      >
        <div class="card-head">
          <strong class="platform">{t.platforms[r.platform]}</strong>
          {#key r.overall}
            <span class="badge {r.overall}" data-testid="ch12-outcome-{r.platform}-badge" use:pop>
              {ts.severities[r.overall]}
            </span>
          {/key}
        </div>
        <div class="meter" aria-hidden="true">
          {#each SEVERITIES.slice(1) as level, i (level)}
            <span class="seg" class:on={severityLevel(r.overall) * 3 > i}></span>
          {/each}
        </div>
        {#if r.outcomes.length === 0}
          <p class="empty">{ts.allClear}</p>
        {:else}
          <ul class="lines">
            {#each r.outcomes as o (o.scenario)}
              <li
                class="line {o.severity}"
                data-testid="ch12-outcome-{r.platform}-{o.scenario}"
                use:pop
              >
                <span class="dot" aria-hidden="true"></span>
                <span>
                  <span class="visually-hidden">{ts.severities[o.severity]}:</span>
                  {r.platform === "nostr"
                    ? ts.outcomes.nostr[o.key]
                    : ts.outcomes[r.platform][o.scenario]}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>

  <p class="visually-hidden" aria-live="polite" data-testid="ch12-scenarios-narration">
    {narration}
  </p>
</section>

<style>
  .scenarios {
    display: grid;
    gap: var(--space-lg);
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .intro,
  .hint {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .mascot {
    min-block-size: var(--size-mascot-sm);
  }
  .switches {
    display: grid;
    gap: var(--space-lg);
  }
  .group {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: var(--space-md);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
    min-inline-size: 0;
  }
  .prep {
    background: var(--color-primary-subtle);
  }
  .legend {
    padding: 0 var(--space-2xs);
    font-weight: var(--font-weight-bold);
  }
  .cards {
    display: grid;
    gap: var(--space-md);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .card {
    display: grid;
    gap: var(--space-xs);
    align-content: start;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    transition:
      border-color var(--motion-duration-normal) var(--motion-easing-standard),
      box-shadow var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .card.nostr {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
  }
  .card.disaster {
    box-shadow: var(--shadow-pop-sm);
  }
  .card-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }
  .platform {
    font-size: var(--font-size-lg);
  }
  .badge {
    display: inline-block;
    padding: var(--space-3xs) var(--space-sm);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  .badge.fine {
    background: var(--color-success-subtle);
    color: var(--color-success);
  }
  .badge.bumpy {
    background: var(--color-info-subtle);
    color: var(--color-info);
  }
  .badge.ouch {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }
  .badge.disaster {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
  }
  .meter {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3xs);
  }
  .seg {
    block-size: var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    transition: background-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .fine .seg.on,
  .bumpy .seg.on {
    background: var(--color-info-solid);
  }
  .ouch .seg.on {
    background: var(--color-warning-solid);
  }
  .disaster .seg.on {
    background: var(--color-danger-solid);
  }
  .lines {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-sm);
  }
  .line {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-xs);
    align-items: baseline;
  }
  .dot {
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border-radius: var(--radius-round);
    background: currentColor;
  }
  .line.fine .dot {
    color: var(--color-success);
  }
  .line.bumpy .dot {
    color: var(--color-info);
  }
  .line.ouch .dot {
    color: var(--color-warning);
  }
  .line.disaster .dot {
    color: var(--color-danger);
  }
  .empty {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .switches {
      grid-template-columns: 1fr 1fr;
    }
    .cards {
      grid-template-columns: 1fr 1fr;
    }
  }
  /* tokens.breakpoint.sm = 480px: a tighter frame so phones (320-414px) keep room for content. */
  @media (max-width: 480px) {
    .scenarios {
      padding: var(--space-md);
    }
  }
</style>
