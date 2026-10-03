import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { $liveMode, $liveRelays, createFixtureSource } from "@nostrschool/data";
import { FIXTURE_EVENTS, getPersona } from "@nostrschool/fixtures";
import { startTestRelay } from "@nostrschool/test-relay";
import { mascotBus } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import FilterBuilder from "./FilterBuilder.svelte";
import FilterPlayground from "./FilterPlayground.svelte";
import FilterQuest from "./FilterQuest.svelte";
import { NEW_YEARS_EVE, THREAD_ROOT } from "./filter-logic.ts";
import RelayRunner from "./RelayRunner.svelte";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (check: () => boolean, ms = 3000): Promise<void> => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error("timed out");
    await tick(10);
  }
};

interface HappyDomWindow {
  readonly happyDOM: { readonly settings: { device: { prefersReducedMotion: string } } };
}
const device = (globalThis.window as unknown as HappyDomWindow).happyDOM.settings.device;

// Reduced motion: transitions are instant (the lossless path), and happy-dom never has to
// cancel in-flight Web Animations on unmount.
beforeAll(() => {
  device.prefersReducedMotion = "reduce";
});
afterAll(() => {
  device.prefersReducedMotion = "no-preference";
});
afterEach(() => {
  cleanup();
  $liveMode.set(false);
});

const alice = getPersona("alice");
const bob = getPersona("bob");
const celebrations = () => {
  const reasons: string[] = [];
  const off = mascotBus.on("celebrate", (p) => reasons.push(p.reason ?? ""));
  return { reasons, off };
};
const typeInto = async (el: HTMLElement, text: string) =>
  fireEvent.input(el, { target: { value: text } });

