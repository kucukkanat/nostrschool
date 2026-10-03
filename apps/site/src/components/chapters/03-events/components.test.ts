import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import type { MascotEventType } from "@nostrschool/ui";
import { onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import EventInspector from "./EventInspector.svelte";
import EventLab from "./EventLab.svelte";
import ExplodedEvent from "./ExplodedEvent.svelte";
import FieldDetail from "./FieldDetail.svelte";
import { type EventField, flipHexChar, prettyEvent, type VerifyView, verifyView } from "./lab.ts";
import { sampleNote, sampleReply } from "./sample.ts";
import VerifyPipeline from "./VerifyPipeline.svelte";

afterEach(cleanup);
const t = getDictionary("en").chapters.ch03;
const note = sampleNote(t.sampleContent);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Records mascot bus traffic for the duration of a test (the real app-wide bus, no mocks). */
const recordBus = () => {
  const seen: MascotEventType[] = [];
  const off = onAny((e) => seen.push(e.type));
  return { seen, off };
};

describe("ExplodedEvent", () => {
  test("renders seven tiles, selects/deselects, flags suspects", async () => {
    const r = render(ExplodedEvent, {
      props: { testid: "x", locale: "en", event: note, flagged: ["sig"] },
    });
    expect(r.getByTestId("x").querySelectorAll("li")).toHaveLength(7);
    expect(r.getByTestId("x-value-kind").textContent).toBe("1");
    expect(r.getByTestId("x-value-content").textContent).toBe(JSON.stringify(note.content));
    expect(r.getByTestId("x-value-tags").textContent).toBe(JSON.stringify(note.tags));
    expect(r.getByTestId("x-value-id").textContent).toContain("…");
    expect(r.getByTestId("x-field-sig").dataset["flagged"]).toBe("true");
    expect(r.getByTestId("x-flag-sig").textContent).toBe(t.fields.flagged);
    expect(r.queryByTestId("x-flag-id")).toBeNull();
    const btn = r.getByTestId("x-field-kind");
    await fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    await fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("FieldDetail", () => {
  const detail = (field: EventField, event = note) =>
    render(FieldDetail, { props: { testid: "d", locale: "en", event, field } });
  test("hex fields show full value with copy", () => {
    const r = detail("sig");
    expect(r.getByTestId("d-hex").textContent).toBe(note.sig);
    expect(r.getByTestId("d-copy")).toBeTruthy();
    expect(r.getByTestId("d").dataset["field"]).toBe("sig");
  });
  test("created_at, kind, content", () => {
    expect(detail("created_at").getByTestId("d-date").textContent).toContain("2025");
    cleanup();
    const k = detail("kind");
    expect(k.getByTestId("d-kind").textContent).toContain("1:");
    expect(k.getByTestId("d-category")).toBeTruthy();
    cleanup();
    const unknown = detail("kind", { ...note, kind: 4242 });
    expect(unknown.queryByTestId("d-category")).toBeNull();
    cleanup();
    expect(detail("content").getByTestId("d-content").textContent).toBe(note.content);
  });
  test("tags list with indexed badges, and the empty case", () => {
    const r = detail("tags", {
      ...note,
      tags: [
        ["t", "nostr"],
        ["client", "x"],
      ],
    });
    expect(r.getByTestId("d-tag-0").textContent).toContain(t.tags.names.t);
    expect(r.getByTestId("d-tag-0-indexed")).toBeTruthy();
    expect(r.queryByTestId("d-tag-1-indexed")).toBeNull();
    cleanup();
    expect(detail("tags", { ...note, tags: [] }).getByTestId("d-tags-empty").textContent).toBe(
      t.tags.empty,
    );
  });
});

describe("VerifyPipeline", () => {
  test("settles instantly with stepMs 0", () => {
    let settled = "";
    const r = render(VerifyPipeline, {
      props: {
        testid: "p",
        locale: "en",
        view: verifyView(note),
        run: 1,
        stepMs: 0,
        onsettle: (v: VerifyView) => {
          settled = v.status;
        },
      },
    });
    expect(settled).toBe("ok");
    expect(r.getByTestId("p-wrap").dataset["status"]).toBe("ok");
    expect(r.getByTestId("p-stage-schnorr").dataset["state"]).toBe("done");
  });
  test("animates stage by stage and stops at the failing check", async () => {
    const view = verifyView({ ...note, content: "tampered" });
    const r = render(VerifyPipeline, {
      props: { testid: "p", locale: "en", view, run: 1, stepMs: 5 },
    });
    expect(r.getByTestId("p-wrap").dataset["status"]).toBe("running");
    await wait(60);
    expect(r.getByTestId("p-wrap").dataset["status"]).toBe("error");
    expect(r.getByTestId("p-stage-compare").dataset["state"]).toBe("error");
    expect(r.getByTestId("p-stage-schnorr").dataset["state"]).toBe("pending");
  });
});

describe("EventLab", () => {
  const lab = () => render(EventLab, { props: { locale: "en", stepMs: 0 } });

  test("starts valid with the id explained", () => {
    const r = lab();
    expect(r.getByTestId("ch03-lab-verdict").dataset["status"]).toBe("ok");
    expect(r.getByTestId("ch03-lab-narration").textContent).toBe(t.lab.narration.ready);
    expect(r.getByTestId("ch03-detail").dataset["field"]).toBe("id");
    expect(r.getByTestId("ch03-lab-avalanche").textContent).toContain(t.lab.avalancheIdle);
    expect(r.getByTestId("ch03-mascot")).toBeTruthy();
    expect(r.getByTestId("ch03-mascot-bubble-region").hasAttribute("aria-live")).toBe(false);
  });

  test("author edit stays valid and shows the avalanche", async () => {
    const r = lab();
    const area = r.getByTestId("ch03-lab-content") as HTMLTextAreaElement;
    await fireEvent.input(area, { target: { value: "Hello Nostr?" } });
    expect(r.getByTestId("ch03-lab-verdict").dataset["status"]).toBe("ok");
    expect(r.getByTestId("ch03-lab-avalanche-count").textContent).toMatch(/\d+ of 64/);
    expect(r.getByTestId("ch03-lab-narration").textContent).toContain("content");
  });

  test("forger edit fails at compare; mascot panics; re-sign is refused", async () => {
    const bus = recordBus();
    const r = lab();
    await fireEvent.click(r.getByTestId("ch03-lab-mode-forger"));
    expect(r.getByTestId("ch03-lab-mode-hint").textContent).toBe(t.lab.modeHint.forger);
    await fireEvent.click(r.getByTestId("ch03-lab-time-later"));
    expect(r.getByTestId("ch03-lab-verdict").dataset["code"]).toBe("id-mismatch");
    expect(r.getByTestId("ch03-pipeline-stage-compare").dataset["state"]).toBe("error");
    expect(r.getByTestId("ch03-exploded-field-id").dataset["flagged"]).toBe("true");
    expect(bus.seen).toContain("signature:invalid");
    await fireEvent.click(r.getByTestId("ch03-lab-resign"));
    expect(r.getByTestId("ch03-lab-narration").textContent).toBe(t.lab.noKey);
    await fireEvent.click(r.getByTestId("ch03-lab-time-earlier"));
    expect(r.getByTestId("ch03-lab-verdict").dataset["status"]).toBe("ok");
    bus.off();
  });

  test("tamper sig fails at the last stage; author re-sign and reset recover", async () => {
    const bus = recordBus();
    const r = lab();
    await fireEvent.click(r.getByTestId("ch03-lab-tamper-sig"));
    expect(r.getByTestId("ch03-lab-verdict").dataset["code"]).toBe("bad-signature");
    expect(r.getByTestId("ch03-pipeline-stage-schnorr").dataset["state"]).toBe("error");
    await fireEvent.click(r.getByTestId("ch03-lab-resign"));
    expect(r.getByTestId("ch03-lab-verdict").dataset["status"]).toBe("ok");
    expect(bus.seen).toEqual(["signature:invalid", "signature:valid"]);
    for (const target of ["content", "created_at", "id"] as const) {
      await fireEvent.click(r.getByTestId(`ch03-lab-tamper-${target}`));
      expect(r.getByTestId("ch03-lab-verdict").dataset["code"]).toBe("id-mismatch");
    }
    await fireEvent.click(r.getByTestId("ch03-lab-reset"));
    expect(r.getByTestId("ch03-lab-verdict").dataset["status"]).toBe("ok");
    expect(r.getByTestId("ch03-lab-narration").textContent).toBe(t.lab.narration.reset);
    bus.off();
  });

  test("switches to raw JSON and selects a field from a path", async () => {
    const r = lab();
    await fireEvent.click(r.getByTestId("ch03-lab-view-json"));
    expect(r.queryByTestId("ch03-exploded")).toBeNull();
    await fireEvent.click(r.getByTestId("ch03-json-path-kind"));
    expect(r.getByTestId("ch03-detail").dataset["field"]).toBe("kind");
    await fireEvent.click(r.getByTestId("ch03-lab-view-exploded"));
    expect(r.getByTestId("ch03-exploded")).toBeTruthy();
  });
});

describe("EventInspector", () => {
  const inspector = () => render(EventInspector, { props: { locale: "en", stepMs: 0 } });

  test("empty, sample, tampered, clear", async () => {
    const bus = recordBus();
    const r = inspector();
    expect(r.getByTestId("ch03-inspector-empty").textContent).toBe(t.inspector.empty);
    await fireEvent.click(r.getByTestId("ch03-inspector-sample"));
    expect(r.getByTestId("ch03-inspector-verdict").dataset["status"]).toBe("ok");
    expect(r.getByTestId("ch03-inspector-computed").textContent).toBe(sampleReply().id);
    expect(r.getByTestId("ch03-inspector-detail").dataset["field"]).toBe("kind");
    expect(r.getByTestId("ch03-inspector-kind-category")).toBeTruthy();
    await fireEvent.click(r.getByTestId("ch03-inspector-tampered"));
    expect(r.getByTestId("ch03-inspector-verdict").dataset["code"]).toBe("id-mismatch");
    expect(bus.seen).toEqual(["signature:valid", "signature:invalid"]);
    await fireEvent.click(r.getByTestId("ch03-inspector-clear"));
    expect(r.getByTestId("ch03-inspector-empty")).toBeTruthy();
    bus.off();
  });

  test("pasted input: shape errors, bad signature, keyboard shortcut", async () => {
    const r = inspector();
    const input = r.getByTestId("ch03-inspector-input") as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: "{ nope" } });
    await fireEvent.click(r.getByTestId("ch03-inspector-inspect"));
    expect(r.getByTestId("ch03-inspector-error").dataset["code"]).toBe("invalid-json");
    await fireEvent.input(input, {
      target: { value: prettyEvent({ ...note, sig: flipHexChar(note.sig) }) },
    });
    await fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
    expect(r.getByTestId("ch03-inspector-verdict").dataset["code"]).toBe("bad-signature");
    expect(r.getByTestId("ch03-inspector-exploded-field-sig").dataset["flagged"]).toBe("true");
    await fireEvent.keyDown(input, { key: "Enter" });
    await fireEvent.input(input, { target: { value: "   " } });
    await fireEvent.click(r.getByTestId("ch03-inspector-inspect"));
    expect(r.getByTestId("ch03-inspector-empty")).toBeTruthy();
  });
});
