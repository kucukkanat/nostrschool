<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { mascotBus } from "@nostrschool/ui/bus.ts";
  import { $reducedMotion as reducedMotion, spring } from "@nostrschool/ui/motion.ts";
  import { animate } from "motion";
  import { untrack } from "svelte";
  import { createPoseController, type MascotState } from "../controller.ts";
  import { REACTION_HOLD_MS } from "../poses.ts";
  import { fetchRiveAsset } from "../rive.ts";
  import { mountRive, type RiveHandle } from "../rive-runtime.ts";
  import type { MascotProps } from "../types.ts";
  import OstrichSvg from "./OstrichSvg.svelte";

  const {
    locale,
    size = "md",
    pose = "idle",
    reactive = true,
    riveSrc,
    say,
    announce = true,
    bus = mascotBus,
    holdMs = REACTION_HOLD_MS,
    testid = "mascot",
  }: MascotProps = $props();

  // One controller per instance; props only seed it, later changes flow through setBase/connect.
  const controller = untrack(() => createPoseController({ base: pose, holdMs }));
  let mascot = $state.raw<MascotState>(controller.$state.get());
  let springEl = $state<HTMLElement>();
  let canvas = $state<HTMLCanvasElement>();
  let riveFile = $state.raw<ArrayBuffer>();
  let rive = $state<RiveHandle>();

  const dict = $derived(getDictionary(locale).mascot);
  const label = $derived(dict.poses[mascot.pose]);
  // Derived so effects re-run only when a reaction happens, not on every state replacement.
  const beat = $derived(mascot.beat);
  const renderer = $derived(rive === undefined ? "svg" : "rive");

  $effect(() =>
    controller.$state.subscribe((s) => {
      mascot = s;
    }),
  );
  $effect(() => controller.setBase(pose));
  $effect(() => (reactive ? controller.connect(bus) : undefined));
  $effect(() => () => controller.destroy());

  // Springy squash on every reaction; motion's spring() is instant under reduced motion.
  $effect(() => {
    if (beat === 0) return;
    const el = untrack(() => springEl);
    if (el !== undefined) animate(el, { scale: [0.9, 1] }, { ...spring("bouncy", $reducedMotion) });
    untrack(() => rive)?.bounce();
  });

  // Rive is opt-in twice: a riveSrc must be given AND the file must exist. Under reduced motion
  // we keep the SVG: its poses are static there, whereas a Rive state machine always animates.
  $effect(() => {
    if (riveSrc === undefined || $reducedMotion) return;
    let live = true;
    void fetchRiveAsset(riveSrc).then((result) => {
      if (!live) return;
      if (result.ok) riveFile = result.value;
      // A missing/HTML asset is the expected state until a designer ships the .riv: stay quiet.
      else if (result.error.code === "network")
        console.warn(`[mascot] ${result.error.message}; using SVG`);
    });
    return () => {
      live = false;
      riveFile = undefined;
    };
  });

  $effect(() => {
    const el = canvas;
    const file = riveFile;
    if (el === undefined || file === undefined) return;
    let live = true;
    let handle: RiveHandle | undefined;
    void mountRive(el, file).then((result) => {
      if (!result.ok) {
        console.warn(`[mascot] ${result.error.message}; using SVG`);
        if (live) riveFile = undefined;
        return;
      }
      if (!live) return result.value.destroy();
      handle = result.value;
      rive = handle;
    });
    return () => {
      live = false;
      handle?.destroy();
      rive = undefined;
    };
  });

  $effect(() => rive?.setPose(mascot.pose));
</script>

<div class="mascot-container {size}" data-testid="{testid}-container">
  <!-- Only the bubble may speak: the mood is decorative (it is the img's alt text, never a live
       region), because the island that emits bus events already narrates what happened. -->
  <div
    class="bubble-region"
    aria-live={announce ? "polite" : undefined}
    data-testid="{testid}-bubble-region"
  >
    {#if say !== undefined && say !== ""}
      <p class="bubble" data-testid="{testid}-bubble">{say}</p>
    {/if}
  </div>

  <div
    class="mascot"
    data-testid={testid}
    data-pose={mascot.pose}
    data-renderer={renderer}
    role="img"
    aria-label={label}
    aria-roledescription={dict.label}
  >
    <div class="spring" bind:this={springEl} data-testid="{testid}-figure">
      {#if renderer === "svg"}
        <OstrichSvg pose={mascot.pose} still={$reducedMotion} testid="{testid}-svg" />
      {/if}
      {#if riveFile !== undefined}
        <canvas
          bind:this={canvas}
          class="rive"
          class:ready={renderer === "rive"}
          data-testid="{testid}-canvas"
          aria-hidden="true"
        ></canvas>
      {/if}
    </div>
  </div>
</div>

<style>
  .mascot-container {
    --mascot-size: var(--size-mascot-md);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    position: relative;
  }
  .sm {
    --mascot-size: var(--size-mascot-sm);
  }
  .lg {
    --mascot-size: var(--size-mascot-lg);
  }

  .mascot {
    width: var(--mascot-size);
    /* Matches the 200×220 viewBox so the island reserves its height (no layout shift). */
    aspect-ratio: 200 / 220;
  }
  .spring {
    position: relative;
    width: 100%;
    height: 100%;
    transform-origin: 50% 100%;
  }
  .rive {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .rive.ready {
    opacity: 1;
  }

  .bubble-region:empty {
    display: none;
  }
  .bubble {
    position: relative;
    margin: 0;
    max-width: calc(var(--mascot-size) * 2);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface-raised);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    line-height: var(--font-line-height-snug);
    text-align: center;
    animation: pop-in var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  /* Tail pointing down at Nos. */
  .bubble::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: calc(var(--space-xs) * -1);
    width: var(--space-sm);
    height: var(--space-sm);
    background: inherit;
    border-right: inherit;
    border-bottom: inherit;
    transform: translateX(-50%) rotate(45deg);
  }
  @keyframes pop-in {
    from {
      transform: scale(0.6) translateY(var(--space-xs));
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation: none;
    }
  }
</style>
