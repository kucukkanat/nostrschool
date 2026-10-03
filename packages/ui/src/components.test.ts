import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { mascotBus } from "./bus.ts";
import {
  $alwaysExpandDrawers as alwaysExpand,
  Badge,
  Button,
  Callout,
  Card,
  CodeBlock,
  CopyButton,
  Drawer,
  JsonView,
  PlaybackControls,
  Quiz,
  Stepper,
  Tabs,
  Takeaway,
  Term,
  Toggle,
  Tooltip,
  VisuallyHidden,
} from "./index.ts";
import { text, tick } from "./test-helpers.ts";

afterEach(() => {
  cleanup();
  alwaysExpand.set(false);
});

describe("Button", () => {
  test("renders with data-testid and fires onclick", async () => {
    let clicks = 0;
    const { getByTestId } = render(Button, {
      props: { testid: "go", onclick: () => clicks++, children: text("Go") },
    });
    const btn = getByTestId("go");
    await fireEvent.pointerDown(btn);
    await fireEvent.pointerUp(btn);
    await fireEvent.click(btn);
    expect(clicks).toBe(1);
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.className).toContain("primary");
  });
  test("loading blocks clicks and shows a spinner", async () => {
    let clicks = 0;
    const { getByTestId } = render(Button, {
      props: {
        testid: "b",
        loading: true,
        onclick: () => clicks++,
        icon: text("*"),
        children: text("Save"),
      },
    });
    expect(getByTestId("b").getAttribute("aria-busy")).toBe("true");
    expect((getByTestId("b") as HTMLButtonElement).disabled).toBe(true);
    expect(getByTestId("b-spinner")).toBeTruthy();
  });
  test("toggle button, icon and aria-label", () => {
    const { getByTestId } = render(Button, {
      props: {
        testid: "t",
        pressed: true,
        ariaLabel: "Bold",
        variant: "ghost",
        size: "sm",
        icon: text("B"),
      },
    });
    expect(getByTestId("t").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("t").getAttribute("aria-label")).toBe("Bold");
  });
  test("href renders a link; disabled link loses its href", () => {
    const a = render(Button, { props: { testid: "l", href: "/x", children: text("X") } });
    expect(a.getByTestId("l").tagName).toBe("A");
    expect(a.getByTestId("l").getAttribute("href")).toBe("/x");
    cleanup();
    const b = render(Button, {
      props: { testid: "l", href: "/x", disabled: true, children: text("X") },
    });
    expect(b.getByTestId("l").hasAttribute("href")).toBe(false);
    expect(b.getByTestId("l").getAttribute("aria-disabled")).toBe("true");
  });
  test("press feedback is pure CSS (no inline transform from JS)", async () => {
    const { getByTestId } = render(Button, { props: { testid: "r", children: text("R") } });
    await fireEvent.pointerDown(getByTestId("r"));
    await fireEvent.pointerLeave(getByTestId("r"));
    expect(getByTestId("r").style.transform).toBe("");
  });
});

describe("static primitives", () => {
  test("Card renders header, body and footer", () => {
    const { getByTestId } = render(Card, {
      props: {
        testid: "c",
        as: "article",
        variant: "highlight",
        header: text("H"),
        footer: text("F"),
        children: text("Body"),
      },
    });
    expect(getByTestId("c").tagName).toBe("ARTICLE");
    expect(getByTestId("c-header").textContent).toBe("H");
    expect(getByTestId("c-footer").textContent).toBe("F");
  });
  test("Card defaults", () => {
    const { getByTestId, queryByTestId } = render(Card, { props: { children: text("Body") } });
    expect(getByTestId("card").className).toContain("plain");
    expect(queryByTestId("card-header")).toBeNull();
  });
  test("Badge tones, live dot", () => {
    const { getByTestId } = render(Badge, {
      props: { testid: "b", tone: "live", size: "sm", children: text("LIVE") },
    });
    expect(getByTestId("b").dataset["tone"]).toBe("live");
    expect(getByTestId("b").querySelector(".dot")).toBeTruthy();
    cleanup();
    expect(
      render(Badge, { props: { children: text("x") } }).getByTestId("badge").dataset["tone"],
    ).toBe("neutral");
  });
  test("Callout uses the localized tone title and is a labelled note", () => {
    const { getByTestId } = render(Callout, {
      props: { locale: "en", tone: "warning", children: text("Careful") },
    });
    const el = getByTestId("callout");
    expect(el.getAttribute("role")).toBe("note");
    expect(getByTestId("callout-title").textContent).toBe("Warning");
    expect(el.getAttribute("aria-labelledby")).toBe(getByTestId("callout-title").id);
  });
  test("Callout custom title", () => {
    const { getByTestId } = render(Callout, {
      props: { testid: "k", locale: "es", tone: "safety", title: "Keys!", children: text("x") },
    });
    expect(getByTestId("k-title").textContent).toBe("Keys!");
  });
  test("Takeaway lists points under a localized heading", () => {
    const { getByTestId, getByRole } = render(Takeaway, {
      props: { locale: "en", points: ["One", "Two"] },
    });
    expect(getByRole("heading").textContent).toBe("Key takeaways");
    expect(getByTestId("takeaway-point-1").textContent).toBe("Two");
    cleanup();
    expect(
      render(Takeaway, { props: { locale: "en", title: "TL;DR", points: [] } }).getByRole("heading")
        .textContent,
    ).toBe("TL;DR");
  });
});

