<script lang="ts">
  import type { MascotPose } from "../types.ts";

  interface Props {
    readonly pose: MascotPose;
    /** Freeze ambient loops (blink, bob, ruffle); poses still change, instantly. */
    readonly still?: boolean;
    readonly testid?: string;
  }

  const { pose, still = false, testid = "mascot-svg" }: Props = $props();

  // Pattern and clip ids must be unique per instance: several Nos can share one page.
  const uid = $props.id();
  const dots = `${uid}-dots`;
  const dotsWarm = `${uid}-dots-warm`;
  const bodyClip = `${uid}-body`;
  const bellyClip = `${uid}-belly`;

  // Drawn twice: once as the misregistered orange print pass, once as the teal body.
  const BODY =
    "M52 128 C52 100 74 90 100 90 C126 90 148 100 148 128 C148 150 138 164 128 166 Q122 174 114 168 Q107 176 100 168 Q93 176 86 168 Q78 174 72 166 C62 164 52 150 52 128 Z";
  const WING_L =
    "M60 112 C44 116 36 134 40 150 C46 144 50 148 54 142 C58 146 62 140 64 134 C66 126 64 116 60 112 Z";
  const WING_R =
    "M140 112 C156 116 164 134 160 150 C154 144 150 148 146 142 C142 146 138 140 136 134 C134 126 136 116 140 112 Z";
</script>

<!--
  "Nos" the ostrich, front-facing chibi, printed like a two-colour riso sticker: ink linework,
  teal and orange spot fills, marker-yellow feathers and halftone dots for shading. The orange
  body pass sits slightly off the teal one on purpose (misregistration).
  Decorative: the accessible name lives on the parent (role="img"), so this SVG is aria-hidden.
  Every pose is pure CSS on named groups, which keeps poses swappable without re-rendering and
  lets reduced motion drop only the loops.
  Geometry is in viewBox user units (200 × 220); colors are mascot/theme tokens only.
