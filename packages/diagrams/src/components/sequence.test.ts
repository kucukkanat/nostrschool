import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet, flushSync } from "svelte";
import type { SequenceLane, SequenceMessage } from "../types.ts";
import SequenceDiagram from "./SequenceDiagram.svelte";

afterEach(cleanup);

const lanes: SequenceLane[] = [
  { id: "client", label: "Client", kind: "client" },
  { id: "relay", label: "Relay", kind: "relay" },
];
const messages: SequenceMessage[] = [
  {
    id: "m1",
    from: "client",
    to: "relay",
    label: "REQ",
    packet: "REQ",
    narration: "Subscribe.",
    payload: ["REQ", "s1", {}],
  },
  { id: "m2", from: "relay", to: "client", label: "EOSE", packet: "EOSE" },
  { id: "m3", from: "relay", to: "relay", label: "store", narration: "Relay stores it." },
];
const base = { testid: "seq", locale: "en" as const, title: "Wire", lanes, messages };

describe("SequenceDiagram", () => {
  test("starts before the first message and narrates the start", () => {
    const { getByTestId } = render(SequenceDiagram, { props: base });
    expect(getByTestId("seq-narration").textContent).toContain("Ready");
    expect(getByTestId("seq-message-m1").getAttribute("data-state")).toBe("pending");
    expect(getByTestId("seq-lane-relay").getAttribute("data-kind")).toBe("relay");
    expect(getByTestId("seq-controls-status").textContent).toContain("1 of 4");
  });

  test("stepping forward sends messages, shows detail and calls onstep", async () => {
    const seen: number[] = [];
    const { getByTestId, queryByTestId } = render(SequenceDiagram, {
      props: { ...base, onstep: (s: number) => seen.push(s) },
    });
    await fireEvent.click(getByTestId("seq-controls-forward"));
    expect(getByTestId("seq-message-m1").getAttribute("data-state")).toBe("current");
    expect(getByTestId("seq-narration").textContent).toBe("Subscribe.");
    expect(getByTestId("seq-detail").textContent).toContain('"REQ"');
    await fireEvent.click(getByTestId("seq-controls-forward"));
    expect(getByTestId("seq-message-m1").getAttribute("data-state")).toBe("sent");
    expect(getByTestId("seq-narration").textContent).toBe("From Relay to Client: EOSE");
    expect(queryByTestId("seq-detail")).toBeNull();
    expect(seen).toEqual([0, 1]);
  });

  test("autoplay runs to the end and stops; play at the end restarts", async () => {
    const { getByTestId } = render(SequenceDiagram, { props: { ...base, stepMs: 1 } });
    await fireEvent.click(getByTestId("seq-controls-play"));
    await new Promise((r) => setTimeout(r, 60));
    flushSync();
    expect(getByTestId("seq-message-m3").getAttribute("data-state")).toBe("current");
    await fireEvent.click(getByTestId("seq-controls-play"));
    expect(getByTestId("seq-message-m1").getAttribute("data-state")).toBe("pending");
  });

  test("custom detail snippet, description and self messages", async () => {
    const detail = createRawSnippet((m: () => SequenceMessage) => ({
      render: () => `<b data-testid="custom">${m().id}</b>`,
    }));
    const { getByTestId, getByText } = render(SequenceDiagram, {
      props: { ...base, step: 2, detail, description: "Longer text" },
    });
    expect(getByTestId("custom").textContent).toBe("m3");
    expect(getByTestId("seq-message-m3").querySelector("path.wire")).toBeTruthy();
    const desc = getByText("Longer text");
    expect(getByTestId("seq").getAttribute("aria-describedby")).toBe(desc.id);
    expect(getByTestId("seq-text").querySelector("[aria-current='step']")?.textContent).toContain(
      "Relay stores it.",
    );
  });

  test("pause stops autoplay", async () => {
    const { getByTestId } = render(SequenceDiagram, { props: { ...base, stepMs: 5 } });
    await fireEvent.click(getByTestId("seq-controls-play"));
    await fireEvent.click(getByTestId("seq-controls-play"));
    await new Promise((r) => setTimeout(r, 30));
    flushSync();
    expect(getByTestId("seq-message-m1").getAttribute("data-state")).toBe("pending");
  });

  test("an empty timeline says so", () => {
    const { getByTestId } = render(SequenceDiagram, { props: { ...base, messages: [] } });
    expect(getByTestId("seq-narration").textContent).toBe("No messages yet");
  });

  test("invalid data renders a typed error", () => {
    const { getByTestId } = render(SequenceDiagram, {
      props: { ...base, messages: [{ id: "x", from: "client", to: "nope", label: "?" }] },
    });
    expect(getByTestId("seq-error").getAttribute("data-code")).toBe("unknown-ref");
  });
});