describe("Drawer", () => {
  test("toggles and shows localized labels", async () => {
    const { getByTestId } = render(Drawer, {
      props: { testid: "d", locale: "en", children: text("Raw bytes") },
    });
    const details = getByTestId("d") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(getByTestId("d-toggle").textContent).toContain("Under the hood");
    expect(getByTestId("d-toggle").textContent).toContain("Show details");
    details.open = true;
    await fireEvent(details, new Event("toggle"));
    expect(getByTestId("d-toggle").textContent).toContain("Hide details");
    expect(getByTestId("d-content").textContent).toContain("Raw bytes");
  });
  test("'always expand' persists and opens every drawer", async () => {
    const { getByTestId } = render(Drawer, {
      props: { testid: "d1", locale: "en", title: "Bytes", children: text("x") },
    });
    const box = getByTestId("d1-always") as HTMLInputElement;
    box.checked = true;
    await fireEvent.change(box);
    expect(alwaysExpand.get()).toBe(true);
    expect(localStorage.getItem("nostrschool:always-expand")).toBe("1");
    await tick();
    expect((getByTestId("d1") as HTMLDetailsElement).open).toBe(true);
    // A drawer mounted later starts open.
    cleanup();
    alwaysExpand.set(true);
    const second = render(Drawer, { props: { testid: "d2", locale: "en", children: text("y") } });
    await tick();
    expect((second.getByTestId("d2") as HTMLDetailsElement).open).toBe(true);
    expect((second.getByTestId("d2-always") as HTMLInputElement).checked).toBe(true);
  });
});