-->
<svg
  class="ostrich"
  class:still
  data-testid={testid}
  data-pose={pose}
  viewBox="0 0 200 220"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <!-- Halftone screens. userSpaceOnUse keeps dots the same size on every shape. -->
    <pattern id={dots} width="4.5" height="4.5" patternUnits="userSpaceOnUse">
      <circle class="dot-ink" cx="2.25" cy="2.25" r="1.05" />
    </pattern>
    <pattern id={dotsWarm} width="3.6" height="3.6" patternUnits="userSpaceOnUse">
      <circle class="dot-warm" cx="1.8" cy="1.8" r="1" />
    </pattern>
    <clipPath id={bodyClip}><path d={BODY} /></clipPath>
    <clipPath id={bellyClip}><ellipse cx="100" cy="136" rx="28" ry="24" /></clipPath>
  </defs>

  <ellipse class="shadow" cx="103" cy="209" rx="46" ry="6" data-testid="{testid}-shadow" />

  <g class="figure">
    <g class="legs">
      <path class="leg-ink" d="M88 160 Q86 182 84 204" />
      <path class="leg-ink" d="M112 160 Q114 182 116 204" />
      <path class="foot-ink" d="M72 207 Q84 200 96 207" />
      <path class="foot-ink" d="M104 207 Q116 200 128 207" />
      <path class="leg" d="M88 160 Q86 182 84 204" />
      <circle class="knee" cx="86" cy="182" r="4.5" />
      <path class="foot" d="M72 207 Q84 200 96 207" />
      <path class="leg" d="M112 160 Q114 182 116 204" />
      <circle class="knee" cx="114" cy="182" r="4.5" />
      <path class="foot" d="M104 207 Q116 200 128 207" />
    </g>

    <g class="tail">
      <ellipse class="plume" cx="58" cy="104" rx="9" ry="22" transform="rotate(-38 58 104)" />
      <ellipse class="plume" cx="142" cy="104" rx="9" ry="22" transform="rotate(38 142 104)" />
      <ellipse class="plume-tip" cx="52" cy="92" rx="4" ry="8" transform="rotate(-38 52 92)" />
      <ellipse class="plume-tip" cx="148" cy="92" rx="4" ry="8" transform="rotate(38 148 92)" />
    </g>

    <g class="torso">
      <path class="misreg" d={BODY} transform="translate(2.5 2.5)" />
      <path class="body" d={BODY} />
      <!-- Shade the lower flank, clipped to the body so dots never spill onto the page. -->
      <rect
        class="shade"
        clip-path="url(#{bodyClip})"
        x="40"
        y="146"
        width="120"
        height="40"
        fill="url(#{dots})"
        data-testid="{testid}-halftone"
      />
      <ellipse class="belly" cx="100" cy="136" rx="28" ry="24" />
      <ellipse
        class="shade"
        clip-path="url(#{bellyClip})"
        cx="104"
        cy="164"
        rx="34"
        ry="14"
        fill="url(#{dots})"
      />
      <ellipse class="belly-line" cx="100" cy="136" rx="28" ry="24" />
      <path
        class="belly-fluff"
        d="M80 124 Q86 118 90 124 Q95 117 100 124 Q105 117 110 124 Q114 118 120 124"
      />
    </g>

    <g class="neck">
      <path class="neck-shape" d="M93 100 C91 84 95 70 94 58 L108 58 C107 70 111 84 109 100 Z" />
      <path
        class="neck-stripe"
        d="M98 98 C97 84 100 72 99 60 L103 60 C102 72 104 84 104 98 Z"
        fill="url(#{dots})"
      />

      <g class="head">
        <g class="crest">
          <ellipse
            class="crest-feather"
            cx="93"
            cy="16"
            rx="3.5"
            ry="10"
            transform="rotate(-30 93 16)"
          />
          <ellipse class="crest-feather" cx="101" cy="12" rx="4" ry="11" />
          <ellipse
            class="crest-feather"
            cx="109"
            cy="16"
            rx="3.5"
            ry="10"
            transform="rotate(30 109 16)"
          />
        </g>
        <circle class="skull" cx="101" cy="40" r="20" />
        <ellipse class="cheek" cx="85" cy="49" rx="4.5" ry="3" fill="url(#{dotsWarm})" />
        <ellipse class="cheek" cx="117" cy="49" rx="4.5" ry="3" fill="url(#{dotsWarm})" />

        {#each [93, 109] as cx (cx)}
          <g class="eye" style:transform-origin="{cx}px 38px">
            <circle class="eye-white" {cx} cy="38" r="7" />
            <g class="pupil">
              <circle class="pupil-dot" cx={cx + 0.5} cy="39" r="3.6" />
              <circle class="glint" cx={cx - 0.8} cy="37.6" r="1.3" />
            </g>
            <ellipse
              class="lid"
              {cx}
              cy="38"
              rx="7.6"
              ry="7.6"
              style:transform-origin="{cx}px 30.4px"
            />
            <path class="lash" d="M{cx - 6} 38 Q{cx} 43 {cx + 6} 38" />
          </g>
        {/each}

        <ellipse class="mouth" cx="101" cy="55" rx="6" ry="3.5" />
        <path class="jaw" d="M93 53 Q101 62 109 53 Q101 57 93 53 Z" />
        <path class="beak" d="M90 50 Q101 44 112 50 Q107 57 101 57 Q95 57 90 50 Z" />
        <circle class="nostril" cx="97" cy="49" r="0.9" />
        <circle class="nostril" cx="105" cy="49" r="0.9" />
      </g>
    </g>

    <path
      class="ruff"
      d="M84 100 Q88 92 92 99 Q96 91 100 99 Q104 91 108 99 Q112 92 116 100 Q100 108 84 100 Z"
    />

    <g class="wing wing-l">
      <path class="wing-shape" d={WING_L} />
      <path class="wing-shade" d={WING_L} fill="url(#{dots})" />
      <path class="wing-line" d="M56 120 Q48 132 46 144 M60 124 Q56 134 54 140" />
    </g>
    <g class="wing wing-r">
      <path class="wing-shape" d={WING_R} />
      <path class="wing-shade" d={WING_R} fill="url(#{dots})" />
      <path class="wing-line" d="M144 120 Q152 132 154 144 M140 124 Q144 134 146 140" />
    </g>
  </g>

  <!-- Pose props: hidden unless the pose shows them. They sit on the page, so they use the
       theme ink (border-strong / text), not the always-dark mascot line. -->
  <g class="prop think-bubble">
    <circle cx="136" cy="34" r="3" />
    <circle cx="146" cy="24" r="5" />
    <ellipse cx="170" cy="12" rx="22" ry="11" />
    <circle class="dot" cx="161" cy="12" r="2.4" />
    <circle class="dot" cx="170" cy="12" r="2.4" />
    <circle class="dot" cx="179" cy="12" r="2.4" />
  </g>

  <g class="prop alarm">
    <path class="sweat" d="M126 22 Q131 31 126 35 Q121 31 126 22 Z" />
    <path class="shock" d="M134 18 L142 8 M138 26 L150 22 M66 18 L58 8" />
  </g>

  <g class="prop zzz">
    <text class="z z1" x="124" y="30">z</text>
    <text class="z z2" x="136" y="18">z</text>
    <text class="z z3" x="150" y="6">Z</text>
  </g>

  <!-- Cheer marks: comic "emanata" ticks plus a printed dot, not glittery sparkles. -->
  <g class="prop sparkles">
    <g class="sparkle s1">
      <path class="tick" d="M30 44 l-6 -6 M36 40 l0 -9 M40 45 l7 -5" />
      <circle class="spot" cx="34" cy="50" r="2.6" />
    </g>
    <g class="sparkle s2">
      <path class="tick" d="M164 62 l5 -7 M170 66 l8 -2 M168 72 l7 4" />
      <circle class="spot" cx="161" cy="70" r="2.2" />
    </g>
    <g class="sparkle s3">
      <path class="tick" d="M26 96 l-7 -3 M24 103 l-8 2" />
      <circle class="spot" cx="30" cy="110" r="2" />
    </g>
    <g class="sparkle s4">
      <path class="tick" d="M176 104 l7 -4 M178 112 l8 1" />
      <circle class="spot" cx="172" cy="120" r="2.4" />
    </g>
  </g>

  <g class="prop confetti">
    <rect class="bit c1" x="30" y="10" width="6" height="10" rx="1" />
    <rect class="bit c2" x="62" y="2" width="6" height="10" rx="1" />
    <rect class="bit c3" x="132" y="4" width="6" height="10" rx="1" />
    <rect class="bit c4" x="164" y="14" width="6" height="10" rx="1" />
    <rect class="bit c5" x="16" y="56" width="6" height="10" rx="1" />
    <rect class="bit c1" x="182" y="52" width="6" height="10" rx="1" />
  </g>
</svg>

<style>
  .ostrich {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    /* Ambient loop periods are multiples of tokens so they collapse to 0 with reduced motion. */
    --loop-bob: calc(var(--motion-duration-step) * 2);
    --loop-blink: calc(var(--motion-duration-step) * 3);
    --loop-ruffle: calc(var(--motion-duration-step) * 1.5);
    --loop-fast: calc(var(--motion-duration-slower) * 1);
    --pose-ease: var(--motion-easing-bounce);
    --pose-dur: var(--motion-duration-slow);
    /* The parent may thin the line for tiny sizes, where 1.5px ink would swamp the fills. */
    --line: var(--mascot-line-width, var(--border-width-medium));
  }

  /* Pivots are in viewBox units; view-box makes px resolve against the 200×220 user space. */
  .ostrich :global(*) {
    transform-box: view-box;
  }
  .figure,
  .neck,
  .head,
  .crest,
  .wing,
  .jaw,
  .lid,
  .pupil,
  .eye,
  .torso,
  .prop {
    transition:
      transform var(--pose-dur) var(--pose-ease),
      opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }

  /* ---------- paint ---------- */
  /* Every spot fill gets the ink line; non-scaling keeps it the 1.5px brand line at any size. */
  .misreg,
  .body,
  .belly-line,
  .neck-shape,
  .skull,
  .lid,
  .plume,
  .plume-tip,
  .crest-feather,
  .ruff,
  .wing-shape,
  .eye-white,
  .knee,
  .beak,
  .jaw,
  .cheek {
    stroke: var(--color-mascot-line);
    stroke-width: var(--line);
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .shadow {
    fill: var(--color-shadow);
  }
  /* Legs are strokes, so the outline is a wider ink stroke underneath the orange one. */
  .leg-ink,
  .foot-ink,
  .leg,
  .foot {
    fill: none;
    stroke-linecap: round;
  }
  .leg-ink,
  .foot-ink {
    stroke: var(--color-mascot-line);
    stroke-width: 9;
  }
  .leg,
  .foot {
    stroke: var(--color-mascot-legs);
    stroke-width: 6;
  }
  .knee {
    fill: var(--color-mascot-legs);
  }
  .misreg {
    fill: var(--color-mascot-beak);
    stroke: none;
  }
  .body,
  .neck-shape,
  .skull,
  .lid {
    fill: var(--color-mascot-body);
  }
  .plume,
  .crest-feather,
  .ruff,
  .wing-shape {
    fill: var(--color-mascot-accent);
  }
  .plume-tip {
    fill: var(--color-mascot-beak);
  }
  .belly,
  .eye-white,
  .glint {
    fill: var(--color-mascot-belly);
  }
  .belly-line {
    fill: none;
  }
  .dot-ink {
    fill: var(--color-halftone);
  }
  /* A dotted stripe down the neck: the same screen, printed lighter. */
  .neck-stripe {
    opacity: var(--opacity-muted);
  }
  .dot-warm {
    fill: var(--color-mascot-beak);
  }
  .shade,
  .wing-shade {
    pointer-events: none;
  }
  .wing-shade {
    opacity: var(--opacity-muted);
  }
  .wing-line,
  .belly-fluff,
  .lash {
    fill: none;
    stroke: var(--color-mascot-line);
    stroke-width: var(--line);
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .pupil-dot,
  .mouth,
  .nostril {
    fill: var(--color-mascot-line);
  }
  .beak {
    fill: var(--color-mascot-beak);
  }
  .jaw {
    fill: var(--color-mascot-legs);
  }
  .lash {
    opacity: 0;
  }

  /* ---------- pivots ---------- */
  .figure {
    transform-origin: 100px 208px;
  }
  .torso {
    transform-origin: 100px 168px;
  }
  .neck {
    transform-origin: 100px 100px;
  }
  .head {
    transform-origin: 101px 58px;
  }
  .crest {
    transform-origin: 101px 24px;
  }
  .wing-l {
    transform-origin: 60px 114px;
  }
  .wing-r {
    transform-origin: 140px 114px;
  }
  .jaw {
    transform-origin: 101px 54px;
  }
  .lid {
    transform: scaleY(0);
  }

  /* ---------- props (hidden by default) ---------- */
  .prop {
    opacity: 0;
    transform: scale(0.6);
  }
  .think-bubble {
    transform-origin: 140px 34px;
    fill: var(--color-surface-raised);
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
    vector-effect: non-scaling-stroke;
  }
  .think-bubble .dot {
    fill: var(--color-text);
    stroke: none;
  }
  .alarm {
    transform-origin: 126px 26px;
  }
  .sweat,
  .spot,
  .bit {
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
    vector-effect: non-scaling-stroke;
  }
  .sweat {
    fill: var(--color-accent);
  }
  .shock,
  .tick {
    fill: none;
    stroke: var(--color-text);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .zzz {
    transform-origin: 124px 30px;
  }
  .z {
    fill: var(--color-text);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: 14px;
  }
  .z2 {
    font-size: 17px;
  }
  .z3 {
    font-size: 21px;
  }
  .sparkles {
    transform-origin: 100px 80px;
  }
  .s1 .spot,
  .s4 .spot {
    fill: var(--color-mascot-accent);
  }
  .s2 .spot {
    fill: var(--color-primary);
  }
  .s3 .spot {
    fill: var(--color-secondary);
  }
  .confetti {
    transform-origin: 100px 0;
  }
  /* Each confetti bit (and cheer mark) spins around its own center, not the viewBox origin. */
  .bit,
  .sparkle {
    transform-box: fill-box;
    transform-origin: center;
  }
  .c1 {
    fill: var(--color-chart-1);
  }
  .c2 {
    fill: var(--color-chart-2);
  }
  .c3 {
    fill: var(--color-chart-3);
  }
  .c4 {
    fill: var(--color-chart-4);
  }
  .c5 {
    fill: var(--color-chart-5);
  }

  /* ---------- ambient life (every pose) ---------- */
  .figure {
    animation: bob var(--loop-bob) var(--motion-easing-standard) infinite alternate;
  }
  .lid {
    animation: blink var(--loop-blink) linear infinite;
  }
  .crest {
    animation: ruffle var(--loop-ruffle) var(--motion-easing-standard) infinite alternate;
  }

  /* ---------- poses ---------- */
  [data-pose="wave"] .wing-r {
    animation: wave var(--loop-fast) var(--motion-easing-standard) infinite alternate;
    transform: rotate(-115deg);
  }
  [data-pose="wave"] .head {
    transform: rotate(6deg);
  }

  [data-pose="think"] .neck {
    transform: rotate(-7deg);
  }
  [data-pose="think"] .head {
    transform: rotate(-6deg);
  }
  [data-pose="think"] .pupil {
    transform: translate(-1px, -2.4px);
  }
  [data-pose="think"] .wing-r {
    transform: rotate(-70deg);
  }
  [data-pose="think"] .think-bubble {
    opacity: 1;
    transform: none;
  }
  [data-pose="think"] .think-bubble .dot {
    animation: pulse var(--loop-fast) var(--motion-easing-standard) infinite alternate;
  }

  [data-pose="cheer"] .wing-l {
    transform: rotate(105deg);
  }
  [data-pose="cheer"] .wing-r {
    transform: rotate(-105deg);
  }
  [data-pose="cheer"] .jaw,
  [data-pose="celebrate"] .jaw,
  [data-pose="panic"] .jaw {
    transform: translateY(3.5px);
  }
  [data-pose="cheer"] .figure {
    animation: hop var(--loop-fast) var(--motion-easing-decelerate) infinite alternate;
  }
  [data-pose="cheer"] .sparkles,
  [data-pose="celebrate"] .sparkles {
    opacity: 1;
    transform: none;
  }
  [data-pose="cheer"] .sparkle,
  [data-pose="celebrate"] .sparkle {
    animation: twinkle var(--loop-fast) var(--motion-easing-standard) infinite alternate;
  }

  [data-pose="panic"] .figure {
    animation: shake calc(var(--motion-duration-fast) * 1) linear infinite;
  }
  [data-pose="panic"] .crest {
    animation: none;
    transform: scaleY(1.35);
  }
  [data-pose="panic"] .eye {
    transform: scale(1.18);
  }
  [data-pose="panic"] .pupil {
    transform: scale(0.6);
  }
  [data-pose="panic"] .wing-l {
    transform: rotate(45deg);
    animation: flap-l var(--motion-duration-normal) linear infinite alternate;
  }
  [data-pose="panic"] .wing-r {
    transform: rotate(-45deg);
    animation: flap-r var(--motion-duration-normal) linear infinite alternate;
  }
  [data-pose="panic"] .alarm {
    opacity: 1;
    transform: none;
  }

  [data-pose="celebrate"] .figure {
    animation: jump var(--motion-duration-slower) var(--motion-easing-decelerate) infinite alternate;
  }
  [data-pose="celebrate"] .wing-l {
    transform: rotate(130deg);
    animation: flap-l var(--motion-duration-slow) linear infinite alternate;
  }
  [data-pose="celebrate"] .wing-r {
    transform: rotate(-130deg);
    animation: flap-r var(--motion-duration-slow) linear infinite alternate;
  }
  [data-pose="celebrate"] .confetti {
    opacity: 1;
    transform: none;
  }
  [data-pose="celebrate"] .bit {
    animation: fall var(--motion-duration-step) var(--motion-easing-accelerate) infinite;
  }

  [data-pose="sleep"] .figure {
    animation: breathe var(--loop-bob) var(--motion-easing-standard) infinite alternate;
  }
  [data-pose="sleep"] .neck {
    transform: rotate(10deg);
  }
  [data-pose="sleep"] .head {
    transform: translateY(10px) rotate(14deg);
  }
  [data-pose="sleep"] .lid {
    animation: none;
    transform: scaleY(1);
  }
  [data-pose="sleep"] .lash {
    opacity: 1;
  }
  [data-pose="sleep"] .crest {
    animation: none;
    transform: rotate(20deg) scaleY(0.85);
  }
  [data-pose="sleep"] .zzz {
    opacity: 1;
    transform: none;
  }
  [data-pose="sleep"] .z {
    animation: float var(--loop-bob) var(--motion-easing-standard) infinite;
  }
  [data-pose="sleep"] .z2 {
    animation-delay: var(--motion-duration-slower);
  }
  [data-pose="sleep"] .z3 {
    animation-delay: calc(var(--motion-duration-slower) * 2);
  }

  /* ---------- reduced motion: poses stay, loops go ---------- */
  .still :global(*) {
    /* biome-ignore lint/complexity/noImportantStyles: reduced motion must beat every pose loop. */
    animation: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .ostrich :global(*) {
      /* biome-ignore lint/complexity/noImportantStyles: reduced motion must beat every pose loop. */
      animation: none !important;
    }
  }

  @keyframes bob {
    to {
      transform: translateY(-2px);
    }
  }
  @keyframes blink {
    0%,
    94%,
    100% {
      transform: scaleY(0);
    }
    97% {
      transform: scaleY(1);
    }
  }
  @keyframes ruffle {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(6deg);
    }
  }
  @keyframes wave {
    from {
      transform: rotate(-95deg);
    }
    to {
      transform: rotate(-135deg);
    }
  }
  @keyframes pulse {
    to {
      opacity: var(--opacity-dimmed);
    }
  }
  @keyframes hop {
    to {
      transform: translateY(-8px);
    }
  }
  @keyframes jump {
    from {
      transform: translateY(0) scale(1.03, 0.97);
    }
    to {
      transform: translateY(-16px) scale(0.98, 1.02);
    }
  }
  @keyframes twinkle {
    to {
      opacity: var(--opacity-muted);
    }
  }
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px) rotate(-1deg);
    }
    75% {
      transform: translateX(2px) rotate(1deg);
    }
  }
  @keyframes flap-l {
    from {
      transform: rotate(var(--flap-from, 40deg));
    }
    to {
      transform: rotate(var(--flap-to, 70deg));
    }
  }
  @keyframes flap-r {
    from {
      transform: rotate(calc(var(--flap-from, 40deg) * -1));
    }
    to {
      transform: rotate(calc(var(--flap-to, 70deg) * -1));
    }
  }
  [data-pose="celebrate"] .wing {
    --flap-from: 115deg;
    --flap-to: 145deg;
  }
  @keyframes fall {
    from {
      transform: translateY(-6px) rotate(0);
    }
    to {
      transform: translateY(14px) rotate(180deg);
    }
  }
  @keyframes breathe {
    to {
      transform: scale(1.02, 1.03);
    }
  }
  @keyframes float {
    from {
      transform: translate(0, 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    to {
      transform: translate(6px, -10px);
      opacity: 0;
    }
  }
</style>
