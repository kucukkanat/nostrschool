import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { popIn, travel } from "../logic/motion.ts";
import type { GraphLink, GraphNode, PipelineStage, SwimlaneLane, SwimlaneStep } from "../types.ts";
import ForceGraph from "./ForceGraph.svelte";
import Packet from "./Packet.svelte";
import Pipeline from "./Pipeline.svelte";
import Swimlane from "./Swimlane.svelte";

afterEach(cleanup);
const en = "en" as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("motion helpers", () => {
  test("run with and without reduced motion", async () => {
    const el = document.createElement("div");
    document.body.append(el);
    popIn(el, true);
    travel(el, 0, 10, true);
    expect(el.style.transform).toBe("");
    popIn(el, false);
    travel(el, 0, 10, false);
    await wait(5);
    expect(el.isConnected).toBe(true);
  });
});

describe("Packet", () => {
  test("defaults testid and label, takes size and custom label", () => {
    const { getByTestId } = render(Packet, { props: { type: "REQ" } });
    const el = getByTestId("packet-REQ");
    expect(el.textContent).toBe("REQ");
    expect(el.getAttribute("style")).toContain("var(--color-packet-req)");
    cleanup();
    const r = render(Packet, { props: { type: "custom", label: "HTTP", size: "sm", testid: "p" } });
    expect(r.getByTestId("p").className).toContain("sm");
    expect(r.getByTestId("p").textContent).toBe("HTTP");
  });
});

describe("Swimlane", () => {
  const lanes: SwimlaneLane[] = [
    { id: "app", label: "App" },
    { id: "signer", label: "Signer" },
  ];
  const steps: SwimlaneStep[] = [
    { id: "ask", lane: "app", label: "Ask", to: "signer", packet: "custom" },
    { id: "sign", lane: "signer", label: "Sign", narration: "The signer signs." },
    { id: "back", lane: "signer", label: "Return", to: "app" },
  ];
  const props = { testid: "sw", locale: en, title: "Signing", lanes, steps };

  test("renders lanes, the first step current and a text version", () => {
    const { getByTestId } = render(Swimlane, { props });
    expect(getByTestId("sw-lane-signer")).toBeTruthy();
    expect(getByTestId("sw-step-ask").getAttribute("data-state")).toBe("current");
    expect(getByTestId("sw-step-sign").getAttribute("data-state")).toBe("pending");
    expect(getByTestId("sw-narration").textContent).toBe("Step 1 (App): Ask — App to Signer");
    expect(getByTestId("sw-text").querySelectorAll("li")).toHaveLength(3);
  });

  test("steps forward and calls onstep", async () => {
    const seen: string[] = [];
    const { getByTestId } = render(Swimlane, {
      props: {
        ...props,
        onstep: (_: number, s: SwimlaneStep | undefined) => seen.push(s?.id ?? ""),
      },
    });
    await fireEvent.click(getByTestId("sw-controls-forward"));
    expect(getByTestId("sw-step-ask").getAttribute("data-state")).toBe("done");
    expect(getByTestId("sw-narration").textContent).toBe("The signer signs.");
    expect(seen).toEqual(["ask", "sign"]);
  });

  test("autoplay ticks on the token step duration", async () => {
    const { getByTestId } = render(Swimlane, { props: { ...props, current: 1 } });
    await fireEvent.click(getByTestId("sw-controls-play"));
    await wait(1500);
    flushSync();
    expect(getByTestId("sw-step-back").getAttribute("data-state")).toBe("current");
  });

  test("play at the end rewinds", async () => {
    const { getByTestId } = render(Swimlane, { props: { ...props, current: 2 } });
    await fireEvent.click(getByTestId("sw-controls-play"));
    // Play at the end rewinds to the first step.
    expect(getByTestId("sw-step-ask").getAttribute("data-state")).toBe("current");
    await fireEvent.click(getByTestId("sw-controls-play"));
    expect(getByTestId("sw-step-ask").getAttribute("data-state")).toBe("current");
    await wait(20);
    expect(getByTestId("sw-step-ask").getAttribute("data-state")).toBe("current");
  });

  test("invalid lanes show an error", () => {
    const { getByTestId, queryByTestId } = render(Swimlane, {
      props: { ...props, steps: [{ id: "x", lane: "ghost", label: "?" }] },
    });
    expect(getByTestId("sw-error").getAttribute("data-code")).toBe("unknown-ref");
    expect(queryByTestId("sw-text")).toBeNull();
  });
});

