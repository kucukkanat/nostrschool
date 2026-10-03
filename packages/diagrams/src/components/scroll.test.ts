import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import type { SequenceLane, SequenceMessage, SwimlaneLane, SwimlaneStep } from "../types.ts";
import SequenceDiagram from "./SequenceDiagram.svelte";
import Swimlane from "./Swimlane.svelte";

afterEach(cleanup);
// happy-dom applies smooth scrolls on a later tick.
const settle = async (): Promise<void> => {
  flushSync();
  await new Promise((r) => setTimeout(r, 30));
};

/**
 * happy-dom has no layout engine, so we give elements the geometry a 300px phone would
 * produce (strip 300px wide, content 640px). Real components, real effects; only layout is supplied.
 */
const layout = (el: Element, rect: { left: number; width: number }): void => {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ ...rect, right: rect.left + rect.width, top: 0, bottom: 40, height: 40 }),
  });
};
const phone = (strip: HTMLElement): void => {
  Object.defineProperty(strip, "clientWidth", { configurable: true, value: 300 });
  Object.defineProperty(strip, "scrollWidth", { configurable: true, value: 640 });
  layout(strip, { left: 0, width: 300 });
};

describe("lane diagrams follow playback on narrow screens", () => {
  const lanes: SwimlaneLane[] = ["a", "b", "c", "d"].map((id) => ({ id, label: id.toUpperCase() }));
  const steps: SwimlaneStep[] = [
    { id: "s1", lane: "a", label: "One", to: "b" },
    { id: "s2", lane: "d", label: "Two" },
    { id: "s3", lane: "a", label: "Three" },
  ];

  test("Swimlane scrolls the current step into view and flags hidden edges with ink cues", async () => {
    const { getByTestId, queryByTestId } = render(Swimlane, {
      props: { testid: "sw", locale: "en", title: "Flow", lanes, steps },
    });
    const strip = getByTestId("sw-scroll");
    expect(strip.getAttribute("aria-label")).toBe("Flow");
    expect(strip.getAttribute("tabindex")).toBe("0");
    phone(strip);
    await fireEvent.scroll(strip);
    expect(strip.getAttribute("data-overflow-end")).toBe("true");
    expect(strip.getAttribute("data-overflow-start")).toBe("false");
    expect(getByTestId("sw-scroll-cue-end").getAttribute("aria-hidden")).toBe("true");
    expect(queryByTestId("sw-scroll-cue-start")).toBeNull();

    // Step 2 lives in lane "d" (x 480..640): the strip must scroll right to show it.
    layout(getByTestId("sw-step-s2"), { left: 500, width: 132 });
    await fireEvent.click(getByTestId("sw-controls-forward"));
    await settle();
    expect(strip.scrollLeft).toBeGreaterThan(300);
    await fireEvent.scroll(strip);
    expect(strip.getAttribute("data-overflow-start")).toBe("true");
    expect(getByTestId("sw-scroll-cue-start").textContent).toBe("←");

    // Back to lane "a": scrolls home again.
    const left = strip.scrollLeft;
    layout(getByTestId("sw-step-s3"), { left: 20 - left, width: 132 });
    await fireEvent.click(getByTestId("sw-controls-forward"));
    await settle();
    expect(strip.scrollLeft).toBe(4);
  });

  test("SequenceDiagram follows the current message", async () => {
    const seqLanes: SequenceLane[] = lanes;
    const messages: SequenceMessage[] = [
      { id: "m1", from: "a", to: "b", label: "hi" },
      { id: "m2", from: "c", to: "d", label: "far" },
    ];
    const { getByTestId } = render(SequenceDiagram, {
      props: { testid: "seq", locale: "en", title: "Wire", lanes: seqLanes, messages },
    });
    const strip = getByTestId("seq-scroll");
    phone(strip);
    layout(getByTestId("seq-message-m1"), { left: 80, width: 160 });
    await fireEvent.click(getByTestId("seq-controls-forward"));
    await settle();
    expect(strip.scrollLeft).toBe(0);
    layout(getByTestId("seq-message-m2"), { left: 400, width: 160 });
    await fireEvent.click(getByTestId("seq-controls-forward"));
    await settle();
    expect(strip.scrollLeft).toBe(276);
  });
});
