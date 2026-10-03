import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { type MascotEventType, mascotBus } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import EnvelopeLab from "./EnvelopeLab.svelte";
import PaddingMeter from "./PaddingMeter.svelte";
import PrivateMessagesQuiz from "./PrivateMessagesQuiz.svelte";

const t = getDictionary("en").chapters.ch08;
afterEach(cleanup);

const recordBus = () => {
  const seen: MascotEventType[] = [];
  const off = mascotBus.onAny((e) => seen.push(e.type));
  return { seen, off };
};
const settle = async () => {
  await tick();
  await new Promise((r) => setTimeout(r, 0));
};

describe("EnvelopeLab", () => {
  test("starts on NIP-04 with five leaks and Bob reads the message", async () => {
    const { getByTestId, queryByTestId } = render(EnvelopeLab, { props: { locale: "en" } });
    expect(getByTestId("ch08-scheme-nip04").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch08-leak-summary").dataset["leaks"]).toBe("5");
    expect(getByTestId("ch08-fact-sender").dataset["exposure"]).toBe("leaked");
    expect(getByTestId("ch08-fact-sender").textContent).toContain("Alice");
    await fireEvent.click(getByTestId("ch08-peel"));
    expect(getByTestId("ch08-revealed-text").textContent).toBe(t.lab.defaultMessage);
    expect(queryByTestId("ch08-garbage-warning")).toBeNull();
    expect((getByTestId("ch08-peel") as HTMLButtonElement).disabled).toBe(true);
  });

  test("NIP-17: peel three layers as Bob, celebrate, author verified", async () => {
    const bus = recordBus();
    const { getByTestId } = render(EnvelopeLab, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch08-scheme-nip17"));
    expect(getByTestId("ch08-leak-summary").dataset["leaks"]).toBe("1");
    expect(getByTestId("ch08-fact-sender").dataset["exposure"]).toBe("hidden");
    expect(getByTestId("ch08-narration").textContent).toContain("NIP-17");
    expect(getByTestId("ch08-layer-wrap").dataset["state"]).toBe("sealed");
    await fireEvent.click(getByTestId("ch08-peel"));
    expect(getByTestId("ch08-layer-wrap").dataset["state"]).toBe("open");
    expect(getByTestId("ch08-layer-seal").dataset["state"]).toBe("sealed");
    expect(getByTestId("ch08-narration").textContent).toContain("Gift wrap");
    await fireEvent.click(getByTestId("ch08-peel"));
    expect(getByTestId("ch08-stack").dataset["opened"]).toBe("2");
    expect(getByTestId("ch08-revealed-text").textContent).toBe(t.lab.defaultMessage);
    expect(getByTestId("ch08-author-check")).toBeTruthy();
    expect(getByTestId("ch08-layer-rumor-json-toggle")).toBeTruthy();
    expect(bus.seen).toContain("celebrate");
    await fireEvent.click(getByTestId("ch08-reset"));
    expect(getByTestId("ch08-stack").dataset["opened"]).toBe("0");
    expect(getByTestId("ch08-narration").textContent).toBe(t.lab.narration.reset);
    bus.off();
  });

  test("Carol and the relay cannot get in", async () => {
    const bus = recordBus();
    const { getByTestId } = render(EnvelopeLab, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch08-scheme-nip44"));
    await fireEvent.click(getByTestId("ch08-viewer-carol"));
    expect(getByTestId("ch08-peel").textContent).toContain("Carol");
    await fireEvent.click(getByTestId("ch08-peel"));
    await settle();
    expect(getByTestId("ch08-peel-error").textContent).toContain("Wrong key");
    expect(bus.seen).toContain("warning");
    await fireEvent.click(getByTestId("ch08-viewer-relay"));
    await fireEvent.click(getByTestId("ch08-peel"));
    expect(getByTestId("ch08-peel-error").textContent?.trim()).toBe(t.lab.errors["no-key"]);
    bus.off();
  });

  test("NIP-04 as Carol: padding error or garbage, with the no-MAC warning", async () => {
    const { getByTestId, queryByTestId } = render(EnvelopeLab, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch08-viewer-carol"));
    await fireEvent.click(getByTestId("ch08-peel"));
    await settle();
    const warned =
      queryByTestId("ch08-garbage-warning") !== null ||
      (queryByTestId("ch08-peel-error")?.textContent ?? "").includes("integrity");
    expect(warned).toBe(true);
  });

  test("resend makes a new throwaway key; raw JSON toggles; empty message errors", async () => {
    const { getByTestId, queryByTestId } = render(EnvelopeLab, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch08-scheme-nip17"));
    await fireEvent.click(getByTestId("ch08-raw-toggle"));
    const pubkey = () => getByTestId("ch08-raw-json-path-pubkey").textContent;
    const before = pubkey();
    await fireEvent.click(getByTestId("ch08-resend"));
    expect(pubkey()).not.toBe(before);
    await fireEvent.click(getByTestId("ch08-raw-toggle"));
    expect(queryByTestId("ch08-raw-json")).toBeNull();

    const input = getByTestId("ch08-message-input") as HTMLTextAreaElement;
    input.value = "   ";
    await fireEvent.input(input);
    expect(getByTestId("ch08-build-error").textContent).toBe(t.lab.errors["empty-message"]);
    expect(queryByTestId("ch08-relay-view")).toBeNull();
    input.value = "hi";
    await fireEvent.input(input);
    expect(getByTestId("ch08-message-count").textContent).toContain("2 /");
  });
});

describe("PaddingMeter", () => {
  test("shows real, NIP-04 and NIP-44 sizes and the bucket", async () => {
    const { getByTestId } = render(PaddingMeter, { props: { locale: "en" } });
    expect(getByTestId("ch08-padding-value-real").textContent).toBe("3 bytes");
    expect(getByTestId("ch08-padding-value-nip04").textContent).toBe("16 bytes");
    expect(getByTestId("ch08-padding-value-nip44").textContent).toBe("32 bytes");
    const input = getByTestId("ch08-padding-input") as HTMLInputElement;
    input.value = "x".repeat(40);
    await fireEvent.input(input);
    expect(getByTestId("ch08-padding-value-nip44").textContent).toBe("64 bytes");
    expect(getByTestId("ch08-padding-bucket").textContent).toContain("33 to 64");
  });
});

describe("PrivateMessagesQuiz", () => {
  test("renders three questions", () => {
    const { getByTestId } = render(PrivateMessagesQuiz, { props: { locale: "en" } });
    for (const n of ["q1", "q2", "q3"]) expect(getByTestId(`ch08-quiz-${n}`)).toBeTruthy();
    expect(getByTestId("ch08-quiz-q1-option-b")).toBeTruthy();
  });
});