describe("Pipeline", () => {
  const long = "a".repeat(80);
  const stages: PipelineStage[] = [
    { id: "ser", label: "Serialize", value: "[0,...]", description: "Make the canonical array" },
    { id: "hash", label: "Hash", value: long },
    { id: "sign", label: "Sign" },
  ];
  const props = { testid: "pipe", locale: en, title: "Event id", stages };

  test("idle until a stage is chosen; clicking selects", async () => {
    const { getByTestId } = render(Pipeline, { props });
    expect(getByTestId("pipe-narration").textContent).toBe("Not started yet.");
    expect(getByTestId("pipe-stage-ser").getAttribute("data-state")).toBe("pending");
    await fireEvent.click(getByTestId("pipe-stage-hash-select"));
    expect(getByTestId("pipe-stage-ser").getAttribute("data-state")).toBe("done");
    expect(getByTestId("pipe-stage-hash").getAttribute("data-state")).toBe("active");
    expect(getByTestId("pipe-narration").textContent).toBe("Stage 2: Hash");
    await fireEvent.click(getByTestId("pipe-stage-ser-select"));
    expect(getByTestId("pipe-narration").textContent).toBe(
      "Stage 1: Serialize. Make the canonical array",
    );
  });

  test("long values are clipped and expandable", async () => {
    const { getByTestId, queryByTestId } = render(Pipeline, { props });
    const card = getByTestId("pipe-stage-hash");
    expect(card.querySelector("code")?.textContent).toHaveLength(48);
    expect(queryByTestId("pipe-stage-ser-expand")).toBeNull();
    await fireEvent.click(getByTestId("pipe-stage-hash-expand"));
    expect(card.querySelector("code")?.textContent).toBe(long);
    expect(getByTestId("pipe-stage-hash-expand").getAttribute("aria-expanded")).toBe("true");
    await fireEvent.click(getByTestId("pipe-stage-hash-expand"));
    expect(card.querySelector("code")?.textContent).toHaveLength(48);
  });

  test("ok and error statuses", () => {
    const ok = render(Pipeline, { props: { ...props, status: "ok", active: 2 } });
    expect(ok.getByTestId("pipe-narration").textContent).toBe("All stages complete.");
    expect(ok.getByTestId("pipe-stage-sign").getAttribute("data-state")).toBe("done");
    cleanup();
    const bad = render(Pipeline, { props: { ...props, status: "error", active: 2, errorAt: 1 } });
    expect(bad.getByTestId("pipe-stage-hash").getAttribute("data-state")).toBe("error");
    expect(bad.getByTestId("pipe-narration").textContent).toBe("Failed at Hash");
  });

  test("duplicate stage ids show an error", () => {
    const { getByTestId } = render(Pipeline, {
      props: { ...props, stages: [stages[0], stages[0]].flatMap((s) => (s ? [s] : [])) },
    });
    expect(getByTestId("pipe-error").getAttribute("data-code")).toBe("duplicate-id");
  });
});

