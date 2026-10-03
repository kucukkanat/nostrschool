<script lang="ts">
  /**
   * Light / dark / system segmented control, built on native radio inputs so arrow keys,
   * focus and screen-reader semantics come for free.
   * SSR renders "system"; the stored preference is read after hydration (the inline script in
   * BaseLayout already applied it before paint, so nothing flashes).
   */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { browserStorage, type KeyValueStorage, warnStorage } from "./lib/storage.ts";
  import {
    applyTheme,
    loadThemePref,
    saveThemePref,
    THEME_PREFS,
    type ThemePref,
  } from "./lib/theme.ts";

  interface Props {
    readonly locale: Locale;
    /** Injectable for tests; defaults to localStorage (guarded). */
    readonly storage?: KeyValueStorage;
    /** Element receiving `data-theme`; defaults to `<html>`. */
    readonly root?: HTMLElement;
  }
  const { locale, storage, root }: Props = $props();
  const t = $derived(getDictionary(locale).common.theme);
  const labels = $derived<Record<ThemePref, string>>({
    light: t.light,
    dark: t.dark,
    system: t.system,
  });
  const name = $props.id();

  let pref = $state<ThemePref>("system");
  const store = (): KeyValueStorage | undefined => {
    if (storage !== undefined) return storage;
    const s = browserStorage();
    return s.ok ? s.value : undefined;
  };

  $effect(() => {
    const s = store();
    if (s === undefined) return;
    const loaded = loadThemePref(s);
    if (loaded.ok) pref = loaded.value;
    else warnStorage("theme unavailable", loaded.error);
  });

  const choose = (next: ThemePref) => {
    pref = next;
    applyTheme(root ?? document.documentElement, next);
    const s = store();
    if (s === undefined) return;
    const saved = saveThemePref(s, next);
    if (!saved.ok) warnStorage("theme not saved", saved.error);
  };
</script>

<fieldset class="theme" data-testid="theme-toggle" data-pref={pref}>
  <legend class="visually-hidden">{t.label}</legend>
  {#each THEME_PREFS as option (option)}
    <label class="option" title={labels[option]} data-testid="theme-{option}">
      <input
        class="radio"
        type="radio"
        {name}
        value={option}
        checked={pref === option}
        data-testid="theme-{option}-input"
        onchange={() => choose(option)}
      >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {#if option === "light"}
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        {:else if option === "dark"}
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        {:else}
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        {/if}
      </svg>
      <span class="visually-hidden">{labels[option]}</span>
    </label>
  {/each}
</fieldset>

<style>
  .theme {
    display: inline-flex;
    gap: var(--space-3xs);
    margin: 0;
    padding: var(--space-3xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
  }
  .option {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: var(--size-control-sm);
    block-size: var(--size-control-sm);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .option:hover {
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }
  /* Selected: orange fill plus an inset ink outline, so the state never rests on colour alone. */
  .option:has(:checked) {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: inset 0 0 0 var(--border-width-medium) var(--color-border-strong);
  }
  .option:has(:focus-visible) {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  /* The input covers the label so it stays clickable and focusable, but is invisible. */
  .radio {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  svg {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
