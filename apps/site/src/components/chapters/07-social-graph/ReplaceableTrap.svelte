<script lang="ts">
  import { getPersona, type PersonaId } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Button, emit, JsonView, pop, shake } from "@nostrschool/ui";
  import {
    CANDIDATES,
    type Device,
    followsInEvent,
    lostFollows,
    OWNER,
    type Published,
    publish,
    relayKeeps,
    TABLET_FOLLOWS,
    toggle,
  } from "./replace.ts";
  import { FOLLOWS, listNames } from "./social.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch07.replace);
  const name = (id: PersonaId): string => getPersona(id).displayName;
  const names = (ids: readonly PersonaId[]): string => listNames(locale, ids.map(name), "—");

  const START = FOLLOWS.follows.get(OWNER) ?? [];
  let phone = $state<readonly PersonaId[]>(START);
  let history = $state<readonly Published[]>([]);
  let lost = $state<readonly PersonaId[]>([]);
  let message = $state<string | null>(null);
  let relayCard: HTMLElement | undefined = $state();

  const kept = $derived(relayKeeps(history));
  const keptFollows = $derived(followsInEvent(kept?.event));

  const send = (device: Device): void => {
    const before = kept === undefined ? phone : keptFollows;
    const list = device === "phone" ? phone : TABLET_FOLLOWS;
    const next = publish(history, device, list);
    if (!next.ok) {
      message = next.error.message;
      return;
    }
    history = next.value;
    const n = String(next.value.length);
    if (device === "phone") {
      lost = [];
      message = format(t.narration.published, { n, count: list.length });
      return;
    }
    lost = lostFollows(before, list);
    message =
      lost.length > 0
        ? format(t.narration.tablet, { n, lost: names(lost) })
        : format(t.narration.tabletNoLoss, { n });
    if (lost.length > 0) {
      emit("warning", { reason: "ch07-follows-lost" });
      if (relayCard !== undefined) shake(relayCard);
    }
  };

  const sync = (): void => {
    phone = keptFollows;
    lost = [];
    message = t.narration.synced;
    emit("celebrate", { reason: "ch07-synced" });
  };

  const reset = (): void => {
    phone = START;
    history = [];
    lost = [];
    message = t.narration.reset;
  };
</script>

<section class="trap" data-testid="ch07-replace" aria-labelledby="ch07-replace-heading">
  <header>
    <h3 id="ch07-replace-heading">{t.title}</h3>
    <p class="desc">{t.description}</p>
  </header>

  <div class="cols">
    <fieldset class="device" data-testid="ch07-phone">
      <legend>{t.followLabel}</legend>
      <p class="hint">{t.intro}</p>
      <ul class="checks">
        {#each CANDIDATES as id (id)}
          <li>
            <label class="check">
              <input
                type="checkbox"
                data-testid="ch07-follow-{id}"
                checked={phone.includes(id)}
                onchange={() => (phone = toggle(phone, id))}
              >
              <img src={getPersona(id).avatar} alt="">
              {name(id)}
            </label>
          </li>
        {/each}
      </ul>
      <div class="actions">
        <Button testid="ch07-publish-phone" onclick={() => send("phone")}>{t.publishPhone}</Button>
        <Button testid="ch07-publish-tablet" variant="danger" onclick={() => send("tablet")}
          >{t.publishTablet}</Button
        >
      </div>
      <p class="hint">{format(t.tabletHint, { list: names(TABLET_FOLLOWS) })}</p>
    </fieldset>

    <div class="relay" bind:this={relayCard} data-testid="ch07-relay-state">
      <h4>{t.relayTitle}</h4>
      {#if kept === undefined}
        <p class="hint" data-testid="ch07-relay-empty">{t.relayEmpty}</p>
      {:else}
        {#key kept.version}
          <div
            class="kept"
            use:pop
            data-testid="ch07-kept"
            data-version={kept.version}
            data-device={kept.device}
          >
            <p class="version">
              {format(t.version, {
                n: kept.version,
                device: kept.device === "phone" ? t.devicePhone : t.deviceTablet,
                count: keptFollows.length,
              })}
            </p>
            <p data-testid="ch07-kept-follows">{names(keptFollows)}</p>
          </div>
        {/key}
        {#if lost.length > 0}
          <p class="lost" data-testid="ch07-lost" use:pop>
            {format(t.lost, { list: names(lost) })}
          </p>
        {/if}
      {/if}
      <div class="actions">
        <Button testid="ch07-sync" variant="secondary" disabled={kept === undefined} onclick={sync}
          >{t.sync}</Button
        >
        <Button testid="ch07-reset" variant="ghost" onclick={reset}>{t.reset}</Button>
      </div>
    </div>
  </div>

  <p class="narration" data-testid="ch07-replace-narration" aria-live="polite">
    {message ?? t.narration.ready}
  </p>

  {#if kept !== undefined}
    <div>
      <h4>{t.eventTitle}</h4>
      <JsonView testid="ch07-kept-json" {locale} value={kept.event} />
    </div>
  {/if}
</section>

<style>
  .trap {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }
  h3,
  h4 {
    margin: 0;
    font-family: var(--font-family-display);
  }
  h3 {
    font-size: var(--font-size-xl);
  }
  .desc {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .cols {
    display: grid;
    gap: var(--space-md);
  }
  /* 768px = tokens.breakpoint.md */
  @media (min-width: 768px) {
    .cols {
      grid-template-columns: 1fr 1fr;
    }
  }
  .device,
  .relay {
    display: grid;
    gap: var(--space-sm);
    align-content: start;
    margin: 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
  }
  legend {
    padding: 0 var(--space-2xs);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .checks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 8rem), 1fr));
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: 0 var(--space-xs);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
  .check:has(input:checked) {
    background: var(--color-primary-subtle);
  }
  .check input {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
    accent-color: var(--color-primary);
  }
  .check input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .check img {
    width: var(--size-icon-md);
    height: var(--size-icon-md);
    border-radius: var(--radius-round);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .kept {
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-primary-subtle);
  }
  .kept p {
    margin: 0;
  }
  .version {
    font-weight: var(--font-weight-bold);
  }
  .lost {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
    font-weight: var(--font-weight-bold);
  }
  .narration {
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border-left: var(--border-width-heavy) solid var(--color-primary);
    border-radius: var(--radius-sm);
    background: var(--color-primary-subtle);
    font-weight: var(--font-weight-semibold);
  }
</style>