describe("Term", () => {
  test("links to the glossary and shows a card on hover/focus, Escape closes", async () => {
    const { getByTestId } = render(Term, {
      props: {
        id: "relay",
        locale: "en",
        glossaryHref: "/en/glossary/#relay",
        children: text("relays"),
      },
    });
    const link = getByTestId("term-relay");
    const card = getByTestId("term-relay-card");
    expect(link.getAttribute("href")).toBe("/en/glossary/#relay");
    expect(link.getAttribute("aria-describedby")).toBe(card.id);
    expect(card.hidden).toBe(true);
    await fireEvent.focusIn(link);
    expect(card.hidden).toBe(false);
    expect(getByTestId("term-relay-more").getAttribute("href")).toBe("/en/glossary/#relay");
    expect(card.textContent).toContain("Relay");
    await fireEvent.keyDown(link, { key: "Escape" });
    expect(card.hidden).toBe(true);
  });
  test("hover opens; leaving closes after a grace period", async () => {
    const { getByTestId } = render(Term, {
      props: { id: "nostr", locale: "es", glossaryHref: "#", testid: "t" },
    });
    const wrap = getByTestId("t").parentElement as HTMLElement;
    expect(getByTestId("t").textContent?.trim().length).toBeGreaterThan(0);
    await fireEvent.mouseEnter(wrap);
    expect(getByTestId("t-card").hidden).toBe(false);
    await fireEvent.mouseLeave(wrap);
    await fireEvent.mouseEnter(wrap); // re-entering cancels the pending close
    await fireEvent.mouseLeave(wrap);
    await fireEvent.focusOut(getByTestId("t"));
    await tick(450);
    expect(getByTestId("t-card").hidden).toBe(true);
  });
  test("adds no stray whitespace before following punctuation", () => {
    const p = document.createElement("p");
    p.append("a ");
    document.body.append(p);
    render(Term, {
      target: p,
      props: { id: "relay", locale: "en", glossaryHref: "#", children: text("x") },
    });
    p.append(", b");
    // The card's collapsed copy is hidden; only the visible flow text matters here.
    const clone = p.cloneNode(true) as HTMLElement;
    for (const card of clone.querySelectorAll(".card")) card.remove();
    expect(clone.textContent).toBe("a x, b");
    p.remove();
  });
  test("an open card is translated to stay inside the viewport", async () => {
    const { getByTestId } = render(Term, {
      props: { id: "relay", locale: "en", glossaryHref: "#", testid: "v" },
    });
    await fireEvent.focusIn(getByTestId("v"));
    await tick();
    // happy-dom has no layout (rect = 0 at x=0), so the card is pushed in to the viewport margin.
    expect(getByTestId("v-card").style.translate).toBe("16px 0");
  });
  test("touch: first tap opens the card instead of navigating, second tap or a tap outside closes", async () => {
    const { getByTestId } = render(Term, {
      props: { id: "relay", locale: "en", glossaryHref: "/g", testid: "tt" },
    });
    const link = getByTestId("tt");
    const card = getByTestId("tt-card");
    const tap = (target: Element) => {
      target.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }),
      );
      const click = new MouseEvent("click", { bubbles: true, cancelable: true });
      target.dispatchEvent(click);
      return click;
    };
    expect(tap(link).defaultPrevented).toBe(true);
    await tick();
    expect(card.hidden).toBe(false);
    expect(tap(link).defaultPrevented).toBe(true);
    await tick();
    expect(card.hidden).toBe(true);
    tap(link);
    await tick();
    expect(card.hidden).toBe(false);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await tick();
    expect(card.hidden).toBe(true);
  });
  test("mouse clicks still follow the glossary link", async () => {
    const { getByTestId } = render(Term, {
      props: { id: "relay", locale: "en", glossaryHref: "/g", testid: "tm" },
    });
    const link = getByTestId("tm");
    link.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "mouse", bubbles: true }));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    // Keep happy-dom from actually navigating; we only care whether the component cancelled it.
    link.addEventListener("click", (e) => {
      expect(e.defaultPrevented).toBe(false);
      e.preventDefault();
    });
    link.dispatchEvent(click);
  });
  test("missing glossary entry renders a pending card instead of crashing", async () => {
    const { getByTestId } = render(Term, {
      props: { id: "brand-new" as "relay", locale: "en", glossaryHref: "#" },
    });
    expect(getByTestId("term-brand-new").textContent?.trim()).toBe("brand-new");
    expect(getByTestId("term-brand-new-card").dataset["status"]).toBe("pending");
    await fireEvent.keyDown(getByTestId("term-brand-new"), { key: "Escape" });
  });
});

describe("Toggle", () => {
  test("is a switch reporting changes", async () => {
    const seen: boolean[] = [];
    const { getByTestId, getByRole } = render(Toggle, {
      props: {
        testid: "live",
        label: "Go live",
        description: "Real relays",
        onchange: (v: boolean) => seen.push(v),
      },
    });
    const input = getByRole("switch") as HTMLInputElement;
    expect(input.dataset["testid"]).toBe("live-input");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    await fireEvent.click(input);
    expect(seen).toEqual([true]);
    expect(getByTestId("live").dataset["checked"]).toBe("true");
  });
  test("disabled without description", () => {
    const { getByRole } = render(Toggle, { props: { testid: "x", label: "X", disabled: true } });
    expect((getByRole("switch") as HTMLInputElement).disabled).toBe(true);
  });
});

