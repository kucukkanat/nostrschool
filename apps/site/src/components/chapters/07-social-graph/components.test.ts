import { afterEach, describe, expect, test } from "bun:test";
import { on } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import ChapterQuiz from "./ChapterQuiz.svelte";
import FollowGraphExplorer from "./FollowGraphExplorer.svelte";
import OutboxRouter from "./OutboxRouter.svelte";
import ReplaceableTrap from "./ReplaceableTrap.svelte";

afterEach(cleanup);

const text = (el: HTMLElement): string => el.textContent?.replace(/\s+/g, " ").trim() ?? "";
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("FollowGraphExplorer", () => {
  test("shows network stats until someone is selected", () => {
    const { getByTestId, queryByTestId } = render(FollowGraphExplorer, { props: { locale: "en" } });
    expect(text(getByTestId("ch07-stats"))).toBe("7 people · 25 follows · 11 mutual pairs");
    expect(text(getByTestId("ch07-popular"))).toBe("Most followed: Alice (6 followers)");
    expect(queryByTestId("ch07-person")).toBeNull();
    expect(getByTestId("ch07-force-node-alice")).toBeTruthy();
  });

  test("selecting a node reveals the split lists, raw kind 3, and cheers once", async () => {
    const reasons: string[] = [];
    const off = on("celebrate", (p) => reasons.push(p.reason ?? ""));
    const { getByTestId, queryByTestId } = render(FollowGraphExplorer, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-force-node-grace"));
    expect(getByTestId("ch07-person").dataset["person"]).toBe("grace");
    expect(text(getByTestId("ch07-person-follows"))).toContain("Alice");
    expect(text(getByTestId("ch07-person-follows"))).toContain("Erin mutual");
    expect(text(getByTestId("ch07-person-followers"))).toBe("Carol Erin mutual");
    expect(getByTestId("ch07-raw")).toBeTruthy();
    await fireEvent.click(getByTestId("ch07-force-node-alice"));
    expect(getByTestId("ch07-person").dataset["person"]).toBe("alice");
    expect(reasons).toEqual(["ch07-follow-list"]);
    await fireEvent.click(getByTestId("ch07-clear"));
    expect(queryByTestId("ch07-person")).toBeNull();
    off();
  });

  test("hover and focus highlight through the chosen lens", async () => {
    const { getByTestId } = render(FollowGraphExplorer, { props: { locale: "en" } });
    const stage = getByTestId("ch07-graph-stage");
    const grace = getByTestId("ch07-force-node-grace");
    await fireEvent.pointerOver(grace);
    expect(stage.dataset["hovered"]).toBe("grace");
    expect(text(getByTestId("ch07-hover-note"))).toBe("Grace follows Alice, Bob, and Erin.");
    await fireEvent.click(getByTestId("ch07-lens-followers"));
    expect(getByTestId("ch07-lens-followers").getAttribute("aria-pressed")).toBe("true");
    expect(text(getByTestId("ch07-hover-note"))).toBe("Grace is followed by Carol and Erin.");
    await fireEvent.pointerOut(grace, { relatedTarget: getByTestId("ch07-force-node-bob") });
    expect(stage.dataset["hovered"]).toBe("grace");
    await fireEvent.pointerOut(grace);
    expect(stage.dataset["hovered"]).toBe("");
    await fireEvent.focusIn(getByTestId("ch07-force-node-dave"));
    expect(stage.dataset["hovered"]).toBe("dave");
    await fireEvent.focusOut(getByTestId("ch07-force-node-dave"));
    expect(stage.dataset["hovered"]).toBe("");
    await fireEvent.pointerOver(getByTestId("ch07-lens"));
    expect(stage.dataset["hovered"]).toBe("");
  });

  test("keyboard: Enter selects the focused node", async () => {
    const { getByTestId } = render(FollowGraphExplorer, { props: { locale: "en" } });
    await fireEvent.keyDown(getByTestId("ch07-force-node-bob"), { key: "Enter" });
    expect(getByTestId("ch07-person").dataset["person"]).toBe("bob");
  });
});

describe("OutboxRouter", () => {
  test("steps through the outbox model and celebrates full coverage", async () => {
    const reasons: string[] = [];
    const off = on("celebrate", (p) => reasons.push(p.reason ?? ""));
    const { getByTestId, queryByTestId } = render(OutboxRouter, { props: { locale: "en" } });
    expect(text(getByTestId("ch07-narration"))).toBe(
      "Press play or step forward to watch Erin's app work.",
    );
    expect(getByTestId("ch07-frames-empty")).toBeTruthy();
    const forward = getByTestId("ch07-playback-forward");
    await fireEvent.click(forward);
    expect(getByTestId("ch07-map").dataset["step"]).toBe("follows");
    expect(text(getByTestId("ch07-narration"))).toContain("asks Alpha for Erin's kind 3");
    expect(getByTestId("ch07-relay-alpha").dataset["state"]).toBe("lookup");
    await fireEvent.click(forward);
    await fireEvent.click(forward);
    expect(text(getByTestId("ch07-minimal"))).toBe("Fewest relays that reach everyone: 2");
    expect(text(getByTestId("ch07-relay-card-delta"))).toBe("Delta Asks for: Frank");
    await fireEvent.click(forward);
    await fireEvent.click(forward);
    await flush();
    expect(getByTestId("ch07-map").dataset["step"]).toBe("notes");
    expect(getByTestId("ch07-coverage").dataset["reached"]).toBe("4");
    expect(getByTestId("ch07-person-node-grace").dataset["state"]).toBe("reached");
    expect(text(getByTestId("ch07-contacted"))).toBe("Relays contacted: 4");
    expect(queryByTestId("ch07-frames")).toBeTruthy();
    expect(reasons).toContain("ch07-outbox-complete");
    off();
  });

  test("one relay mode shows who goes missing", async () => {
    const { getByTestId } = render(OutboxRouter, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-mode-single"));
    expect(getByTestId("ch07-mode-single").getAttribute("aria-pressed")).toBe("true");
    const forward = getByTestId("ch07-playback-forward");
    for (let i = 0; i < 3; i++) await fireEvent.click(forward);
    expect(text(getByTestId("ch07-narration"))).toBe(
      "Only 2 of 4 people show up. Missing: Frank and Grace. They never write to Alpha.",
    );
    expect(getByTestId("ch07-person-node-frank").dataset["state"]).toBe("missed");
    expect(getByTestId("ch07-coverage").classList.contains("bad")).toBe(true);
    const select = getByTestId("ch07-single-relay") as HTMLSelectElement;
    select.value = "wss://relay.gamma.example";
    await fireEvent.change(select);
    expect(getByTestId("ch07-map").dataset["step"]).toBe("start");
  });

  test("reply mode, viewer and recipient pickers", async () => {
    const { getByTestId } = render(OutboxRouter, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-mode-reply"));
    const recipient = getByTestId("ch07-recipient") as HTMLSelectElement;
    recipient.value = "alice";
    await fireEvent.change(recipient);
    const forward = getByTestId("ch07-playback-forward");
    await fireEvent.click(forward);
    expect(getByTestId("ch07-person-node-alice").dataset["state"]).toBe("target");
    await fireEvent.click(forward);
    expect(text(getByTestId("ch07-narration"))).toContain("Alice's read relays");
    expect(getByTestId("ch07-relay-card-alpha").textContent).toContain("Receives the reply");

    const viewer = getByTestId("ch07-viewer") as HTMLSelectElement;
    viewer.value = "dave";
    await fireEvent.change(viewer);
    expect(text(getByTestId("ch07-narration"))).toContain("Dave's app");
    // Dave follows Alice too, so the pick survives; Bob is now a valid choice as well.
    expect((getByTestId("ch07-recipient") as HTMLSelectElement).value).toBe("alice");
    viewer.value = "nobody";
    await fireEvent.change(viewer);
    expect(text(getByTestId("ch07-narration"))).toContain("Dave's app");
  });

  test("play advances on its own (timer driven by the parent)", async () => {
    const { getByTestId } = render(OutboxRouter, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-mode-reply"));
    await fireEvent.click(getByTestId("ch07-playback-play"));
    expect(getByTestId("ch07-playback").dataset["playing"]).toBe("true");
    await new Promise((r) => setTimeout(r, 1500));
    expect(getByTestId("ch07-map").dataset["step"]).toBe("lookup");
    await fireEvent.click(getByTestId("ch07-playback-play"));
    expect(getByTestId("ch07-playback").dataset["playing"]).toBe("false");
  });

  test("stepper jumps straight to a step", async () => {
    const { getByTestId } = render(OutboxRouter, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-steps-step-plan"));
    expect(getByTestId("ch07-map").dataset["step"]).toBe("plan");
  });
});

describe("ReplaceableTrap", () => {
  test("phone publish, stale tablet overwrite, sync, reset", async () => {
    const reasons: string[] = [];
    const off = on("celebrate", (p) => reasons.push(p.reason ?? ""));
    const warnings: string[] = [];
    const offWarn = on("warning", (p) => warnings.push(p.reason));
    const { getByTestId, queryByTestId } = render(ReplaceableTrap, { props: { locale: "en" } });
    expect(getByTestId("ch07-relay-empty")).toBeTruthy();
    expect((getByTestId("ch07-sync") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("ch07-follow-dave"));
    await fireEvent.click(getByTestId("ch07-publish-phone"));
    expect(getByTestId("ch07-kept").dataset["version"]).toBe("1");
    expect(text(getByTestId("ch07-kept-follows"))).toBe("Alice, Bob, Erin, and Dave");
    expect(text(getByTestId("ch07-replace-narration"))).toContain("version 1 with 4 follows");

    await fireEvent.click(getByTestId("ch07-publish-tablet"));
    expect(getByTestId("ch07-kept").dataset["device"]).toBe("tablet");
    expect(text(getByTestId("ch07-lost"))).toBe("Lost follows: Bob, Erin, and Dave");
    expect(warnings).toEqual(["ch07-follows-lost"]);

    await fireEvent.click(getByTestId("ch07-sync"));
    expect((getByTestId("ch07-follow-bob") as HTMLInputElement).checked).toBe(false);
    expect(queryByTestId("ch07-lost")).toBeNull();
    expect(reasons).toEqual(["ch07-synced"]);
    offWarn();

    // The tablet's list now matches the relay's, so nothing more is lost.
    await fireEvent.click(getByTestId("ch07-publish-tablet"));
    expect(text(getByTestId("ch07-replace-narration"))).toContain("Luckily");

    await fireEvent.click(getByTestId("ch07-reset"));
    expect(getByTestId("ch07-relay-empty")).toBeTruthy();
    expect((getByTestId("ch07-follow-bob") as HTMLInputElement).checked).toBe(true);
    expect(text(getByTestId("ch07-replace-narration"))).toBe("Back to the start.");
    off();
  });

  test("tablet first: compares against the phone's list", async () => {
    const { getByTestId } = render(ReplaceableTrap, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch07-publish-tablet"));
    expect(text(getByTestId("ch07-lost"))).toBe("Lost follows: Bob and Erin");
  });
});

describe("ChapterQuiz", () => {
  test("renders three questions from i18n", () => {
    const { getByTestId } = render(ChapterQuiz, { props: { locale: "en" } });
    expect(getByTestId("ch07-quiz-q1")).toBeTruthy();
    expect(getByTestId("ch07-quiz-q3")).toBeTruthy();
  });
});
