import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import ChapterQuiz from "./ChapterQuiz.svelte";
import ComparisonMatrix from "./ComparisonMatrix.svelte";
import CourseComplete from "./CourseComplete.svelte";
import PowMiner from "./PowMiner.svelte";
import { countLeadingZeroBits } from "./pow.ts";
import ScenarioExplorer from "./ScenarioExplorer.svelte";

const t = getDictionary("en").chapters.ch12;
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

const waitFor = async (check: () => boolean, timeoutMs = 5000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error("timed out");
    await tick(10);
  }
};

/** Records real mascot-bus traffic (the app-wide singleton), no mocks. */
const recordBus = () => {
  const seen: { type: MascotEventType; reason?: string }[] = [];
  const off = onAny((e) => {
    const payload = e.payload as { reason?: string };
    seen.push(
      payload.reason === undefined ? { type: e.type } : { type: e.type, reason: payload.reason },
    );
  });
  return { seen, off };
};

afterEach(() => cleanup());

describe("ComparisonMatrix", () => {
  test("renders every cell and the balanced ranking", () => {
    const { getByTestId, container } = render(ComparisonMatrix, { props: { locale: "en" } });
    expect(container.querySelectorAll('[data-testid^="ch12-cell-"]')).toHaveLength(36);
    expect(getByTestId("ch12-rank-bluesky").dataset["rank"]).toBe("1");
    expect(getByTestId("ch12-rank-nostr").dataset["score"]).toBe("61");
    expect(getByTestId("ch12-preset-balanced").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch12-col-bluesky").classList.contains("leader")).toBe(true);
    expect(getByTestId("ch12-detail").textContent).toContain(t.matrix.detailEmpty);
  });

  test("a persona preset puts Nostr on top and cheers the mascot", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(ComparisonMatrix, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch12-preset-dissident"));
    expect(getByTestId("ch12-rank-nostr").dataset["rank"]).toBe("1");
    expect(getByTestId("ch12-verdict").textContent).toContain(t.matrix.nostrLeads);
    expect(getByTestId("ch12-priority-identity").getAttribute("aria-pressed")).toBe("true");
    expect(seen).toContainEqual({ type: "celebrate", reason: "ch12-nostr-leads" });
    // Toggling a priority off breaks the preset match; another one flips the leader back.
    await fireEvent.click(getByTestId("ch12-priority-identity"));
    expect(getByTestId("ch12-preset-dissident").getAttribute("aria-pressed")).toBe("false");
    await fireEvent.click(getByTestId("ch12-preset-casual"));
    expect(getByTestId("ch12-rank-nostr").dataset["rank"]).toBe("4");
    expect(getByTestId("ch12-verdict").textContent).toContain("Bluesky comes out on top");
    off();
  });

  test("clicking a cell explains the rating", async () => {
    const { getByTestId } = render(ComparisonMatrix, { props: { locale: "en" } });
    const cell = getByTestId("ch12-cell-recovery-nostr");
    expect(cell.dataset["rating"]).toBe("poor");
    expect(cell.getAttribute("aria-label")).toContain("Account recovery on Nostr: Weak");
    await fireEvent.click(cell);
    expect(cell.getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch12-detail-text").textContent).toBe(t.matrix.notes.recovery.nostr);
    expect(getByTestId("ch12-detail-rating").textContent).toBe(t.ratings.poor);
  });
});

describe("ScenarioExplorer", () => {
  test("starts with a lost key: Nostr panics, others are merely annoyed", () => {
    const { getByTestId } = render(ScenarioExplorer, { props: { locale: "en" } });
    expect(getByTestId("ch12-outcome-nostr").dataset["severity"]).toBe("disaster");
    expect(getByTestId("ch12-outcome-x").dataset["severity"]).toBe("bumpy");
    expect(getByTestId("ch12-scenarios-mood").dataset["mood"]).toBe("panic");
    expect(getByTestId("ch12-mascot").dataset["pose"]).toBe("panic");
    expect(getByTestId("ch12-scenarios-narration").textContent).toContain("Nostr: Disaster");
    // The narration region already speaks; the bubble must not announce the same change twice.
    expect(getByTestId("ch12-mascot-bubble-region").hasAttribute("aria-live")).toBe(false);
  });

  test("precautions soften Nostr outcomes and a fully prepared nostrich celebrates", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(ScenarioExplorer, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch12-scenario-relayBan-input"));
    expect(getByTestId("ch12-outcome-x").dataset["severity"]).toBe("disaster");
    expect(getByTestId("ch12-outcome-nostr-relayBan").textContent).toContain(
      t.scenarios.outcomes.nostr.relayBan,
    );
    await fireEvent.click(getByTestId("ch12-prep-backup-input"));
    expect(getByTestId("ch12-outcome-nostr").dataset["severity"]).toBe("ouch");
    expect(getByTestId("ch12-scenarios-mood").dataset["mood"]).toBe("worried");
    await fireEvent.click(getByTestId("ch12-prep-multiRelay-input"));
    expect(getByTestId("ch12-outcome-nostr").dataset["severity"]).toBe("fine");
    expect(getByTestId("ch12-scenarios-mood").dataset["mood"]).toBe("calm");
    await fireEvent.click(getByTestId("ch12-prep-wot-input"));
    expect(getByTestId("ch12-scenarios-mood").dataset["mood"]).toBe("prepared");
    expect(seen).toContainEqual({ type: "celebrate", reason: "ch12-prepared" });
    // A stolen key beats every precaution: no key rotation.
    await fireEvent.click(getByTestId("ch12-scenario-keyLeak-input"));
    expect(getByTestId("ch12-outcome-nostr").dataset["severity"]).toBe("disaster");
    off();
  });

  test("all clear when every scenario is off", async () => {
    const { getByTestId } = render(ScenarioExplorer, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch12-scenario-lostKey-input"));
    expect(getByTestId("ch12-scenarios-narration").textContent).toBe(t.scenarios.allClear);
    expect(getByTestId("ch12-outcome-mastodon").dataset["severity"]).toBe("fine");
    expect(getByTestId("ch12-outcome-mastodon").textContent).toContain(t.scenarios.allClear);
  });
});

describe("PowMiner", () => {
  test("mines, signs a valid NIP-13 note and celebrates", async () => {
    const { seen, off } = recordBus();
    const { getByTestId, queryByTestId } = render(PowMiner, {
      props: { locale: "en", chunkSize: 50 },
    });
    expect(getByTestId("ch12-pow-status").textContent).toContain(t.pow.idle);
    await fireEvent.input(getByTestId("ch12-pow-difficulty"), { target: { value: "8" } });
    expect(getByTestId("ch12-pow-difficulty-value").textContent).toContain("8 bits ≈ 256 tries");
    await fireEvent.click(getByTestId("ch12-pow-mine"));
    await waitFor(() => getByTestId("ch12-pow").dataset["status"] === "found");
    expect(getByTestId("ch12-pow-status").textContent).toContain("Found it after");
    const json = getByTestId("ch12-pow-signed").textContent ?? "";
    expect(json).toContain("nonce");
    const id = getByTestId("ch12-pow-best-id").textContent ?? "";
    expect(countLeadingZeroBits(id)).toBeGreaterThanOrEqual(8);
    expect(getByTestId("ch12-pow-best-id").querySelector("mark")?.textContent).toBe("00");
    expect(
      Number((getByTestId("ch12-pow-attempts-value").textContent ?? "0").replace(/,/g, "")),
    ).toBeGreaterThan(0);
    expect(seen).toContainEqual({ type: "celebrate", reason: "ch12-pow" });
    expect(getByTestId("ch12-pow-spam").textContent).toContain("10,000");
    await fireEvent.click(getByTestId("ch12-pow-reset"));
    expect(queryByTestId("ch12-pow-signed")).toBeNull();
    expect(getByTestId("ch12-pow").dataset["status"]).toBe("idle");
    off();
  });

  test("stop halts a long run", async () => {
    const { getByTestId } = render(PowMiner, { props: { locale: "en", chunkSize: 20 } });
    await fireEvent.input(getByTestId("ch12-pow-difficulty"), { target: { value: "20" } });
    await fireEvent.click(getByTestId("ch12-pow-mine"));
    await waitFor(() => getByTestId("ch12-pow-status").textContent?.includes("Mining") === true);
    await fireEvent.click(getByTestId("ch12-pow-stop"));
    expect(getByTestId("ch12-pow").dataset["status"]).toBe("stopped");
    const count = getByTestId("ch12-pow-attempts-value").textContent;
    await tick(30);
    expect(getByTestId("ch12-pow-attempts-value").textContent).toBe(count);
    expect(getByTestId("ch12-pow-status").textContent).toContain("Stopped after");
  });

  test("editing the note resets the miner", async () => {
    const { getByTestId } = render(PowMiner, { props: { locale: "en" } });
    await fireEvent.input(getByTestId("ch12-pow-difficulty"), { target: { value: "2" } });
    await fireEvent.click(getByTestId("ch12-pow-mine"));
    await waitFor(() => getByTestId("ch12-pow").dataset["status"] === "found");
    await fireEvent.input(getByTestId("ch12-pow-content"), { target: { value: "gm" } });
    expect(getByTestId("ch12-pow").dataset["status"]).toBe("idle");
  });
});

describe("CourseComplete", () => {
  test("celebrates on arrival and on demand, with next-step links", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(CourseComplete, { props: { locale: "en" } });
    expect(seen).toContainEqual({ type: "celebrate", reason: "ch12-course-complete" });
    expect(getByTestId("ch12-complete-progress").textContent).toMatch(/of 12 chapters/);
    expect(getByTestId("ch12-next-keys").getAttribute("href")).toBe("/en/tools/keys/");
    expect(getByTestId("ch12-next-glossary").getAttribute("href")).toBe("/en/glossary/");
    expect(getByTestId("ch12-resource-nips").getAttribute("href")).toBe(
      "https://github.com/nostr-protocol/nips",
    );
    expect(getByTestId("ch12-resource-nips").getAttribute("rel")).toBe("noopener noreferrer");
    expect(getByTestId("ch12-complete-mascot").dataset["pose"]).toBe("celebrate");
    await fireEvent.click(getByTestId("ch12-celebrate"));
    await tick();
    expect(getByTestId("ch12-celebrate-status").textContent).toContain(t.complete.celebrated);
    expect(seen).toContainEqual({ type: "celebrate", reason: "ch12-graduation" });
    off();
  });
});

describe("ChapterQuiz", () => {
  test("renders three questions and grades a correct answer", async () => {
    const { seen, off } = recordBus();
    const { getByTestId } = render(ChapterQuiz, { props: { locale: "en" } });
    for (const id of ["q1", "q2", "q3"]) expect(getByTestId(`ch12-quiz-${id}`)).toBeDefined();
    await fireEvent.click(getByTestId("ch12-quiz-q1-option-b"));
    await fireEvent.click(getByTestId("ch12-quiz-q1-check"));
    expect(getByTestId("ch12-quiz-q1-explanation-b").textContent).toContain(
      t.quiz.q1.options.b.explanation,
    );
    expect(seen).toContainEqual({ type: "quiz:correct" });
    off();
  });
});
