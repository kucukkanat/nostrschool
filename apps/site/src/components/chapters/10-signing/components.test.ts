import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { encodeNsec, unwrap } from "@nostrschool/protocol";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import Nip05Checker from "./Nip05Checker.svelte";
import { demoKeys } from "./playground.ts";
import SignerPlayground from "./SignerPlayground.svelte";
import SignerSequences from "./SignerSequences.svelte";
import SigningQuiz from "./SigningQuiz.svelte";

afterEach(cleanup);
const t = getDictionary("en").chapters.ch10;
const keys = unwrap(demoKeys());
const nsec = unwrap(encodeNsec(keys.user.secretKey));

const recordBus = () => {
  const seen: MascotEventType[] = [];
  const off = onAny((event) => seen.push(event.type));
  return { seen, off };
};

describe("SignerPlayground", () => {
  test("starts idle in extension mode with a prefilled note", () => {
    const { getByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    expect((getByTestId("ch10-mode-nip07-input") as HTMLInputElement).checked).toBe(true);
    expect((getByTestId("ch10-note-input") as HTMLTextAreaElement).value).toBe(
      t.playground.app.defaultNote,
    );
    expect(getByTestId("ch10-verdict").textContent).toBe(t.playground.verdict.idle);
    expect(getByTestId("ch10-audit").dataset["audit"]).toBe("idle");
  });

  test("extension: approve signs, publishes and keeps the key out of the app", async () => {
    const bus = recordBus();
    const { getByTestId, queryByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-sign"));
    expect(getByTestId("ch10-verdict").textContent).toBe(t.playground.verdict.awaiting);
    expect(getByTestId("ch10-prompt-content").textContent).toBe(t.playground.app.defaultNote);
    await fireEvent.click(getByTestId("ch10-approve"));
    expect(queryByTestId("ch10-prompt")).toBeNull();
    expect(getByTestId("ch10-result").dataset["verdict"]).toBe("safe");
    expect(getByTestId("ch10-audit").dataset["audit"]).toBe("safe");
    expect(getByTestId("ch10-wire-publish")).toBeTruthy();
    expect(getByTestId("ch10-memory").textContent).not.toContain("nsec1");
    expect(bus.seen).toContain("signature:valid");
    expect(bus.seen).toContain("celebrate");
    bus.off();
  });

  test("extension: reject signs nothing", async () => {
    const bus = recordBus();
    const { getByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-sign"));
    await fireEvent.click(getByTestId("ch10-reject"));
    expect(getByTestId("ch10-result").dataset["verdict"]).toBe("rejected");
    expect(getByTestId("ch10-memory-rejection")).toBeTruthy();
    expect(bus.seen).toContain("signature:invalid");
    bus.off();
  });

  test("paste mode leaks the nsec and the detector catches it", async () => {
    const bus = recordBus();
    const { getByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-mode-paste-input"));
    expect(getByTestId("ch10-app-nsec")).toBeTruthy();
    await fireEvent.click(getByTestId("ch10-sign"));
    expect(getByTestId("ch10-result").dataset["verdict"]).toBe("leaked");
    expect(getByTestId("ch10-audit-badge").textContent).toContain(t.playground.audit.leaked);
    expect(getByTestId("ch10-memory-nsec").textContent).toContain(nsec.slice(0, 24));
    expect(bus.seen).toContain("warning");
    bus.off();
  });

  test("bunker mode sends six encrypted kind 24133 hops, then publishes", async () => {
    const { getByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-mode-nip46-input"));
    expect(getByTestId("ch10-signer").textContent).toContain(t.playground.signer.title.nip46);
    await fireEvent.click(getByTestId("ch10-sign"));
    expect(getByTestId("ch10-memory-clientKey")).toBeTruthy();
    await fireEvent.click(getByTestId("ch10-approve"));
    for (const k of [
      "nip46ConnectReq",
      "nip46ConnectRes",
      "nip46PubkeyReq",
      "nip46PubkeyRes",
      "nip46SignReq",
      "nip46SignRes",
      "publish",
    ])
      expect(getByTestId(`ch10-wire-${k}`)).toBeTruthy();
    expect(getByTestId("ch10-wire").textContent).not.toContain(keys.user.secretKeyHex);
    expect(getByTestId("ch10-result").dataset["verdict"]).toBe("safe");
  });

  test("an empty note cannot be signed, and reset clears the state", async () => {
    const { getByTestId } = render(SignerPlayground, { props: { locale: "en" } });
    const input = getByTestId("ch10-note-input") as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: "" } });
    expect(input.value).toBe("");
    await fireEvent.input(input, { target: { value: "   " } });
    expect((getByTestId("ch10-sign") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.input(input, { target: { value: "hello" } });
    await fireEvent.click(getByTestId("ch10-sign"));
    await fireEvent.click(getByTestId("ch10-reset"));
    expect(getByTestId("ch10-verdict").textContent).toBe(t.playground.verdict.idle);
  });
});

describe("SignerSequences", () => {
  test("renders the NIP-07 flow and switches to NIP-46", async () => {
    const { getByTestId, queryByTestId } = render(SignerSequences, { props: { locale: "en" } });
    expect(getByTestId("ch10-seq-nip07-lane-extension").textContent).toContain(
      t.sequences.nip07.lanes.extension,
    );
    await fireEvent.click(getByTestId("ch10-seq-tabs-tab-nip46"));
    expect(getByTestId("ch10-seq-nip46-lane-bunker").textContent).toContain(
      t.sequences.nip46.lanes.bunker,
    );
    expect(queryByTestId("ch10-seq-nip07-lane-extension")).toBeNull();
  });

  test("stepping to the end emits signature:valid", async () => {
    const bus = recordBus();
    const { getByTestId } = render(SignerSequences, { props: { locale: "en" } });
    const forward = getByTestId("ch10-seq-nip07-controls-forward");
    for (let i = 0; i < 7; i += 1) await fireEvent.click(forward);
    expect(getByTestId("ch10-seq-nip07-narration").textContent).toContain(
      t.sequences.nip07.messages.publish.narration,
    );
    expect(bus.seen).toContain("signature:valid");
    bus.off();
  });
});

describe("Nip05Checker", () => {
  test("verifies the honest claim and shows nostr.json", async () => {
    const bus = recordBus();
    const { getByTestId } = render(Nip05Checker, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-nip05-verify"));
    expect(getByTestId("ch10-nip05-result").dataset["code"]).toBe("ok");
    expect(getByTestId("ch10-nip05-document")).toBeTruthy();
    expect(getByTestId("ch10-nip05-pipeline-stage-compare").dataset["state"]).not.toBe("error");
    expect(bus.seen).toContain("celebrate");
    bus.off();
  });

  test("scenario chips run the check: borrowed name fails with a mismatch", async () => {
    const bus = recordBus();
    const { getByTestId } = render(Nip05Checker, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-nip05-scenario-impostor"));
    expect((getByTestId("ch10-nip05-input") as HTMLInputElement).value).toBe("bob@beta.example");
    expect(getByTestId("ch10-nip05-result").dataset["code"]).toBe("pubkey-mismatch");
    expect(getByTestId("ch10-nip05-result").textContent).toBe(t.nip05.results["pubkey-mismatch"]);
    expect(bus.seen).toContain("warning");
    bus.off();
  });

  test("garbage and dead domains fail early without a document", async () => {
    const { getByTestId, queryByTestId } = render(Nip05Checker, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch10-nip05-scenario-garbage"));
    expect(getByTestId("ch10-nip05-result").dataset["code"]).toBe("invalid-format");
    await fireEvent.click(getByTestId("ch10-nip05-scenario-nodomain"));
    expect(getByTestId("ch10-nip05-result").dataset["code"]).toBe("fetch-failed");
    expect(queryByTestId("ch10-nip05-document")).toBeNull();
    await fireEvent.click(getByTestId("ch10-nip05-scenario-missing"));
    expect(getByTestId("ch10-nip05-result").dataset["code"]).toBe("name-not-found");
  });
});

describe("SigningQuiz", () => {
  test("renders three questions with the right answers marked", async () => {
    const { getByTestId } = render(SigningQuiz, { props: { locale: "en" } });
    for (const q of ["q1", "q2", "q3"] as const)
      expect(getByTestId(`ch10-quiz-${q}`).textContent).toContain(t.quiz[q].question);
    const bus = recordBus();
    await fireEvent.click(getByTestId("ch10-quiz-q1-option-b"));
    await fireEvent.click(getByTestId("ch10-quiz-q1-check"));
    expect(bus.seen).toContain("quiz:correct");
    bus.off();
  });
});
