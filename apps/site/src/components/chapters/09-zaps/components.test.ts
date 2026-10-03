import { afterEach, describe, expect, test } from "bun:test";
import { getPersona, zaps } from "@nostrschool/fixtures";
import { getDictionary } from "@nostrschool/i18n";
import { fail } from "@nostrschool/protocol";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import Lud16Lookup from "./Lud16Lookup.svelte";
import ReceiptChecker from "./ReceiptChecker.svelte";
import ZapFlow from "./ZapFlow.svelte";
import { buildZapFlow, type ZapError } from "./zap-logic.ts";

afterEach(cleanup);
const t = getDictionary("en").chapters.ch09;
const tick = () => new Promise((r) => setTimeout(r, 0));

const recordBus = () => {
  const seen: MascotEventType[] = [];
  const off = onAny((event) => seen.push(event.type));
  return { seen, off };
};

describe("ZapFlow", () => {
  test("renders the swimlane with four lanes and starts at step 1", () => {
    const { getByTestId } = render(ZapFlow, { props: { locale: "en" } });
    for (const lane of ["client", "server", "lightning", "relays"])
      expect(getByTestId(`ch09-swimlane-lane-${lane}`).textContent).toContain(
        t.flow.lanes[lane as keyof typeof t.flow.lanes],
      );
    expect(getByTestId("ch09-flow-detail").dataset["step"]).toBe("profile");
    expect(getByTestId("ch09-flow-detail-body").textContent).toContain(getPersona("erin").lud16);
    expect(getByTestId("ch09-swimlane-narration").textContent).toContain(
      t.flow.steps.profile.title,
    );
    expect(getByTestId("ch09-flow-counter-value").textContent).toContain("—");
  });

  test("stepping forward reaches the receipt, celebrates and lights the counter", async () => {
    const bus = recordBus();
    const { getByTestId, queryByTestId } = render(ZapFlow, { props: { locale: "en" } });
    const forward = getByTestId("ch09-swimlane-controls-forward");
    for (let i = 0; i < 8; i += 1) await fireEvent.click(forward);
    flushSync();
    expect(getByTestId("ch09-flow-detail").dataset["step"]).toBe("receipt");
    expect(getByTestId("ch09-flow-toast").textContent).toBe(t.flow.receiptToast);
    expect(bus.seen).toContain("celebrate");
    expect(queryByTestId("ch09-flow-payload")).not.toBeNull();
    await fireEvent.click(forward);
    flushSync();
    expect(getByTestId("ch09-flow-counter-value").textContent).toContain("2,100 sats");
    expect(getByTestId("ch09-swimlane-step-tally").dataset["state"]).toBe("current");
    bus.off();
  });

  test("picking another zap resets to step 1 and updates the story", async () => {
    const { getByTestId } = render(ZapFlow, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch09-swimlane-controls-forward"));
    flushSync();
    expect(getByTestId("ch09-flow-detail").dataset["step"]).toBe("lnurlp");
    const input = getByTestId("ch09-flow-pick-2-input") as HTMLInputElement;
    input.checked = true;
    await fireEvent.change(input);
    flushSync();
    expect(getByTestId("ch09-flow-detail").dataset["step"]).toBe("profile");
    expect(getByTestId("ch09-flow-detail-body").textContent).toContain(getPersona("dave").lud16);
    expect(getByTestId("ch09-flow-pick-2").className).toContain("active");
    expect(getByTestId("ch09-flow-fixture-note").textContent).toBe(t.flow.fixtureNote);
  });

  test("play toggles playback through the bound state", async () => {
    const { getByTestId } = render(ZapFlow, { props: { locale: "en" } });
    const play = getByTestId("ch09-swimlane-controls-play");
    await fireEvent.click(play);
    flushSync();
    expect(play.getAttribute("aria-pressed")).toBe("true");
    await fireEvent.click(play);
    flushSync();
    expect(play.getAttribute("aria-pressed")).toBe("false");
  });

  test("a broken flow is shown as an alert and a danger callout, never hidden", () => {
    const all = zaps();
    const first = all[0];
    if (first === undefined) throw new Error("fixtures have no zaps");
    const broken = fail<ZapError["code"]>("unknown-wallet", "no wallet server for x.example");
    const { getByTestId } = render(ZapFlow, {
      props: { locale: "en", flows: [broken, buildZapFlow(first, all)] },
    });
    expect(getByTestId("ch09-flow-error-0").textContent).toBe("no wallet server for x.example");
    expect(getByTestId("ch09-flow-failure").textContent).toContain("no wallet server");
  });

  test("no zaps at all says so", () => {
    const { getByTestId, queryByTestId } = render(ZapFlow, { props: { locale: "en", flows: [] } });
    expect(getByTestId("ch09-flow-empty").textContent).toBe(t.flow.noZaps);
    expect(queryByTestId("ch09-flow-detail")).toBeNull();
  });
});

describe("ReceiptChecker", () => {
  const pick = async (getByTestId: (id: string) => HTMLElement, s: string) => {
    const input = getByTestId(`ch09-checker-scenario-${s}-input`) as HTMLInputElement;
    input.checked = true;
    await fireEvent.change(input);
    flushSync();
    await tick();
  };

  test("honest receipt passes every check", () => {
    const { getByTestId } = render(ReceiptChecker, { props: { locale: "en" } });
    expect(getByTestId("ch09-checker-verdict").dataset["valid"]).toBe("true");
    expect(getByTestId("ch09-checker-narration").textContent).toContain("5 of 5");
    expect(getByTestId("ch09-checker-check-signature").dataset["passed"]).toBe("true");
  });

  test("tampered and impostor receipts are rejected; the mascot reacts", async () => {
    const bus = recordBus();
    const { getByTestId, queryByTestId } = render(ReceiptChecker, { props: { locale: "en" } });
    await pick(getByTestId, "tampered");
    expect(getByTestId("ch09-checker-verdict").dataset["valid"]).toBe("false");
    expect(getByTestId("ch09-checker-check-signature").dataset["passed"]).toBe("false");
    expect(getByTestId("ch09-checker-check-amount").dataset["passed"]).toBe("false");
    await pick(getByTestId, "impostor");
    expect(getByTestId("ch09-checker-check-signer").dataset["passed"]).toBe("false");
    expect(getByTestId("ch09-checker-scenario-body").textContent).toBe(
      t.checker.scenarios.impostor.body,
    );
    expect(queryByTestId("ch09-checker-liar")).toBeNull();
    expect(bus.seen.filter((e) => e === "signature:invalid")).toHaveLength(2);
    bus.off();
  });

  test("the lying wallet passes everything — and the warning explains why that matters", async () => {
    const bus = recordBus();
    const { getByTestId } = render(ReceiptChecker, { props: { locale: "en" } });
    await pick(getByTestId, "liar");
    expect(getByTestId("ch09-checker-verdict").dataset["valid"]).toBe("true");
    expect(getByTestId("ch09-checker-liar").textContent).toContain(t.checker.liarNote);
    expect(bus.seen).toContain("signature:valid");
    bus.off();
  });
});

describe("ReceiptChecker failure states", () => {
  test("an un-forgeable invoice surfaces the forge error", async () => {
    const first = zaps()[0];
    if (first === undefined) throw new Error("fixtures have no zaps");
    const { getByTestId, queryByTestId } = render(ReceiptChecker, {
      props: { locale: "en", zapList: [{ ...first, bolt11: "lnbc1qqqq" }] },
    });
    const input = getByTestId("ch09-checker-scenario-tampered-input") as HTMLInputElement;
    input.checked = true;
    await fireEvent.change(input);
    flushSync();
    expect(getByTestId("ch09-checker-error").textContent).toContain("invoice has no amount");
    expect(queryByTestId("ch09-checker-verdict")).toBeNull();
  });

  test("with no zap to check it shows the title in a danger callout", () => {
    const { getByTestId } = render(ReceiptChecker, { props: { locale: "en", zapList: [] } });
    expect(getByTestId("ch09-checker-error").textContent).toContain(t.checker.title);
  });
});

describe("Lud16Lookup", () => {
  test("starts on Erin's address and shows the well-known URL", () => {
    const { getByTestId } = render(Lud16Lookup, { props: { locale: "en" } });
    expect(getByTestId("ch09-lookup-url").textContent?.replace(/\s/g, "")).toBe(
      "https://wallet.alpha.example/.well-known/lnurlp/erin",
    );
  });

  test("typing an invalid address explains the problem; examples fill the input", async () => {
    const { getByTestId } = render(Lud16Lookup, { props: { locale: "en" } });
    const input = getByTestId("ch09-lookup-input") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "erin" } });
    flushSync();
    expect(getByTestId("ch09-lookup-error").dataset["code"]).toBe("format");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await fireEvent.click(getByTestId("ch09-lookup-example-bob"));
    flushSync();
    expect(input.value).toBe(getPersona("bob").lud16);
    expect(getByTestId("ch09-lookup-url").textContent).toContain("bob");
  });
});