describe("Tabs", () => {
  const tabs = [
    { id: "hex", label: "Hex" },
    { id: "off", label: "Off", disabled: true },
    { id: "npub", label: "npub" },
  ];
  const panel = createRawSnippet((id: () => string) => ({ render: () => `<p>panel:${id()}</p>` }));
  test("click and arrow keys select (skipping disabled), with roving tabindex", async () => {
    const changes: string[] = [];
    const { getByTestId } = render(Tabs, {
      props: {
        testid: "tb",
        tabs,
        label: "Formats",
        panel,
        onchange: (id: string) => changes.push(id),
      },
    });
    expect(getByTestId("tb-panel").textContent).toContain("panel:hex");
    expect(getByTestId("tb-tab-hex").getAttribute("tabindex")).toBe("0");
    await fireEvent.keyDown(getByTestId("tb-tab-hex"), { key: "ArrowRight" });
    expect(getByTestId("tb-tab-npub").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(getByTestId("tb-tab-npub"));
    await fireEvent.keyDown(getByTestId("tb-tab-npub"), { key: "x" });
    await fireEvent.click(getByTestId("tb-tab-hex"));
    await fireEvent.click(getByTestId("tb-tab-hex"));
    expect(changes).toEqual(["npub", "hex"]);
    expect(getByTestId("tb-panel").getAttribute("aria-labelledby")).toBe(
      getByTestId("tb-tab-hex").id,
    );
  });
  test("ignores a selected id that is disabled or unknown", () => {
    const { getByTestId } = render(Tabs, {
      props: { testid: "tb", tabs, label: "F", panel, selected: "off" },
    });
    expect(getByTestId("tb-panel").textContent).toContain("panel:hex");
    cleanup();
    const all = render(Tabs, {
      props: { testid: "e", tabs: [{ id: "a", label: "A", disabled: true }], label: "F", panel },
    });
    expect(all.getByTestId("e-panel").textContent).toContain("panel:");
  });
});

describe("CodeBlock + CopyButton", () => {
  test("highlights tokens and lines; copy writes to the clipboard", async () => {
    const code = '{\n  "kind": 1\n}';
    const { getByTestId } = render(CodeBlock, {
      props: {
        testid: "cb",
        locale: "en",
        code,
        lang: "json",
        caption: "An event",
        highlightLines: [2],
      },
    });
    expect(getByTestId("cb").dataset["lang"]).toBe("json");
    expect(getByTestId("cb-caption").textContent).toBe("An event");
    expect(getByTestId("cb-line-2").textContent).toBe('  "kind": 1');
    expect(getByTestId("cb").querySelector(".t-key")?.textContent).toBe('"kind"');
    await fireEvent.click(getByTestId("cb-copy"));
    await tick();
    expect(await navigator.clipboard.readText()).toBe(code);
    expect(getByTestId("cb-copy").dataset["status"]).toBe("copied");
    expect(getByTestId("cb-copy-status").textContent?.trim()).toBe("Copied!");
  });
  test("non-copyable plain text", () => {
    const { queryByTestId, getByTestId } = render(CodeBlock, {
      props: { testid: "p", locale: "en", code: "hi", copyable: false },
    });
    expect(queryByTestId("p-copy")).toBeNull();
    expect(getByTestId("p").textContent).toContain("hi");
  });
  test("CopyButton with label resets to idle after the step duration", async () => {
    const { getByTestId } = render(CopyButton, {
      props: { testid: "cp", locale: "en", value: "nsec1…", label: "Copy key", size: "lg" },
    });
    expect(getByTestId("cp").textContent).toContain("Copy key");
    expect(getByTestId("cp").hasAttribute("aria-label")).toBe(false);
    await fireEvent.click(getByTestId("cp"));
    await fireEvent.click(getByTestId("cp"));
    await tick(1500);
    expect(getByTestId("cp").dataset["status"]).toBe("idle");
  });
});

describe("JsonView", () => {
  const event = {
    id: "ab",
    kind: 1,
    tags: [["p", "cafe"]],
    content: "hi there",
    ok: true,
    none: null,
  };
  test("renders paths, highlights and selection", async () => {
    const picked: string[] = [];
    const { getByTestId } = render(JsonView, {
      props: {
        testid: "jv",
        locale: "en",
        value: event,
        highlightPaths: ["tags.0.1"],
        onselectpath: (p: string) => picked.push(p),
      },
    });
    expect(getByTestId("jv-root")).toBeTruthy();
    expect(getByTestId("jv-path-tags.0.1").textContent).toBe('"cafe"');
    expect(getByTestId("jv-path-tags.0.1").closest(".row")?.classList.contains("hl")).toBe(true);
    expect(getByTestId("jv-path-content").textContent).toBe('"hi there"');
    await fireEvent.click(getByTestId("jv-path-kind"));
    await fireEvent.click(getByTestId("jv-select-tags"));
    expect(picked).toEqual(["kind", "tags"]);
  });
  test("collapses beyond collapsedDepth except toward highlights, toggles open", async () => {
    const { getByTestId, queryByTestId } = render(JsonView, {
      props: {
        testid: "jv",
        locale: "en",
        value: { a: { b: 1 }, c: { d: [1, 2] } },
        collapsedDepth: 1,
        highlightPaths: ["a.b"],
      },
    });
    expect(getByTestId("jv-path-a.b")).toBeTruthy();
    expect(queryByTestId("jv-path-c.d")).toBeNull();
    expect(getByTestId("jv-path-c").textContent).toContain("1 item");
    const toggle = getByTestId("jv-toggle-c");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await fireEvent.click(toggle);
    expect(getByTestId("jv-path-c.d")).toBeTruthy();
    await fireEvent.click(getByTestId("jv-toggle-root"));
    expect(queryByTestId("jv-path-a")).toBeNull();
    await fireEvent.click(getByTestId("jv-summary-root"));
    expect(getByTestId("jv-path-a")).toBeTruthy();
  });
});

describe("Quiz", () => {
  const options = [
    { id: "a", label: "The author", correct: true, explanation: "Only the key holder can sign." },
    { id: "b", label: "The relay", correct: false, explanation: "Relays just store and forward." },
  ];
  test("emits quiz:correct on the mascot bus", async () => {
    const events: string[] = [];
    const answers: boolean[] = [];
    const off = mascotBus.onAny((e) =>
      events.push(`${e.type}:${"quizId" in e.payload ? e.payload.quizId : ""}`),
    );
    const { getByTestId } = render(Quiz, {
      props: {
        testid: "q1",
        locale: "en",
        question: "Who signs events?",
        options,
        onanswer: (c: boolean) => answers.push(c),
      },
    });
    expect((getByTestId("q1-check") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("q1-option-a"));
    await fireEvent.click(getByTestId("q1-check"));
    off();
    expect(events).toEqual(["quiz:correct:q1"]);
    expect(answers).toEqual([true]);
    expect(getByTestId("q1-feedback").textContent).toContain("Correct");
    // A stamped glyph carries the verdict (no decorative emoji).
    expect(getByTestId("q1-feedback").textContent).toContain("✓");
    expect(getByTestId("q1").dataset["result"]).toBe("correct");
    expect(getByTestId("q1-explanation-a").textContent).toContain("key holder");
  });
  test("wrong answer emits quiz:wrong, locks options, retry resets", async () => {
    const events: string[] = [];
    const off = mascotBus.on("quiz:wrong", ({ quizId }) => events.push(quizId));
    const { getByTestId, queryByTestId } = render(Quiz, {
      props: { testid: "q2", locale: "en", question: "Who signs?", options },
    });
    await fireEvent.click(getByTestId("q2-option-b"));
    await fireEvent.click(getByTestId("q2-check"));
    off();
    expect(events).toEqual(["q2"]);
    expect(getByTestId("q2-feedback").textContent).toContain("Not quite");
    expect(getByTestId("q2-feedback").textContent).toContain("✗");
    expect((getByTestId("q2-option-a") as HTMLInputElement).disabled).toBe(true);
    expect(queryByTestId("q2-explanation-a")).toBeNull(); // no answer reveal
    await fireEvent.click(getByTestId("q2-retry"));
    expect(getByTestId("q2").dataset["result"]).toBe("pending");
    expect((getByTestId("q2-option-b") as HTMLInputElement).checked).toBe(false);
  });
  test("multiple choice uses checkboxes and the 'all that apply' hint", async () => {
    const { getByTestId, getByText } = render(Quiz, {
      props: {
        testid: "q3",
        locale: "en",
        question: "Which are kinds?",
        multiple: true,
        options: [
          { id: "x", label: "1", correct: true },
          { id: "y", label: "3", correct: true },
        ],
      },
    });
    expect((getByTestId("q3-option-x") as HTMLInputElement).type).toBe("checkbox");
    expect(getByText("Choose all that apply")).toBeTruthy();
    await fireEvent.click(getByTestId("q3-option-x"));
    await fireEvent.click(getByTestId("q3-option-y"));
    await fireEvent.click(getByTestId("q3-check"));
    expect(getByTestId("q3").dataset["result"]).toBe("correct");
  });
});

describe("Stepper", () => {
  test("marks the current step and changes on click; arrows move focus", async () => {
    const seen: number[] = [];
    const steps = [
      { id: "serialize", label: "Serialize" },
      { id: "hash", label: "Hash" },
      { id: "sign", label: "Sign" },
    ];
    const { getByTestId } = render(Stepper, {
      props: {
        testid: "st",
        locale: "en",
        steps,
        current: 1,
        onchange: (i: number) => seen.push(i),
      },
    });
    expect(getByTestId("st").getAttribute("aria-label")).toBe("Steps");
    expect(getByTestId("st-step-hash").getAttribute("aria-current")).toBe("step");
    expect(getByTestId("st-step-serialize").closest("li")?.dataset["state"]).toBe("done");
    await fireEvent.click(getByTestId("st-step-sign"));
    await fireEvent.click(getByTestId("st-step-sign"));
    expect(seen).toEqual([2]);
    await fireEvent.keyDown(getByTestId("st-step-sign"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(getByTestId("st-step-serialize"));
    await fireEvent.keyDown(getByTestId("st-step-serialize"), { key: "Tab" });
  });
});

describe("PlaybackControls", () => {
  test("clamps steps and reports status", async () => {
    const steps: number[] = [];
    const { getByTestId } = render(PlaybackControls, {
      props: { testid: "pb", locale: "en", totalSteps: 3, onstep: (s: number) => steps.push(s) },
    });
    expect((getByTestId("pb-back") as HTMLButtonElement).disabled).toBe(true);
    expect(getByTestId("pb-status").textContent).toContain("Step 1 of 3");
    await fireEvent.click(getByTestId("pb-forward"));
    expect(getByTestId("pb-status").textContent).toContain("Step 2 of 3");
    const scrub = getByTestId("pb-scrub") as HTMLInputElement;
    scrub.value = "2";
    await fireEvent.input(scrub);
    expect((getByTestId("pb-forward") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("pb-back"));
    await fireEvent.click(getByTestId("pb-reset"));
    expect(steps).toEqual([1, 2, 1, 0]);
  });
  test("play toggles, restarts from the end, and the speed select appears when bound", async () => {
    const { getByTestId } = render(PlaybackControls, {
      props: { testid: "pb", locale: "en", totalSteps: 2, step: 1, speed: 1 },
    });
    const play = getByTestId("pb-play");
    expect(play.getAttribute("aria-label")).toBe("Play");
    await fireEvent.click(play);
    expect(play.getAttribute("aria-label")).toBe("Pause");
    expect(getByTestId("pb-status").textContent).toContain("Step 1 of 2");
    expect(getByTestId("pb").dataset["playing"]).toBe("true");
    await fireEvent.click(play);
    const speed = getByTestId("pb-speed") as HTMLSelectElement;
    speed.value = "2";
    await fireEvent.change(speed);
    expect(speed.value).toBe("2");
  });
  test("no speed control unless speed is provided; single step disables play", () => {
    const { queryByTestId, getByTestId } = render(PlaybackControls, {
      props: { testid: "pb", locale: "en", totalSteps: 1 },
    });
    expect(queryByTestId("pb-speed")).toBeNull();
    expect((getByTestId("pb-play") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Tooltip", () => {
  test("describes its focusable child; Escape dismisses until leaving", async () => {
    const child = createRawSnippet(() => ({ render: () => `<button>?</button>` }));
    const { getByTestId } = render(Tooltip, {
      props: { testid: "tt", content: "Hex = base16", placement: "bottom", children: child },
    });
    await tick();
    const btn = getByTestId("tt").querySelector("button") as HTMLButtonElement;
    expect(getByTestId("tt-content").getAttribute("role")).toBe("tooltip");
    expect(btn.getAttribute("aria-describedby")).toBe(getByTestId("tt-content").id);
    await fireEvent.keyDown(btn, { key: "Escape" });
    expect(getByTestId("tt").classList.contains("dismissed")).toBe(true);
    await fireEvent.mouseLeave(getByTestId("tt"));
    expect(getByTestId("tt").classList.contains("dismissed")).toBe(false);
    await fireEvent.keyDown(btn, { key: "a" });
    await fireEvent.focusOut(btn);
  });
  test("non-interactive child makes the wrapper focusable", async () => {
    const { getByTestId } = render(Tooltip, { props: { content: "tip", children: text("label") } });
    await tick();
    expect(getByTestId("tooltip").tabIndex).toBe(0);
    expect(getByTestId("tooltip").getAttribute("aria-describedby")).toBe(
      getByTestId("tooltip-content").id,
    );
  });
});

describe("VisuallyHidden", () => {
  test("renders screen-reader-only text, passing attributes through", () => {
    const { getByTestId } = render(VisuallyHidden, {
      props: { testid: "vh", role: "status", children: text("Copied") },
    });
    const el = getByTestId("vh");
    expect(el.tagName).toBe("SPAN");
    expect(el.classList.contains("visually-hidden")).toBe(true);
    expect(el.getAttribute("role")).toBe("status");
    expect(el.textContent).toBe("Copied");
  });
  test("can render a block element", () => {
    const { getByTestId } = render(VisuallyHidden, {
      props: { testid: "vh-div", as: "div", children: text("Hidden heading") },
    });
    expect(getByTestId("vh-div").tagName).toBe("DIV");
  });
});
