import { afterAll, afterEach, expect, test } from "bun:test";
import { createEventBus, type MascotEventMap } from "@nostrschool/ui/bus.ts";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { startStaticHost } from "../test/static-host.ts";
import { MASCOT_POSES, Mascot, OstrichSvg } from "./index.ts";

afterEach(cleanup);

test("renders the requested pose with an accessible label", () => {
  const { getByTestId } = render(Mascot, { props: { locale: "en", pose: "wave" } });
  const el = getByTestId("mascot");
  expect(el.dataset["pose"]).toBe("wave");
  expect(el.dataset["renderer"]).toBe("svg");
  expect(el.getAttribute("role")).toBe("img");
  expect(el.getAttribute("aria-label")).toBe("Nos waves hello");
  expect(getByTestId("mascot-svg").getAttribute("aria-hidden")).toBe("true");
  expect(MASCOT_POSES).toContain("sleep");
});

test("every pose renders the SVG with a localized label", () => {
  for (const pose of MASCOT_POSES) {
    const { getByTestId } = render(Mascot, { props: { locale: "es", pose, testid: `m-${pose}` } });
    expect(getByTestId(`m-${pose}-svg`).dataset["pose"]).toBe(pose);
    expect(getByTestId(`m-${pose}`).getAttribute("aria-label")?.length).toBeGreaterThan(0);
    cleanup();
  }
});

test("size prop and speech bubble", () => {
  const { getByTestId, queryByTestId } = render(Mascot, {
    props: { locale: "en", size: "lg", say: "Hi!" },
  });
  expect(getByTestId("mascot-container").classList.contains("lg")).toBe(true);
  expect(getByTestId("mascot-bubble").textContent).toBe("Hi!");
  expect(getByTestId("mascot-bubble-region").getAttribute("aria-live")).toBe("polite");
  cleanup();
  render(Mascot, { props: { locale: "en", say: "" } });
  expect(queryByTestId("mascot-bubble")).toBeNull();
});

test("announce={false} keeps the bubble visible but silent", () => {
  const { getByTestId } = render(Mascot, {
    props: { locale: "en", say: "Already narrated", announce: false },
  });
  expect(getByTestId("mascot-bubble").textContent).toBe("Already narrated");
  expect(getByTestId("mascot-bubble-region").hasAttribute("aria-live")).toBe(false);
});

test("reacts to bus events silently, then returns to its pose", async () => {
  const bus = createEventBus<MascotEventMap>();
  const { getByTestId, container } = render(Mascot, { props: { locale: "en", bus, holdMs: 30 } });
  bus.emit("quiz:wrong", { quizId: "q1" });
  flushSync();
  expect(getByTestId("mascot").dataset["pose"]).toBe("think");
  expect(getByTestId("mascot").getAttribute("aria-label")).toBe("Nos is thinking");
  // Mood is alt text only: the island that emitted the event narrates it. The (empty) bubble
  // region is the only live region, and it speaks only when the caller passes `say`.
  const live = [...container.querySelectorAll("[aria-live]")].map((el) =>
    el.getAttribute("data-testid"),
  );
  expect(live).toEqual(["mascot-bubble-region"]);
  expect(getByTestId("mascot-bubble-region").textContent?.trim()).toBe("");
  await Bun.sleep(60);
  flushSync();
  expect(getByTestId("mascot").dataset["pose"]).toBe("idle");
});

test("reactive={false} ignores the bus", () => {
  const bus = createEventBus<MascotEventMap>();
  const { getByTestId } = render(Mascot, {
    props: { locale: "en", bus, reactive: false, pose: "sleep" },
  });
  bus.emit("celebrate", {});
  flushSync();
  expect(getByTestId("mascot").dataset["pose"]).toBe("sleep");
});

test("unmounting stops listening", () => {
  const bus = createEventBus<MascotEventMap>();
  const errors: unknown[] = [];
  const { unmount } = render(Mascot, { props: { locale: "en", bus } });
  unmount();
  const guarded = createEventBus<MascotEventMap>({ onListenerError: (e) => errors.push(e) });
  guarded.emit("celebrate", {});
  bus.emit("celebrate", {});
  expect(errors).toEqual([]);
});

// Real static server: the .riv is absent, so the SVG must stay (the default state of the site).
const host = await startStaticHost({});
afterAll(() => host.stop());

test("falls back to SVG when the Rive asset does not exist", async () => {
  const { getByTestId, queryByTestId } = render(Mascot, {
    props: { locale: "en", riveSrc: host.url("/mascot/ostrich.riv") },
  });
  await Bun.sleep(30);
  flushSync();
  expect(getByTestId("mascot").dataset["renderer"]).toBe("svg");
  expect(queryByTestId("mascot-canvas")).toBeNull();
});

test("OstrichSvg freezes loops when still", () => {
  const { getByTestId } = render(OstrichSvg, { props: { pose: "panic", still: true } });
  const svg = getByTestId("mascot-svg");
  expect(svg.classList.contains("still")).toBe(true);
  expect(svg.querySelectorAll(".prop").length).toBe(5);
});