describe("ForceGraph", () => {
  const nodes: GraphNode[] = [
    { id: "a", label: "Alice", group: "x", avatar: "data:image/svg+xml,%3Csvg/%3E" },
    { id: "b", label: "Bob", group: "y" },
    { id: "c", label: "Carol" },
  ];
  const links: GraphLink[] = [
    { source: "a", target: "b" },
    { source: "b", target: "c", kind: "mutual" },
    { source: "c", target: "a", kind: "relay" },
  ];
  const props = {
    testid: "g",
    locale: en,
    title: "Follows",
    nodes,
    links,
    width: 300,
    height: 200,
  };

  test("renders nodes with roving tabindex, avatars and a table", () => {
    const { getByTestId } = render(ForceGraph, { props });
    expect(getByTestId("g-node-a").getAttribute("tabindex")).toBe("0");
    expect(getByTestId("g-node-b").getAttribute("tabindex")).toBe("-1");
    expect(getByTestId("g-node-a").querySelector("image")).toBeTruthy();
    expect(getByTestId("g-node-b").querySelector(".initial")?.textContent?.trim()).toBe("B");
    const rows = getByTestId("g-table").querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain("Bob");
    expect(rows[0]?.textContent).toContain("Nobody");
    expect(getByTestId("g-narration").textContent).toBe("Select a person");
  });

  test("each node carries its own focus halo outside the shape group", () => {
    const { getByTestId } = render(ForceGraph, { props });
    for (const id of ["a", "b", "c"]) {
      const halo = getByTestId(`g-node-${id}-focus`);
      expect(halo.tagName.toLowerCase()).toBe("circle");
      expect(halo.parentElement).toBe(getByTestId(`g-node-${id}`));
      expect(halo.closest(".shape")).toBeNull();
    }
  });

  test("click selects and toggles; Escape clears", async () => {
    const picked: (string | null)[] = [];
    const { getByTestId } = render(ForceGraph, {
      props: { ...props, onselect: (id: string | null) => picked.push(id) },
    });
    await fireEvent.click(getByTestId("g-node-b"));
    expect(getByTestId("g-node-b").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("g-narration").textContent).toBe("Bob, follows 1, followed by 2");
    expect(getByTestId("g-node-b").getAttribute("tabindex")).toBe("0");
    await fireEvent.keyDown(getByTestId("g-node-b"), { key: "Escape" });
    expect(getByTestId("g-narration").textContent).toBe("Selection cleared.");
    await fireEvent.keyDown(getByTestId("g-node-b"), { key: "Escape" });
    await fireEvent.click(getByTestId("g-node-c"));
    await fireEvent.click(getByTestId("g-node-c"));
    expect(picked).toEqual(["b", null, "c", null]);
  });

  test("keyboard moves focus and Enter/Space select", async () => {
    const { getByTestId } = render(ForceGraph, { props });
    const ids = ["a", "b", "c"];
    const a = getByTestId("g-node-a");
    a.focus();
    await fireEvent.keyDown(a, { key: "End" });
    expect(document.activeElement?.getAttribute("data-node")).toBe("c");
    await fireEvent.keyDown(document.activeElement as Element, { key: "Home" });
    expect(document.activeElement?.getAttribute("data-node")).toBe("a");
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      await fireEvent.keyDown(document.activeElement as Element, { key });
      expect(ids).toContain(document.activeElement?.getAttribute("data-node") ?? "");
    }
    const focused = document.activeElement as Element;
    await fireEvent.keyDown(focused, { key: "Enter" });
    expect(focused.getAttribute("aria-pressed")).toBe("true");
    await fireEvent.keyDown(focused, { key: " " });
    expect(focused.getAttribute("aria-pressed")).toBe("false");
    await fireEvent.keyDown(focused, { key: "x" });
    expect(focused.getAttribute("aria-pressed")).toBe("false");
  });

  test("dragging moves a node without selecting it", async () => {
    const { getByTestId, container } = render(ForceGraph, { props });
    const node = getByTestId("g-node-b");
    const svg = container.querySelector("svg.svg") as SVGSVGElement;
    const before = node.getAttribute("transform");
    await fireEvent.pointerDown(node, { pointerId: 1, clientX: 0, clientY: 0 });
    await fireEvent.pointerMove(svg, { pointerId: 1, clientX: 5, clientY: 5 });
    await wait(40);
    flushSync();
    await fireEvent.pointerUp(svg, { pointerId: 1 });
    await fireEvent.click(node);
    expect(node.getAttribute("aria-pressed")).toBe("false");
    expect(node.getAttribute("transform")).not.toBe(before);
    await fireEvent.pointerMove(svg, { pointerId: 1, clientX: 9, clientY: 9 });
    await fireEvent.pointerUp(svg, { pointerId: 1 });
    await fireEvent.click(node);
    expect(node.getAttribute("aria-pressed")).toBe("true");
  });

  test("highlight prop emphasizes nodes; invalid links error", () => {
    const r = render(ForceGraph, { props: { ...props, highlight: ["a"] } });
    expect(r.getByTestId("g-node-b").classList.contains("faded")).toBe(true);
    expect(r.getByTestId("g-node-a").classList.contains("faded")).toBe(false);
    cleanup();
    const bad = render(ForceGraph, { props: { ...props, links: [{ source: "a", target: "z" }] } });
    expect(bad.getByTestId("g-error").getAttribute("data-code")).toBe("unknown-ref");
  });
});
