import { afterEach, describe, expect, test } from "bun:test";
import { on } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import ResilienceChart from "./ResilienceChart.svelte";
import TopologySandbox from "./TopologySandbox.svelte";

afterEach(cleanup);

const narration = (get: (id: string) => HTMLElement): string =>
  get("ch01-narration").textContent?.trim() ?? "";

describe("TopologySandbox", () => {
  test("starts healthy on the centralized model", () => {
    const { getByTestId } = render(TopologySandbox, { props: { locale: "en" } });
    expect(getByTestId("ch01-panel").dataset["model"]).toBe("central");
    expect(getByTestId("ch01-health").dataset["alive"]).toBe("20");
    expect(narration(getByTestId)).toContain("All servers and relays are online");
    expect(getByTestId("ch01-reset").hasAttribute("disabled")).toBe(true);
  });

  test("killing the platform silences everyone; reset brings them back", async () => {
    const { getByTestId } = render(TopologySandbox, { props: { locale: "en" } });
    const platform = getByTestId("ch01-node-platform");
    await fireEvent.click(platform);
    expect(platform.dataset["state"]).toBe("down");
    expect(platform.getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch01-health").dataset["alive"]).toBe("0");
    expect(getByTestId("ch01-user-alice").dataset["voice"]).toBe("silenced");
    expect(getByTestId("ch01-user-alice-account").textContent).toContain("Account gone with BigCo");
    expect(getByTestId("ch01-verdict").textContent).toContain("dark");
    expect(getByTestId("ch01-edge-alice-platform").dataset["state"]).toBe("dead");
    expect(narration(getByTestId)).toBe(
      "BigCo went offline. Silenced: Alice, Bob, Carol, Dave, and Erin. 0 of 20 conversations still work.",
    );
    await fireEvent.click(getByTestId("ch01-reset"));
    expect(getByTestId("ch01-health").dataset["alive"]).toBe("20");
    expect(narration(getByTestId)).toStartWith("Everything is back online.");
  });

  test("focusable infra nodes carry a dedicated focus halo, users do not", async () => {
    const { getByTestId, queryByTestId } = render(TopologySandbox, { props: { locale: "en" } });
    const halo = getByTestId("ch01-node-platform-focus");
    expect(halo.getAttribute("class")).toContain("focus-halo");
    expect(halo.tagName.toLowerCase()).toBe("rect");
    expect(getByTestId("ch01-node-platform").contains(halo)).toBe(true);
    expect(queryByTestId("ch01-node-alice-focus")).toBeNull();
    await fireEvent.click(getByTestId("ch01-models-tab-nostr"));
    const relay = getByTestId("ch01-panel").querySelector("circle.focus-halo");
    expect(relay).not.toBeNull();
  });

  test("keyboard toggles nodes; other keys are ignored", async () => {
    const { getByTestId } = render(TopologySandbox, { props: { locale: "en" } });
    const platform = getByTestId("ch01-node-platform");
    await fireEvent.keyDown(platform, { key: "a" });
    expect(platform.dataset["state"]).toBe("up");
    await fireEvent.keyDown(platform, { key: "Enter" });
    expect(platform.dataset["state"]).toBe("down");
    await fireEvent.keyDown(platform, { key: " " });
    expect(platform.dataset["state"]).toBe("up");
    expect(narration(getByTestId)).toStartWith("BigCo is back online.");
  });

  test("banning Alice: deplatformed on BigCo, a shrug on Nostr (and the mascot cheers)", async () => {
    const reasons: string[] = [];
    const off = on("celebrate", (p) => reasons.push(p.reason ?? ""));
    const warnings: string[] = [];
    const offWarn = on("warning", (p) => warnings.push(p.reason));
    const { getByTestId, queryByTestId } = render(TopologySandbox, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch01-ban"));
    expect(warnings).toEqual(["ch01-central-outage"]);
    offWarn();
    expect(getByTestId("ch01-user-alice").dataset["voice"]).toBe("silenced");
    expect(getByTestId("ch01-user-alice-account").textContent).toBe("Banned by BigCo");
    expect(getByTestId("ch01-ban-hint").textContent).toContain("BigCo decides");
    expect(getByTestId("ch01-edge-alice-platform").dataset["state"]).toBe("banned");
    await fireEvent.click(getByTestId("ch01-ban"));
    expect(queryByTestId("ch01-ban-hint")).toBeNull();
    expect(narration(getByTestId)).toStartWith("BigCo lifted the ban on Alice.");

    await fireEvent.click(getByTestId("ch01-models-tab-nostr"));
    expect(getByTestId("ch01-panel").dataset["model"]).toBe("nostr");
    expect(narration(getByTestId)).toStartWith("Switched to the Nostr model.");
    await fireEvent.click(getByTestId("ch01-ban"));
    expect(getByTestId("ch01-user-alice").dataset["voice"]).toBe("full");
    expect(getByTestId("ch01-user-alice-account").textContent).toBe(
      "Identity: own keys · Banned by alpha",
    );
    await fireEvent.click(getByTestId("ch01-node-beta"));
    expect(reasons).toEqual(["ch01-nostr-survives"]);
    off();
  });

  test("each model keeps its own damage across tab switches", async () => {
    const { getByTestId } = render(TopologySandbox, {
      props: { locale: "en", initialModel: "federated" },
    });
    await fireEvent.click(getByTestId("ch01-node-tea"));
    expect(getByTestId("ch01-user-carol").dataset["voice"]).toBe("partial");
    expect(getByTestId("ch01-user-carol").dataset["audience"]).toBe("2");
    await fireEvent.click(getByTestId("ch01-models-tab-bluesky"));
    expect(getByTestId("ch01-health").dataset["alive"]).toBe("20");
    expect(getByTestId("ch01-edge-appview-alice").dataset["state"]).toBe("live");
    await fireEvent.click(getByTestId("ch01-models-tab-federated"));
    expect(getByTestId("ch01-node-tea").dataset["state"]).toBe("down");
    expect(getByTestId("ch01-health").dataset["alive"]).toBe("6");
  });

  test("spotlighting a person highlights their audience", async () => {
    const { getByTestId } = render(TopologySandbox, {
      props: { locale: "en", initialModel: "federated" },
    });
    await fireEvent.click(getByTestId("ch01-node-coffee"));
    const btn = getByTestId("ch01-user-alice-spotlight");
    await fireEvent.pointerEnter(btn);
    expect(getByTestId("ch01-node-bob").classList.contains("heard")).toBe(true);
    expect(getByTestId("ch01-node-carol").classList.contains("unheard")).toBe(true);
    expect(getByTestId("ch01-node-alice").classList.contains("spot")).toBe(true);
    await fireEvent.pointerLeave(btn);
    expect(getByTestId("ch01-node-bob").classList.contains("heard")).toBe(false);
    await fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch01-node-bob").classList.contains("heard")).toBe(true);
    await fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("ResilienceChart", () => {
  test("plots the worst single outage per model", () => {
    const { getByTestId } = render(ResilienceChart, { props: { locale: "en" } });
    const root = getByTestId("ch01-resilience");
    expect(root.textContent).toContain("One bad day");
    for (const id of ["central", "federated", "nostr", "bluesky"])
      expect(getByTestId(`ch01-resilience-chart-bar-${id}`)).toBeDefined();
    expect(root.textContent).toContain("100%");
    expect(root.textContent).toContain("30%");
  });
});
