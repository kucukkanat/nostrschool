import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { $liveMode, createFixtureSource, createLiveRelaySource } from "@nostrschool/data";
import { FIXTURE_EVENTS } from "@nostrschool/fixtures";
import { getDictionary } from "@nostrschool/i18n";
import { startTestRelay, type TestRelay } from "@nostrschool/test-relay";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/svelte";
import LiveWire from "./LiveWire.svelte";
import RedundancyLab from "./RedundancyLab.svelte";
import WireTheater from "./WireTheater.svelte";
import { AUTH_EVENT, SCRIPTS } from "./wire.ts";

afterEach(() => {
  cleanup();
  $liveMode.set(false);
});
const t = getDictionary("en").chapters.ch04;

/** Records traffic on the real app-wide mascot bus (no mocks). */
const recordBus = () => {
  const seen: { type: MascotEventType; payload: unknown }[] = [];
  const off = onAny((e) => seen.push({ type: e.type, payload: e.payload }));
  return { seen, off };
};

describe("WireTheater", () => {
  test("starts on the read scenario with nothing sent and an empty notebook", () => {
    const r = render(WireTheater, { props: { locale: "en" } });
    expect(r.getByTestId("ch04-theater").dataset["scenario"]).toBe("read");
    expect(r.getByTestId("ch04-scenario-intro").textContent?.trim()).toBe(
      t.theater.scenarios.read.intro,
    );
    expect(r.getByTestId("ch04-nb-open").textContent).toBe(t.theater.notebook.none);
    expect(r.queryByTestId("ch04-detail")).toBeNull();
    expect(r.queryByTestId("ch04-done")).toBeNull();
  });

  test("stepping forward shows the raw frame, its route and the client's bookkeeping", async () => {
    const r = render(WireTheater, { props: { locale: "en" } });
    const forward = r.getByTestId("ch04-wire-controls-forward");
    await fireEvent.click(forward);
    expect(r.getByTestId("ch04-detail").dataset["verb"]).toBe("REQ");
    expect(r.getByTestId("ch04-detail-route").textContent?.trim()).toBe(
      `${t.lanes.client} → ${t.lanes.alpha}`,
    );
    expect(r.getByTestId("ch04-detail-verb").textContent).toBe(t.verbs.REQ);
    expect(r.getByTestId("ch04-detail-frame").textContent).toContain('"feed"');
    expect(r.getByTestId("ch04-wire-narration").textContent).toBe(
      t.theater.scenarios.read.steps.reqAlpha,
    );
    expect(r.getByTestId("ch04-nb-open").textContent).toBe(t.lanes.alpha);
    for (let i = 0; i < 4; i += 1) await fireEvent.click(forward);
    expect(r.getByTestId("ch04-nb-received").textContent?.trim()).toBe("2");
    expect(r.getByTestId("ch04-nb-dupes").textContent).toContain("1 duplicate copy ignored");
  });

  test("legend jumps to the first packet of a verb; absent verbs are disabled", async () => {
    const r = render(WireTheater, { props: { locale: "en" } });
    expect((r.getByTestId("ch04-legend-AUTH") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(r.getByTestId("ch04-legend-EOSE"));
    expect(r.getByTestId("ch04-detail").dataset["verb"]).toBe("EOSE");
    expect(r.getByTestId("ch04-legend-EOSE").dataset["current"]).toBe("true");
    await fireEvent.click(r.getByTestId("ch04-legend-CLOSED"));
    expect(r.getByTestId("ch04-wire-narration").textContent).toBe(
      t.theater.scenarios.read.steps.closedGamma,
    );
  });

  test("dupes plural, and the finished story celebrates", async () => {
    const bus = recordBus();
    const r = render(WireTheater, { props: { locale: "en" } });
    await fireEvent.click(r.getByTestId("ch04-legend-CLOSE"));
    // The last read step: jump there via the scrubber.
    const scrub = r.getByTestId("ch04-wire-controls-scrub") as HTMLInputElement;
    await fireEvent.input(scrub, { target: { value: String(SCRIPTS.read.length) } });
    expect(r.getByTestId("ch04-done").textContent).toBe(t.theater.done.read);
    expect(bus.seen.some((e) => e.type === "celebrate")).toBe(true);
    bus.off();
  });

  test("publish scenario: accepted vs rejected relays", async () => {
    const r = render(WireTheater, { props: { locale: "en", scenario: "publish" } });
    expect(r.getByTestId("ch04-nb-accepted").textContent).toBe(t.theater.notebook.none);
    await fireEvent.click(r.getByTestId("ch04-legend-NOTICE"));
    await fireEvent.click(r.getByTestId("ch04-wire-controls-forward"));
    expect(r.getByTestId("ch04-nb-accepted").textContent).toBe(`${t.lanes.alpha}, ${t.lanes.beta}`);
    expect(r.getByTestId("ch04-nb-rejected").textContent).toBe(t.lanes.gamma);
    expect(r.getByTestId("ch04-done").textContent).toBe(t.theater.done.publish);
  });

  test("switching tabs resets the diagram; auth OK tells the mascot a signature checked out", async () => {
    const bus = recordBus();
    const r = render(WireTheater, { props: { locale: "en" } });
    await fireEvent.click(r.getByTestId("ch04-wire-controls-forward"));
    await fireEvent.click(r.getByTestId("ch04-scenario-tab-auth"));
    expect(r.getByTestId("ch04-theater").dataset["scenario"]).toBe("auth");
    expect(r.queryByTestId("ch04-detail")).toBeNull();
    await fireEvent.click(r.getByTestId("ch04-scenario-tab-auth")); // same tab: no-op
    await fireEvent.click(r.getByTestId("ch04-legend-OK"));
    expect(r.getByTestId("ch04-nb-authed").textContent).toBe(t.lanes.delta);
    expect(bus.seen).toContainEqual({
      type: "signature:valid",
      payload: { eventId: AUTH_EVENT.id },
    });
    bus.off();
  });

  test("autoplay runs the whole script to the end", async () => {
    const r = render(WireTheater, { props: { locale: "en", scenario: "auth", stepMs: 1 } });
    await fireEvent.click(r.getByTestId("ch04-wire-controls-play"));
    await waitFor(() => expect(r.getByTestId("ch04-done").textContent).toBe(t.theater.done.auth));
  });
});

describe("LiveWire", () => {
  /** "direction:verb" for every logged frame, in order. */
  const frames = ({ container }: { readonly container: HTMLElement }): readonly string[] =>
    [...container.querySelectorAll<HTMLElement>('[data-testid="ch04-live-frame"]')].map(
      (li) => `${li.dataset["direction"]}:${li.dataset["verb"]}`,
    );

  test("fixture source: REQ out, EVENTs and EOSE in, then an automatic CLOSE", async () => {
    const source = createFixtureSource({ latencyMs: 0, relays: ["wss://relay.alpha.example"] });
    const r = render(LiveWire, { props: { locale: "en", source } });
    expect(r.getByTestId("ch04-live-empty").textContent).toBe(t.live.empty);
    expect(r.getByTestId("ch04-live-badge").textContent).toContain(t.live.fixtureBadge);
    expect(r.getByTestId("ch04-live-hint").textContent?.trim()).toBe(t.live.fixtureHint);
    await fireEvent.click(r.getByTestId("ch04-live-send"));
    await waitFor(() => expect(r.getByTestId("ch04-live").dataset["status"]).toBe("done"));
    const seen = frames(r);
    expect(seen[0]).toBe("out:REQ");
    expect(seen.filter((f) => f === "in:EVENT")).toHaveLength(3);
    expect(seen.slice(-2)).toEqual(["in:EOSE", "out:CLOSE"]);
    expect(r.getByTestId("ch04-live-stats").textContent).toContain("3 events");
    expect(r.getAllByTestId("ch04-live-frame")[0]?.textContent).toContain("relay.alpha.example");
    await fireEvent.click(r.getByTestId("ch04-live-clear"));
    expect(frames(r)).toEqual([]);
  });

  test("CLOSE button hangs up a pending subscription", async () => {
    const source = createFixtureSource({ latencyMs: 10_000 });
    const r = render(LiveWire, { props: { locale: "en", source } });
    await fireEvent.click(r.getByTestId("ch04-live-send"));
    await waitFor(() => expect(frames(r)).toContain("out:REQ"));
    await fireEvent.click(r.getByTestId("ch04-live-stop"));
    expect(r.getByTestId("ch04-live").dataset["status"]).toBe("closed");
    expect(frames(r)).toContain("out:CLOSE");
  });

  test("global source follows Live mode; switching mode closes the running subscription", async () => {
    const r = render(LiveWire, { props: { locale: "en" } });
    await fireEvent.click(r.getByTestId("ch04-live-send"));
    expect(r.getByTestId("ch04-live").dataset["status"]).toBe("waiting");
    // Live mode with an unroutable relay list: we only check the UI reacts; no frames are expected.
    $liveMode.set(true);
    await waitFor(() => expect(r.getByTestId("ch04-live").dataset["mode"]).toBe("live"));
    expect(r.getByTestId("ch04-live").dataset["status"]).toBe("closed");
    expect(r.getByTestId("ch04-live-badge").textContent).toContain(t.live.liveBadge);
    expect(r.getByTestId("ch04-live-hint").textContent).toContain("Live mode is on");
  });

  describe("against the real test relay", () => {
    let relay: TestRelay;
    beforeAll(async () => {
      relay = await startTestRelay({ port: 0, seed: FIXTURE_EVENTS });
    });
    afterAll(() => relay.stop());

    test("shows the relay's real frames and long EVENTs are truncated", async () => {
      const source = createLiveRelaySource({ relays: [relay.url] });
      const r = render(LiveWire, { props: { locale: "en", source } });
      await fireEvent.click(r.getByTestId("ch04-live-send"));
      await waitFor(() => expect(r.getByTestId("ch04-live").dataset["status"]).toBe("done"), {
        timeout: 4000,
      });
      expect(frames(r)).toContain("in:EVENT");
      expect(frames(r)).toContain("in:EOSE");
      expect(r.getByTestId("ch04-live").textContent).toContain("more characters");
      const reqs = relay.received().filter((m) => m[0] === "REQ");
      expect(reqs).toHaveLength(1);
      expect(relay.received().some((m) => m[0] === "EVENT")).toBe(false); // read-only
      source.dispose();
    });

    test("a forged event from a relay is dropped and listed as an error", async () => {
      // A real signed note with its content swapped afterwards: the id no longer matches.
      const original = FIXTURE_EVENTS.find((e) => e.kind === 1);
      if (original === undefined) throw new Error("fixture note missing");
      const forged = {
        ...original,
        content: "forged!",
        created_at: original.created_at + 1_000_000,
      };
      const rogue = await startTestRelay({ port: 0, seed: [forged] });
      const source = createLiveRelaySource({ relays: [rogue.url] });
      const r = render(LiveWire, { props: { locale: "en", source } });
      await fireEvent.click(r.getByTestId("ch04-live-send"));
      await waitFor(
        () => expect(r.getByTestId("ch04-live-errors").textContent).toContain(forged.id),
        {
          timeout: 3000,
        },
      );
      expect(r.getByTestId("ch04-live-errors").querySelector("li")?.dataset["code"]).toBe(
        "invalid-event",
      );
      source.dispose();
      await rogue.stop();
    });
  });
});

describe("RedundancyLab", () => {
  test("knocking out relays: safe → lost, with narration and one celebration", async () => {
    const bus = recordBus();
    const r = render(RedundancyLab, { props: { locale: "en" } });
    const lab = r.getByTestId("ch04-redundancy");
    expect(lab.dataset["verdict"]).toBe("safe");
    await fireEvent.click(r.getByTestId("ch04-relay-alpha-power"));
    expect(r.getByTestId("ch04-relay-alpha").dataset["online"]).toBe("false");
    expect(r.getByTestId("ch04-relay-alpha-power").getAttribute("aria-pressed")).toBe("true");
    expect(r.getByTestId("ch04-redundancy-narration").textContent).toContain(t.lanes.alpha);
    expect(r.getByTestId("ch04-redundancy-copies").textContent?.trim()).toBe(
      "Copies still reachable: 1 of 2",
    );
    await fireEvent.click(r.getByTestId("ch04-redundancy-chaos"));
    expect(lab.dataset["verdict"]).toBe("lost");
    expect(r.getByTestId("ch04-redundancy-verdict").textContent).toContain(t.redundancy.lost);
    expect((r.getByTestId("ch04-redundancy-chaos") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(r.getByTestId("ch04-relay-alpha-power"));
    expect(bus.seen.filter((e) => e.type === "celebrate")).toHaveLength(1);
    bus.off();
  });

  test("publish checkboxes and reset", async () => {
    const r = render(RedundancyLab, { props: { locale: "en" } });
    await fireEvent.click(r.getByTestId("ch04-relay-alpha-publish"));
    await fireEvent.click(r.getByTestId("ch04-relay-beta-publish"));
    expect(r.getByTestId("ch04-redundancy").dataset["verdict"]).toBe("unpublished");
    expect(r.getByTestId("ch04-redundancy-verdict").textContent).toContain(
      t.redundancy.unpublished,
    );
    await fireEvent.click(r.getByTestId("ch04-redundancy-reset"));
    expect(r.getByTestId("ch04-redundancy").dataset["verdict"]).toBe("safe");
    expect(r.getByTestId("ch04-relay-alpha-state").textContent).toContain(t.redundancy.hasCopy);
  });
});
