<script lang="ts">
  /**
   * CodeMirror 6 JSON editor. Text flows both ways through `value` (bindable); diagnostics come
   * from the spec validator (no CodeMirror linter source, so lint never runs on its own clock);
   * `highlight` paths get a highlighter-pen mark; caret moves and hovers report the JSON path.
   */
  import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
  import { json } from "@codemirror/lang-json";
  import {
    bracketMatching,
    HighlightStyle,
    indentOnInput,
    syntaxHighlighting,
  } from "@codemirror/language";
  import { setDiagnostics } from "@codemirror/lint";
  import { Annotation, EditorState, StateEffect, StateField } from "@codemirror/state";
  import {
    Decoration,
    type DecorationSet,
    EditorView,
    keymap,
    lineNumbers,
  } from "@codemirror/view";
  import { tags } from "@lezer/highlight";
  import { onMount } from "svelte";
  import { pathAtOffset, rangeOfPath } from "../state.ts";
  import type { JsonCodeEditorProps } from "../types.ts";

  let {
    testid,
    value = $bindable(),
    diagnostics,
    highlight = [],
    readonly = false,
    onselectpath,
    label,
  }: JsonCodeEditorProps = $props();

  let host: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined = $state();
  /** Marks transactions we dispatch from props, so they are not echoed back into `value`. */
  const external = Annotation.define<boolean>();
  const setMarks = StateEffect.define<DecorationSet>();
  const marks = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update: (deco, tr) => {
      for (const e of tr.effects) if (e.is(setMarks)) return e.value;
      return deco.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
  const mark = Decoration.mark({ class: "cm-nip-highlight" });

  // Colours come from tokens, so light/dark switch with the page and no hex lives here.
  const style = HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--color-code-key)" },
    { tag: tags.string, color: "var(--color-code-string)" },
    { tag: tags.number, color: "var(--color-code-number)" },
    { tag: [tags.bool], color: "var(--color-code-boolean)" },
    { tag: tags.null, color: "var(--color-code-null)" },
    {
      tag: [tags.punctuation, tags.brace, tags.squareBracket, tags.separator],
      color: "var(--color-code-punctuation)",
    },
  ]);
  const theme = EditorView.theme({
    "&": {
      backgroundColor: "var(--color-code-bg)",
      color: "var(--color-code-text)",
      fontSize: "var(--font-size-sm)",
      borderRadius: "var(--radius-sm)",
      height: "100%",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: "var(--font-family-mono)",
      lineHeight: "var(--font-line-height-normal)",
    },
    ".cm-content": { caretColor: "var(--color-primary)", padding: "var(--space-xs) 0" },
    ".cm-gutters": {
      backgroundColor: "var(--color-code-bg)",
      color: "var(--color-text-subtle)",
      border: "none",
      borderInlineEnd: "var(--border-width-thin) dashed var(--color-border)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--color-primary)",
      borderLeftWidth: "var(--border-width-medium)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--color-selection)",
    },
    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-nip-highlight": {
      backgroundColor: "var(--color-code-highlight)",
      borderRadius: "var(--radius-sm)",
    },
    ".cm-lintRange-error": {
      backgroundImage: "none",
      textDecoration: "underline wavy var(--color-danger)",
    },
    ".cm-lintRange-warning": {
      backgroundImage: "none",
      textDecoration: "underline wavy var(--color-warning)",
    },
    ".cm-lintRange-info": {
      backgroundImage: "none",
      textDecoration: "underline dotted var(--color-info)",
    },
    ".cm-tooltip": {
      border: "var(--border-width-medium) solid var(--color-border-strong)",
      backgroundColor: "var(--color-surface-raised)",
      color: "var(--color-text)",
      boxShadow: "var(--shadow-pop-sm)",
      fontFamily: "var(--font-family-body)",
    },
  });

  let lastPath = "";
  const report = (offset: number) => {
    const path = pathAtOffset(value, offset);
    const key = JSON.stringify(path);
    if (path === undefined || key === lastPath) return;
    lastPath = key;
    onselectpath?.(path);
  };

  onMount(() => {
    if (host === undefined) return;
    const created = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          indentOnInput(),
          bracketMatching(),
          json(),
          syntaxHighlighting(style),
          marks,
          theme,
          EditorView.lineWrapping,
          EditorState.readOnly.of(readonly),
          EditorView.contentAttributes.of({
            // Already focusable as contenteditable; the explicit tabindex lets axe see that the
            // scrolling wrapper has keyboard-reachable content (no extra tab stop).
            tabindex: "0",
            "aria-label": label,
            "data-testid": `${testid}-content`,
            "aria-multiline": "true",
          }),
          // Tab indents, but Escape-then-Tab leaves the editor (CodeMirror's built-in escape
          // hatch), so keyboard users are never trapped.
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !u.transactions.some((tr) => tr.annotation(external) === true))
              value = u.state.doc.toString();
            if (u.selectionSet && u.view.hasFocus) report(u.state.selection.main.head);
          }),
          EditorView.domEventHandlers({
            mousemove: (e, v) => {
              const pos = v.posAtCoords({ x: e.clientX, y: e.clientY });
              if (pos !== null) report(pos);
            },
          }),
        ],
      }),
    });
    view = created;
    return () => created.destroy();
  });

  // Props → editor: replace the text when it changed outside (form edits, examples).
  $effect(() => {
    const v = view;
    const text = value;
    if (v === undefined || v.state.doc.toString() === text) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: text },
      annotations: external.of(true),
    });
  });
  $effect(() => {
    const v = view;
    if (v === undefined) return;
    const len = v.state.doc.length;
    v.dispatch(
      setDiagnostics(
        v.state,
        diagnostics.map((d) => ({ ...d, from: Math.min(d.from, len), to: Math.min(d.to, len) })),
      ),
    );
  });
  // Scroll only when the highlighted paths change, not on every keystroke (nearest: a no-op when
  // the node is already visible, e.g. under the caret or the pointer).
  let scrolledFor = "";
  $effect(() => {
    const v = view;
    const text = value;
    if (v === undefined) return;
    const key = JSON.stringify(highlight);
    const ranges = highlight
      .map((p) => rangeOfPath(text, p))
      .filter((r): r is { from: number; to: number } => r !== undefined && r.to > r.from)
      .sort((a, b) => a.from - b.from);
    const first = key === scrolledFor ? undefined : ranges[0];
    scrolledFor = key;
    v.dispatch({
      effects: [
        setMarks.of(
          Decoration.set(
            ranges.map((r) => mark.range(r.from, r.to)),
            true,
          ),
        ),
        ...(first === undefined ? [] : [EditorView.scrollIntoView(first.from)]),
      ],
    });
  });
</script>

<div class="json" data-testid={testid} data-diagnostics={diagnostics.length} bind:this={host}></div>

<style>
  .json {
    min-block-size: calc(var(--size-touch-target) * 5);
    max-block-size: 70vh;
    overflow: auto;
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    box-shadow: var(--shadow-pop-sm);
  }
  /* Touch devices: 16px+ keeps iOS from zooming into the editor when it takes focus. */
  @media (pointer: coarse) {
    .json :global(.cm-editor) {
      font-size: var(--font-size-md);
    }
  }
  .json:focus-within {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
</style>