describe("FilterBuilder", () => {
  test("starts empty: every event lit, the JSON is {}", () => {
    const { getByTestId } = render(FilterBuilder, { props: { locale: "en" } });
    const root = getByTestId("ch05-builder");
    expect(root.dataset["returned"]).toBe(String(FIXTURE_EVENTS.length));
    expect(getByTestId("ch05-builder-narration").textContent).toContain("empty filter");
    expect(getByTestId("ch05-builder-req").textContent).toContain('["REQ","ch05",{}]');
    expect((getByTestId("ch05-builder-reset") as HTMLButtonElement).disabled).toBe(true);
  });

  test("chips narrow the shelf live; misses dim and the JSON follows", async () => {
    const { getByTestId } = render(FilterBuilder, { props: { locale: "en" } });
    await fireEvent.click(getByTestId(`ch05-builder-field-authors-chip-${alice.pubkey}`));
    await fireEvent.click(getByTestId("ch05-builder-field-kinds-chip-1"));
    const aliceNotes = FIXTURE_EVENTS.filter((e) => e.pubkey === alice.pubkey && e.kind === 1);
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe(String(aliceNotes.length));
    expect(getByTestId("ch05-builder-narration").textContent).toContain(
      "written by Alice, of kind 1",
    );
    expect(getByTestId("ch05-builder-req").textContent).toContain(`"authors":["${alice.pubkey}"]`);
    const first = aliceNotes[0];
    if (first === undefined) throw new Error("no notes");
    expect(getByTestId(`ch05-builder-card-${first.id}`).dataset["state"]).toBe("match");
    const other = FIXTURE_EVENTS.find((e) => e.pubkey === bob.pubkey);
    expect(getByTestId(`ch05-builder-card-${other?.id}`).dataset["state"]).toBe("miss");
    expect(getByTestId(`ch05-builder-field-kinds-chip-1`).getAttribute("aria-pressed")).toBe(
      "true",
    );
    // Toggling the chip again removes the condition.
    await fireEvent.click(getByTestId("ch05-builder-field-kinds-chip-1"));
    expect(getByTestId("ch05-builder-req").textContent).not.toContain("kinds");
  });

  test("free-text values validate, show errors and can be removed", async () => {
    const { getByTestId, queryByTestId } = render(FilterBuilder, { props: { locale: "en" } });
    const input = getByTestId("ch05-builder-field-e-input");
    await typeInto(input, "not-an-id");
    await fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(getByTestId("ch05-builder-field-e-error").textContent).toContain("not an event id");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await typeInto(input, THREAD_ROOT.id);
    expect(getByTestId("ch05-builder-field-e-error").textContent?.trim()).toBe("");
    await fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(getByTestId(`ch05-builder-field-e-value-${THREAD_ROOT.id}`)).toBeTruthy();
    expect(getByTestId("ch05-builder-narration").textContent).toContain("pointing at event");
    await fireEvent.click(getByTestId(`ch05-builder-field-e-remove-${THREAD_ROOT.id}`));
    expect(queryByTestId(`ch05-builder-field-e-value-${THREAD_ROOT.id}`)).toBeNull();
  });

  test("since/until/limit sliders; limit cuts matches and narrates it", async () => {
    const { getByTestId, queryByTestId } = render(FilterBuilder, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch05-builder-field-limit-enable"));
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe("5");
    expect(getByTestId("ch05-builder-cut").textContent).toContain("cut by the limit");
    await fireEvent.input(getByTestId("ch05-builder-field-limit-slider"), {
      target: { value: "2" },
    });
    expect(getByTestId("ch05-builder-field-limit-value").textContent).toBe("2");
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe("2");
    await fireEvent.click(getByTestId("ch05-builder-field-limit-enable"));
    expect(queryByTestId("ch05-builder-field-limit-slider")).toBeNull();

    await fireEvent.click(getByTestId("ch05-builder-field-since-enable"));
    const after = FIXTURE_EVENTS.filter((e) => e.created_at >= NEW_YEARS_EVE).length;
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe(String(after));
    expect(getByTestId("ch05-builder-field-since-value").textContent).toContain("2024");
    await fireEvent.click(getByTestId("ch05-builder-field-until-enable"));
    await fireEvent.input(getByTestId("ch05-builder-field-until-slider"), {
      target: { value: String(NEW_YEARS_EVE) },
    });
    expect(getByTestId("ch05-builder-narration").textContent).toContain("up to");
  });

  test("presets, the explain panel and its actions; bullseye celebrates once", async () => {
    const { reasons, off } = celebrations();
    const { getByTestId } = render(FilterBuilder, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch05-builder-preset-thread"));
    expect(getByTestId("ch05-builder-narration").textContent).toContain("pointing at event");
    expect(getByTestId("ch05-builder-explain").textContent).toContain("Pick any card");

    const reaction = FIXTURE_EVENTS.find((e) => e.kind === 7 && e.pubkey === bob.pubkey);
    if (reaction === undefined) throw new Error("no reaction");
    await fireEvent.click(getByTestId(`ch05-builder-card-${reaction.id}`));
    expect(getByTestId("ch05-builder-explain-check-e").dataset["passed"]).toBe("true");
    expect(getByTestId("ch05-builder-explain-verdict").textContent).toContain("relay sends it");

    await fireEvent.click(getByTestId(`ch05-builder-card-${THREAD_ROOT.id}`));
    expect(getByTestId("ch05-builder-explain-check-e").dataset["passed"]).toBe("false");
    expect(getByTestId("ch05-builder-explain-verdict").textContent).toContain("One failing");

    await fireEvent.click(getByTestId("ch05-builder-pin"));
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe("1");
    await tick();
    expect(reasons).toEqual(["ch05-builder-bullseye"]);
    await fireEvent.click(getByTestId("ch05-builder-find-author"));
    expect(getByTestId("ch05-builder-narration").textContent).toContain("written by Alice");
    await fireEvent.click(getByTestId("ch05-builder-find-tagged"));
    expect(getByTestId("ch05-builder-narration").textContent).toContain("pointing at event");
    await fireEvent.click(getByTestId("ch05-builder-preset-newest"));
    await fireEvent.click(getByTestId(`ch05-builder-card-${FIXTURE_EVENTS[9]?.id}`));
    expect(getByTestId("ch05-builder-explain-verdict").textContent).toContain("limit");
    await fireEvent.click(getByTestId("ch05-builder-explain-close"));
    expect(getByTestId("ch05-builder-explain").textContent).toContain("Pick any card");
    await fireEvent.click(getByTestId("ch05-builder-preset-mentionsBob"));
    await fireEvent.click(getByTestId("ch05-builder-reset"));
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe(String(FIXTURE_EVENTS.length));
    await fireEvent.click(getByTestId(`ch05-builder-card-${THREAD_ROOT.id}`));
    expect(getByTestId("ch05-builder-explain").textContent).toContain("filter is empty");
    // Clicking the selected card again deselects it.
    await fireEvent.click(getByTestId(`ch05-builder-card-${THREAD_ROOT.id}`));
    expect(getByTestId("ch05-builder-explain").textContent).toContain("Pick any card");
    expect(reasons).toHaveLength(1);
    off();
  });

  test("JSON editor applies valid filters and reports errors", async () => {
    const { getByTestId } = render(FilterBuilder, { props: { locale: "en", editor: true } });
    const box = getByTestId("ch05-builder-editor-input") as HTMLTextAreaElement;
    expect(box.value).toBe("{}");
    await typeInto(box, "{oops");
    await fireEvent.click(getByTestId("ch05-builder-editor-apply"));
    expect(getByTestId("ch05-builder-editor-status").textContent).toContain("isn't valid JSON");
    await typeInto(box, '{"search":"x"}');
    await fireEvent.click(getByTestId("ch05-builder-editor-apply"));
    expect(getByTestId("ch05-builder-editor-status").textContent).toContain("only shows");
    await typeInto(box, '{"kinds":[0],"limit":3}');
    await fireEvent.click(getByTestId("ch05-builder-editor-apply"));
    expect(getByTestId("ch05-builder-editor-status").textContent).toContain("updated");
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe("3");
    await tick();
    expect(box.value).toContain('"limit": 3');
  });
});

describe("FilterQuest", () => {
  test("solving quests marks them, narrates and celebrates each once", async () => {
    const { reasons, off } = celebrations();
    const { getByTestId } = render(FilterQuest, { props: { locale: "en" } });
    expect(getByTestId("ch05-quest-progress").textContent).toBe("0 of 4 quests solved");
    await fireEvent.click(getByTestId("ch05-quest-builder-field-kinds-chip-0"));
    await fireEvent.click(getByTestId("ch05-quest-builder-field-limit-enable"));
    await fireEvent.input(getByTestId("ch05-quest-builder-field-limit-slider"), {
      target: { value: "3" },
    });
    await tick();
    expect(getByTestId("ch05-quest-quest-profiles").dataset["solved"]).toBe("true");
    expect(getByTestId("ch05-quest-announce").textContent).toContain("Fresh faces");
    expect(reasons).toContain("ch05-quest-profiles");

    await fireEvent.click(getByTestId("ch05-quest-builder-reset"));
    await fireEvent.click(getByTestId(`ch05-quest-builder-field-authors-chip-${bob.pubkey}`));
    await fireEvent.click(getByTestId("ch05-quest-builder-field-t-chip-nostr"));
    await tick();
    expect(getByTestId("ch05-quest-quest-hotTake").dataset["solved"]).toBe("true");

    await fireEvent.click(getByTestId("ch05-quest-builder-reset"));
    await fireEvent.click(getByTestId(`ch05-quest-builder-field-authors-chip-${alice.pubkey}`));
    await fireEvent.click(getByTestId("ch05-quest-builder-field-since-enable"));
    await tick();
    expect(getByTestId("ch05-quest-quest-aliceToday").dataset["solved"]).toBe("true");

    await fireEvent.click(getByTestId("ch05-quest-builder-reset"));
    await fireEvent.click(getByTestId("ch05-quest-builder-preset-thread"));
    await fireEvent.click(getByTestId("ch05-quest-builder-field-kinds-chip-7"));
    await tick();
    expect(getByTestId("ch05-quest").dataset["solved"]).toBe("4");
    expect(getByTestId("ch05-quest-announce").textContent).toContain("All quests solved");
    // Re-solving does not celebrate twice.
    await fireEvent.click(getByTestId("ch05-quest-builder-field-kinds-chip-7"));
    await fireEvent.click(getByTestId("ch05-quest-builder-field-kinds-chip-7"));
    await tick();
    expect(reasons.filter((r) => r.startsWith("ch05-quest-") && !r.endsWith("bullseye"))).toEqual([
      "ch05-quest-profiles",
      "ch05-quest-hotTake",
      "ch05-quest-aliceToday",
      "ch05-quest-reactions",
    ]);
    off();
  });
});

describe("RelayRunner", () => {
  test("fixture source: REQ out, EVENTs and EOSE in, then close", async () => {
    const source = createFixtureSource({ latencyMs: 0 });
    const { getByTestId } = render(RelayRunner, {
      props: { locale: "en", filter: { kinds: [0], limit: 2 }, source },
    });
    const root = getByTestId("ch05-runner");
    expect(root.dataset["mode"]).toBe("fixture");
    expect((getByTestId("ch05-runner-stop") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("ch05-runner-send"));
    await waitFor(() => root.dataset["status"] === "done");
    expect(getByTestId("ch05-runner-status").textContent).toContain("All relays sent EOSE");
    const frames = getByTestId("ch05-runner-frames").querySelectorAll("[data-type]");
    const types = [...frames].map((f) => (f as HTMLElement).dataset["type"]);
    expect(types).toContain("REQ");
    expect(types).toContain("EVENT");
    expect(types).toContain("EOSE");
    // `limit` applies per relay: each sample relay sends its own newest 2 profiles.
    const results = getByTestId("ch05-runner-results").children.length;
    expect(results).toBeGreaterThanOrEqual(2);
    expect(results).toBeLessThanOrEqual(2 * source.relays.length);
    await fireEvent.click(getByTestId("ch05-runner-stop"));
    expect(root.dataset["status"]).toBe("closed");
    expect(getByTestId("ch05-runner-status").textContent).toContain("closed");
    source.dispose();
  });

  test("live mode against the real test relay caps the limit and surfaces NOTICEs", async () => {
    const relay = await startTestRelay({ port: 0, seed: FIXTURE_EVENTS });
    try {
      $liveRelays.set([relay.url]);
      $liveMode.set(true);
      const { getByTestId, queryAllByTestId } = render(RelayRunner, {
        props: { locale: "en", filter: { kinds: [1] } },
      });
      await tick();
      const root = getByTestId("ch05-runner");
      expect(root.dataset["mode"]).toBe("live");
      expect(getByTestId("ch05-runner-safe-limit").textContent).toContain("30");
      await fireEvent.click(getByTestId("ch05-runner-send"));
      await waitFor(() => root.dataset["status"] === "done", 8000);
      const notes = FIXTURE_EVENTS.filter((e) => e.kind === 1).length;
      expect(getByTestId("ch05-runner-results").children).toHaveLength(Math.min(notes, 30));
      const req = relay.received().find((m) => m[0] === "REQ");
      expect(req?.[2]).toEqual({ kinds: [1], limit: 30 });
      // Relay complaints surface in the panel instead of vanishing.
      relay.notice("slow down please");
      await waitFor(() => queryAllByTestId("ch05-runner-error").length > 0);
      expect(queryAllByTestId("ch05-runner-error")[0]?.textContent).toContain("slow down please");
    } finally {
      await relay.stop();
    }
  });
});

describe("FilterPlayground", () => {
  test("builder drives the runner's filter", async () => {
    const { getByTestId } = render(FilterPlayground, { props: { locale: "en" } });
    expect(getByTestId("ch05-playground-builder-editor")).toBeTruthy();
    await fireEvent.click(getByTestId("ch05-playground-builder-preset-hashtag"));
    await fireEvent.click(getByTestId("ch05-playground-runner-send"));
    const root = getByTestId("ch05-playground-runner");
    await waitFor(() => root.dataset["status"] === "done", 5000);
    const tagged = FIXTURE_EVENTS.filter((e) =>
      e.tags.some((t) => t[0] === "t" && t[1] === "nostr"),
    );
    expect(getByTestId("ch05-playground-runner-results").children.length).toBeLessThanOrEqual(
      tagged.length,
    );
    expect(getByTestId("ch05-playground-runner-results").children.length).toBeGreaterThan(0);
  });
});

describe("FilterBuilder in Spanish", () => {
  test("renders every fixture event for the es chapter", () => {
    const { getByTestId } = render(FilterBuilder, { props: { locale: "es" } });
    expect(getByTestId("ch05-builder").dataset["returned"]).toBe(String(FIXTURE_EVENTS.length));
  });
});
