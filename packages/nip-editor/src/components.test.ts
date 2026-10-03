import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { EditorView } from "@codemirror/view";
import { getPersona } from "@nostrschool/fixtures";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import {
  ExplainPanel,
  JsonCodeEditor,
  NipEditor,
  ProcessExplainer,
  ValidityBadge,
} from "./index.ts";
import { decodeEditorHash, encodeEditorHash, formatJson } from "./state.ts";
import {
  ALICE,
  BOB,
  documentSpec,
  encodingSpec,
  eventSpec,
  httpSpec,
  messageSpec,
  NOTE_ID,
  processSpec,
} from "./test/samples.ts";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** The CodeMirror view inside a JsonCodeEditor (real editor, real DOM). */
const cmView = (root: HTMLElement): EditorView => {
  const dom = root.querySelector(".cm-editor");
  const view = dom instanceof HTMLElement ? EditorView.findFromDOM(dom) : null;
  if (view === null) throw new Error("no CodeMirror view");
  return view;
};
/** Types into CodeMirror the way a user edit arrives: a user transaction replacing the doc. */
const typeJson = async (root: HTMLElement, text: string) => {
  const v = cmView(root);
  v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text }, userEvent: "input" });
  await tick();
};
const input = async (el: HTMLElement, value: string) => {
  (el as HTMLInputElement).value = value;
  await fireEvent.input(el);
};
const parsed = (root: HTMLElement): unknown => JSON.parse(cmView(root).state.doc.toString());

beforeEach(() => {
  history.replaceState(null, "", "/");
});
afterEach(() => cleanup());

const renderEditor = (props: Record<string, unknown>) =>
  render(NipEditor, {
    props: { testid: "ed", locale: "en", syncHash: false, layout: "split", ...props } as never,
  });

describe("NipEditor — events", () => {
  test("renders parts, examples, flows, validity and the JSON of the first example", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    expect(getByTestId("ed").dataset["part"]).toBe("event-reaction");
    expect(getByTestId("ed-part-event-reaction").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ed-example-like").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ed-flows").textContent).toContain("reaction.label");
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ kind: 7, content: "+" });
    expect(getByTestId("ed-validity").dataset["state"]).toBe("valid");
    expect(getByTestId("ed-sig-state").dataset["state"]).toBe("unsigned");
  });

  test("form → JSON and JSON → form stay in sync", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    await input(getByTestId("ed-form-content-text-input"), "🤙");
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ content: "🤙" });

    const json = getByTestId("ed-json");
    const next = { ...(parsed(json) as object), content: "-", kind: 7 };
    await typeJson(json, formatJson(next));
    expect((getByTestId("ed-form-content-text-input") as HTMLInputElement).value).toBe("-");
    await input(getByTestId("ed-form-kind-input"), "1");
    expect(parsed(json)).toMatchObject({ kind: 1 });
    expect(getByTestId("ed-validity").dataset["state"]).toBe("invalid");
    expect(getByTestId("ed-json").dataset["diagnostics"]).not.toBe("0");
  });

  test("invalid JSON pauses the form and is reported, then recovers", async () => {
    const { getByTestId, getByRole } = renderEditor({ spec: eventSpec });
    await tick();
    const json = getByTestId("ed-json");
    await typeJson(json, '{"kind": 7,');
    expect(getByTestId("ed-validity").dataset["state"]).toBe("invalid");
    expect(getByRole("alert").textContent).toContain("does not parse");
    expect(
      (getByTestId("ed-pane-form").querySelector("fieldset") as HTMLFieldSetElement).disabled,
    ).toBe(true);
    expect((getByTestId("ed-sign") as HTMLButtonElement).disabled).toBe(true);
    await typeJson(
      json,
      formatJson({
        kind: 7,
        tags: [["e", NOTE_ID]],
        content: "+",
        created_at: 1,
        pubkey: ALICE.pubkey,
      }),
    );
    expect(
      (getByTestId("ed-pane-form").querySelector("fieldset") as HTMLFieldSetElement).disabled,
    ).toBe(false);
  });

  test("sign with a demo key; edits make the signature stale; a new signer resets it", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    await fireEvent.click(getByTestId("ed-sign"));
    const signed = parsed(getByTestId("ed-json")) as { id: string; sig: string; pubkey: string };
    expect(signed.sig).toHaveLength(128);
    expect(signed.pubkey).toBe(ALICE.pubkey);
    expect(getByTestId("ed-sig-state").dataset["state"]).toBe("signed");
    expect(getByTestId("ed-sig-state").textContent).toContain("Alice");
    expect(getByTestId("ed-validity").dataset["state"]).toBe("valid");
    expect(getByTestId("ed-sign").textContent).toContain("Sign again");

    await input(getByTestId("ed-form-content-text-input"), "-");
    expect(getByTestId("ed-sig-state").dataset["state"]).toBe("stale");
    expect(getByTestId("ed-validity").dataset["state"]).toBe("invalid");

    const select = getByTestId("ed-signer") as HTMLSelectElement;
    select.value = "bob";
    await fireEvent.change(select);
    const swapped = parsed(getByTestId("ed-json")) as Record<string, unknown>;
    expect(swapped["pubkey"]).toBe(BOB.pubkey);
    expect(swapped["sig"]).toBeUndefined();
    await fireEvent.click(getByTestId("ed-sign"));
    expect(getByTestId("ed-sig-state").textContent).toContain("Bob");
  });

  test("tags: add from template, add values, reorder, remove, custom tags", async () => {
    const { getByTestId, queryByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    const json = getByTestId("ed-json");
    // `e` is not repeatable and already present.
    expect((getByTestId("ed-form-add-e") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("ed-form-add-k-root"));
    expect((parsed(json) as { tags: string[][] }).tags[2]).toEqual(["k", "1", "root"]);
    expect(getByTestId("ed-form-tag-2").dataset["tag"]).toBe("k-root");
    await fireEvent.click(getByTestId("ed-form-tag-2-up"));
    expect((parsed(json) as { tags: string[][] }).tags[1]?.[0]).toBe("k");
    await fireEvent.click(getByTestId("ed-form-tag-1-down"));
    expect((parsed(json) as { tags: string[][] }).tags[2]?.[0]).toBe("k");
    await fireEvent.click(getByTestId("ed-form-tag-2-remove"));
    expect((parsed(json) as { tags: string[][] }).tags).toHaveLength(2);
    // The e tag has an optional relay position.
    await fireEvent.click(getByTestId("ed-form-tag-0-add-value"));
    await input(getByTestId("ed-form-tag-0-value-2-input"), "wss://relay.beta.example");
    expect((parsed(json) as { tags: string[][] }).tags[0]).toEqual([
      "e",
      NOTE_ID,
      "wss://relay.beta.example",
    ]);
    expect(queryByTestId("ed-form-tag-0-add-value")).toBeNull();
    await fireEvent.click(getByTestId("ed-form-tag-0-remove-value"));
    expect((parsed(json) as { tags: string[][] }).tags[0]).toHaveLength(2);
    // Persona picker fills the p tag.
    const persona = getByTestId("ed-form-tag-1-value-1-persona") as HTMLSelectElement;
    persona.value = getPersona("dave").pubkey;
    await fireEvent.change(persona);
    expect((parsed(json) as { tags: string[][] }).tags[1]?.[1]).toBe(getPersona("dave").pubkey);
    // Custom tag.
    await input(getByTestId("ed-form-custom-tag"), "t");
    await fireEvent.click(getByTestId("ed-form-add-tag"));
    expect((parsed(json) as { tags: string[][] }).tags[2]).toEqual(["t", ""]);
    expect(getByTestId("ed-form-tag-2").dataset["tag"]).toBe("unknown");
    await fireEvent.click(getByTestId("ed-form-tag-2-add-value"));
    expect((parsed(json) as { tags: string[][] }).tags[2]).toEqual(["t", "", ""]);
    await fireEvent.click(getByTestId("ed-form-created-at-now"));
    expect(getByTestId("ed-form-created-at-date").textContent).toContain("2025");
  });

  test("examples, reset, parts and flows load new values", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    const json = getByTestId("ed-json");
    await fireEvent.click(getByTestId("ed-example-dislike"));
    expect(parsed(json)).toMatchObject({ content: "-", pubkey: getPersona("carol").pubkey });
    expect((getByTestId("ed-signer") as HTMLSelectElement).value).toBe("carol");
    await input(getByTestId("ed-form-content-text-input"), "x");
    await fireEvent.click(getByTestId("ed-reset"));
    expect(parsed(json)).toMatchObject({ content: "-" });
    await fireEvent.click(getByTestId("ed-part-event-dm"));
    expect(getByTestId("ed").dataset["part"]).toBe("event-dm");
    expect(parsed(json)).toMatchObject({ kind: 4 });
    const flowButtons = getByTestId("ed-flows").querySelectorAll("button");
    await fireEvent.click(flowButtons[0] as HTMLElement);
    expect(getByTestId("ed").dataset["part"]).toBe("event-reaction");
  });

  test("encrypted content: encrypt for the p-tag recipient, then decrypt back", async () => {
    const { getByTestId, getByRole } = renderEditor({
      spec: eventSpec,
      part: { kind: "event", id: "dm" },
    });
    await tick();
    const json = getByTestId("ed-json");
    expect(getByTestId("ed-form-content").dataset["format"]).toBe("encrypted");
    await input(getByTestId("ed-form-plaintext-input"), "meet at noon");
    await fireEvent.click(getByTestId("ed-form-encrypt"));
    const content = (parsed(json) as { content: string }).content;
    expect(content.length).toBeGreaterThan(40);
    await input(getByTestId("ed-form-plaintext-input"), "");
    await fireEvent.click(getByTestId("ed-form-decrypt"));
    expect((getByTestId("ed-form-plaintext-input") as HTMLTextAreaElement).value).toBe(
      "meet at noon",
    );
    const recipient = getByTestId("ed-form-recipient") as HTMLSelectElement;
    recipient.value = getPersona("erin").pubkey;
    await fireEvent.change(recipient);
    await fireEvent.click(getByTestId("ed-form-decrypt"));
    expect(getByRole("alert").textContent).toContain("Could not");
  });

  test("selecting a field explains it; the walkthrough focuses parts and paths", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    expect(getByTestId("ed-explain-body").textContent).toContain("Select any field");
    await fireEvent.focusIn(getByTestId("ed-form-tag-0-value-1-input"));
    expect(getByTestId("ed-explain-title").textContent).toContain("event-id");
    expect(getByTestId("ed-explain-type").textContent).toContain("Event id");
    await fireEvent.focusIn(getByTestId("ed-form-kind-input"));
    expect(getByTestId("ed-explain-body").textContent).toContain("event type");
    // CodeMirror: moving the caret reports the JSON path under it.
    const view = cmView(getByTestId("ed-json"));
    view.focus();
    const at = view.state.doc.toString().indexOf('"content"') + 2;
    view.dispatch({ selection: { anchor: at } });
    await tick();
    expect(getByTestId("ed-explain-title").textContent).toContain("content");

    await fireEvent.click(getByTestId("ed-how-next"));
    expect(getByTestId("ed-explain-title").textContent).toContain("tags");
    await fireEvent.click(getByTestId("ed-how-show"));
    await fireEvent.click(getByTestId("ed-how-step-dm"));
    expect(getByTestId("ed").dataset["part"]).toBe("event-dm");
    expect((getByTestId("ed-how-next") as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(getByTestId("ed-how-prev"));
    expect(getByTestId("ed-how-step-tag").getAttribute("aria-current")).toBe("step");
  });

  test("requireOneOf rules: the tag list, a related tag and the diagnostic explain the rule", async () => {
    const { getByTestId, queryByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    // A tag the rule names shows the rule text and which tags satisfy it.
    await fireEvent.focusIn(getByTestId("ed-form-tag-0"));
    expect(getByTestId("ed-explain-rule-0").textContent).toContain("rule.target");
    expect(getByTestId("ed-explain-rule-0").dataset["met"]).toBe("true");
    expect(getByTestId("ed-explain-rules").textContent).toContain("Met by e.");
    await fireEvent.focusIn(getByTestId("ed-form-tag-1"));
    expect(queryByTestId("ed-explain-rules")).toBeNull();
    // Break the rule: remove the e tag. The selection moves to the tag list, which shows it.
    await fireEvent.click(getByTestId("ed-form-tag-0-remove"));
    expect(getByTestId("ed-explain-title").textContent?.trim()).toBe("tags");
    expect(getByTestId("ed-explain-rule-0").dataset["met"]).toBe("false");
    expect(getByTestId("ed-explain-rule-0").textContent).toContain("Not met yet");
    expect(getByTestId("ed-explain-issues").textContent).toContain("e, k");
    // From the root, the diagnostic is a jump button that lands on the rule.
    const view = cmView(getByTestId("ed-json"));
    view.focus();
    view.dispatch({ selection: { anchor: 0 } });
    await tick();
    expect(queryByTestId("ed-explain-rules")).toBeNull();
    const jump = [...getByTestId("ed-explain-issues").querySelectorAll("button")].find((b) =>
      b.textContent?.includes("e, k"),
    );
    if (jump === undefined) throw new Error("no jump button for the rule");
    await fireEvent.click(jump);
    await tick();
    expect(getByTestId("ed-explain-rule-0").textContent).toContain("rule.target");
    // The JSON diagnostic's own node (the tags array) explains it too.
    await fireEvent.focusIn(getByTestId("ed-form-kind-input"));
    view.focus();
    const at = view.state.doc.toString().indexOf('"tags"') + 2;
    view.dispatch({ selection: { anchor: at } });
    await tick();
    expect(getByTestId("ed-explain-rule-0").dataset["met"]).toBe("false");
    // Focusing the tag adders explains the list (with its rule) as well.
    await fireEvent.focusIn(getByTestId("ed-form-kind-input"));
    await fireEvent.focusIn(getByTestId("ed-form-add-k-root"));
    expect(getByTestId("ed-explain-rules")).toBeTruthy();
  });

  test("deleting or moving tag rows never leaves the explanation on a stale row", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    const json = getByTestId("ed-json");
    const title = () => getByTestId("ed-explain-title").textContent?.trim() ?? "";
    // Move: the selection and focus follow the moved row.
    await fireEvent.focusIn(getByTestId("ed-form-tag-1"));
    expect(title()).toContain("p");
    await fireEvent.click(getByTestId("ed-form-tag-1-up"));
    await tick();
    expect((parsed(json) as { tags: string[][] }).tags[0]?.[0]).toBe("p");
    expect(title()).toContain("p");
    expect(title()).not.toContain("?");
    // At the top, "up" is disabled, so focus lands on the row's "down" button.
    const focused = () => document.activeElement?.getAttribute("data-testid");
    expect(focused()).toBe("ed-form-tag-0-down");
    await fireEvent.click(getByTestId("ed-form-tag-0-down"));
    await tick();
    // The last row has no "down", so focus lands on its "up".
    expect(focused()).toBe("ed-form-tag-1-up");
    // Remove the last row: the panel moves to the tag list instead of "tags › ?".
    await fireEvent.click(getByTestId("ed-form-tag-1-remove"));
    expect(title()).toBe("tags");
    // Deleting rows in the JSON cuts the selection back to what still exists.
    await fireEvent.focusIn(getByTestId("ed-form-tag-0-value-1-input"));
    expect(title()).toContain("event-id");
    await typeJson(json, formatJson({ ...(parsed(json) as object), tags: [] }));
    expect(title()).toBe("tags");
    expect(title()).not.toContain("?");
  });

  test("copy JSON and share link report through the notice", async () => {
    // The real happy-dom clipboard for the success path.
    const { getByTestId } = renderEditor({ spec: eventSpec });
    await tick();
    await fireEvent.click(getByTestId("ed-copy"));
    await tick();
    expect(getByTestId("ed-notice").textContent).toBe("Copied");
    expect(JSON.parse(await navigator.clipboard.readText())).toMatchObject({ kind: 7 });
    await fireEvent.click(getByTestId("ed-share"));
    await tick();
    const hash = new URL(await navigator.clipboard.readText()).hash;
    expect(decodeEditorHash(hash, eventSpec).ok).toBe(true);
    // A clipboard that refuses (as a browser does without permission). Shadowing the prototype
    // getter with an own property, then deleting it, leaves the shared window as it was.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => Promise.reject(new Error("denied")) },
    });
    try {
      await fireEvent.click(getByTestId("ed-copy"));
      await tick();
      expect(getByTestId("ed-notice").textContent).toContain("Could not copy");
    } finally {
      Reflect.deleteProperty(navigator, "clipboard");
    }
  });
});

describe("NipEditor — content formats", () => {
  const profile = {
    nip: "T7",
    variant: "event",
    howItWorks: [],
    related: [],
    events: [
      {
        id: "profile",
        label: "p",
        explain: "p",
        kinds: [0],
        content: {
          format: "json",
          explain: "c",
          schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
        },
        tags: [],
        examples: [
          { id: "a", label: "a", template: { kind: 0, tags: [], content: '{"name":"alice"}' } },
        ],
      },
      {
        id: "deletion",
        label: "d",
        explain: "d",
        kinds: [5],
        content: { format: "empty" },
        tags: [],
        examples: [{ id: "x", label: "x", template: { kind: 5, tags: [], content: "oops" } }],
      },
    ],
  } as const;
  test("JSON content is edited as fields and stored as a JSON string", async () => {
    const { getByTestId } = renderEditor({ spec: profile });
    await tick();
    await input(getByTestId("ed-form-content-field-name-value-input"), "Alice!");
    expect(JSON.parse((parsed(getByTestId("ed-json")) as { content: string }).content)).toEqual({
      name: "Alice!",
    });
    await typeJson(
      getByTestId("ed-json"),
      formatJson({ kind: 0, tags: [], content: "not json", created_at: 1, pubkey: ALICE.pubkey }),
    );
    await input(getByTestId("ed-form-content-text-input"), '{"name":"b"}');
    expect(getByTestId("ed-form-content-field-name-value-input")).toBeTruthy();
  });
  test("empty content explains itself and still lets you clear stray text", async () => {
    const { getByTestId } = renderEditor({
      spec: profile,
      part: { kind: "event", id: "deletion" },
    });
    await tick();
    expect(getByTestId("ed-form-content").textContent).toContain("no content");
    await input(getByTestId("ed-form-content-text-input"), "");
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ content: "" });
  });
  test("message elements beyond the spec are still editable as JSON", async () => {
    const { getByTestId } = renderEditor({ spec: messageSpec });
    await tick();
    await typeJson(
      getByTestId("ed-json"),
      JSON.stringify(["REQ", "s", { kinds: [1] }, { kinds: [2] }]),
    );
    expect(getByTestId("ed-form-element-3")).toBeTruthy();
  });
});

describe("NipEditor — URL hash and layout", () => {
  test("restores state from #edit=… and keeps the hash current", async () => {
    const state = {
      part: { kind: "event", id: "reaction" },
      value: { kind: 7, created_at: 1, pubkey: BOB.pubkey, tags: [["e", NOTE_ID]], content: "🔥" },
      example: "like",
      signer: "bob",
    } as const;
    history.replaceState(null, "", `/nips/T1/${encodeEditorHash(state)}`);
    const { getByTestId } = renderEditor({ spec: eventSpec, syncHash: true });
    await tick();
    expect(getByTestId("ed-notice").textContent).toContain("Restored");
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ content: "🔥" });
    expect((getByTestId("ed-signer") as HTMLSelectElement).value).toBe("bob");
    await input(getByTestId("ed-form-content-text-input"), "🌊");
    await tick(300);
    const back = decodeEditorHash(location.hash, eventSpec);
    expect(back.ok && back.value.value).toMatchObject({ content: "🌊" });
  });
  test("an untouched editor leaves the URL alone", async () => {
    renderEditor({ spec: eventSpec, syncHash: true });
    await tick(300);
    expect(location.hash).toBe("");
  });
  test("a broken hash falls back to the first example with a notice", async () => {
    history.replaceState(null, "", "/#edit=@@");
    const { getByTestId } = renderEditor({ spec: eventSpec, syncHash: true });
    await tick();
    expect(getByTestId("ed-notice").textContent).toContain("could not be read");
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ content: "+" });
  });
  test("onchange reports the editor state", async () => {
    const seen: unknown[] = [];
    const { getByTestId } = renderEditor({
      spec: eventSpec,
      onchange: (s: unknown) => seen.push(s),
    });
    await tick();
    await input(getByTestId("ed-form-content-text-input"), "x");
    await tick();
    expect(seen.at(-1)).toMatchObject({
      part: { kind: "event", id: "reaction" },
      value: { content: "x" },
      signer: "alice",
    });
  });
  test("tabs layout: Form | JSON | Explain with arrow keys, and the explain peek", async () => {
    const { getByTestId } = renderEditor({ spec: eventSpec, layout: "tabs" });
    await tick();
    expect(getByTestId("ed").dataset["mode"]).toBe("tabs");
    expect(getByTestId("ed-pane-json").hidden).toBe(true);
    await fireEvent.keyDown(getByTestId("ed-tab-form"), { key: "ArrowRight" });
    expect(getByTestId("ed-tab-json").getAttribute("aria-selected")).toBe("true");
    expect(getByTestId("ed-pane-json").hidden).toBe(false);
    await fireEvent.keyDown(getByTestId("ed-tab-json"), { key: "x" });
    await fireEvent.click(getByTestId("ed-tab-form"));
    await fireEvent.focusIn(getByTestId("ed-form-kind-input"));
    await fireEvent.click(getByTestId("ed-peek"));
    expect(getByTestId("ed-tab-explain").getAttribute("aria-selected")).toBe("true");
    expect(getByTestId("ed-pane-explain").hidden).toBe(false);
  });
  test("auto layout follows the md media query", async () => {
    const { getByTestId } = render(NipEditor, {
      props: { testid: "ed", locale: "en", spec: eventSpec, syncHash: false },
    });
    await tick();
    expect(["tabs", "split"]).toContain(getByTestId("ed").dataset["mode"] ?? "");
  });
});

describe("NipEditor — other variants", () => {
  test("message: positional elements, repeatable filters", async () => {
    const { getByTestId, queryByTestId } = renderEditor({ spec: messageSpec });
    await tick();
    const json = getByTestId("ed-json");
    expect(getByTestId("ed-form-type").textContent).toBe("REQ");
    await input(getByTestId("ed-form-element-1-field-1-value-input"), "sub2");
    expect(parsed(json)).toEqual(["REQ", "sub2", { kinds: [1], limit: 5 }]);
    await fireEvent.click(getByTestId("ed-form-add-element"));
    expect((parsed(json) as unknown[]).length).toBe(4);
    await fireEvent.click(getByTestId("ed-form-element-3-field-3-remove"));
    expect((parsed(json) as unknown[]).length).toBe(3);
    // Open-ended nodes (filters) are edited as JSON; a bad draft is kept, not applied.
    const box = getByTestId("ed-form-element-2-field-2-json");
    await input(box, '{"kinds": [0]}');
    expect(parsed(json)).toEqual(["REQ", "sub2", { kinds: [0] }]);
    await input(box, "{oops");
    expect(getByTestId("ed-form-element-2-field-2").textContent).toContain("Not valid JSON");
    expect(parsed(json)).toEqual(["REQ", "sub2", { kinds: [0] }]);
    expect(queryByTestId("ed-sign")).toBeNull();
  });

  test("document: schema form with add/remove fields, booleans, numbers, tuples", async () => {
    const { getByTestId } = renderEditor({ spec: documentSpec });
    await tick();
    const json = getByTestId("ed-json");
    expect(getByTestId("ed-form-url").textContent).toContain(".well-known/nostr.json");
    await input(getByTestId("ed-form-field-names-new-key"), "carol");
    await fireEvent.click(getByTestId("ed-form-field-names-add-field"));
    // New keys start with a valid example value of their type (a demo pubkey here).
    expect((parsed(json) as { names: Record<string, string> }).names["carol"]).toBe(BOB.pubkey);
    await fireEvent.click(getByTestId("ed-form-field-root-add-admin"));
    const check = getByTestId("ed-form-field-admin-value-input") as HTMLInputElement;
    check.checked = true;
    await fireEvent.change(check);
    expect(parsed(json)).toMatchObject({ admin: true });
    await fireEvent.click(getByTestId("ed-form-field-root-add-version"));
    await input(getByTestId("ed-form-field-version-value-input"), "2");
    expect(parsed(json)).toMatchObject({ version: 2 });
    await input(getByTestId("ed-form-field-version-value-input"), "two");
    expect(parsed(json)).toMatchObject({ version: "two" });
    await fireEvent.click(getByTestId("ed-form-field-root-add-tags"));
    expect(parsed(json)).toMatchObject({ tags: [""] });
    await fireEvent.click(getByTestId("ed-form-field-tags-add-item"));
    expect(parsed(json)).toMatchObject({ tags: ["", 0] });
    await fireEvent.click(getByTestId("ed-form-field-tags.1-remove"));
    expect(parsed(json)).toMatchObject({ tags: [""] });
    await fireEvent.click(getByTestId("ed-form-field-root-add-relays"));
    await input(getByTestId("ed-form-field-relays-new-key"), BOB.pubkey);
    await fireEvent.click(getByTestId("ed-form-field-relays-add-field"));
    await fireEvent.click(getByTestId(`ed-form-field-relays.${BOB.pubkey}-add-item`));
    expect((parsed(json) as { relays: Record<string, string[]> }).relays[BOB.pubkey]).toEqual([
      "wss://relay.alpha.example",
    ]);
    await fireEvent.click(getByTestId("ed-form-field-root-add-note"));
    expect(parsed(json)).toMatchObject({ note: null });
    await fireEvent.click(getByTestId("ed-form-field-admin-remove"));
    expect(parsed(json)).not.toHaveProperty("admin");
  });

  test("http: headers, body and a live signed auth header", async () => {
    const { getByTestId } = renderEditor({ spec: httpSpec });
    await tick();
    const json = getByTestId("ed-json");
    expect(getByTestId("ed-form-method").textContent).toBe("POST");
    await input(getByTestId("ed-form-url-input"), "https://files.example/v2");
    await fireEvent.click(getByTestId("ed-form-auth-build"));
    const req = parsed(json) as { headers: { Authorization: string } };
    expect(req.headers.Authorization).toStartWith("Nostr ");
    expect(getByTestId("ed-form-auth-event").textContent).toContain("https://files.example/v2");
    await input(getByTestId("ed-form-body-field-body.caption-value-input"), "a cat");
    expect(parsed(json)).toMatchObject({ body: { caption: "a cat" } });
    // Signer select is offered because the request carries an auth event.
    expect(getByTestId("ed-signer")).toBeTruthy();
    await typeJson(json, formatJson({ headers: { "X-Extra": "1" } }));
    expect(getByTestId("ed-form-header-X-Extra")).toBeTruthy();
    await fireEvent.click(getByTestId("ed-form-auth-build"));
    expect(getByTestId("ed-form-auth").textContent).toContain("Could not sign");
  });

  test("encoding: live output, breakdown, TLV, decode a pasted string, demo-only secrets", async () => {
    const { getByTestId, queryByTestId } = renderEditor({ spec: encodingSpec });
    await tick();
    const out = getByTestId("ed-form-output") as HTMLTextAreaElement;
    expect(out.value).toStartWith("nprofile1");
    expect(getByTestId("ed-form-tlv").textContent).toContain("wss://relay.alpha.example");
    await fireEvent.click(getByTestId("ed-form-input-relays-add"));
    await input(getByTestId("ed-form-input-relays-1-input"), "wss://relay.beta.example");
    expect(getByTestId("ed-form-tlv").querySelectorAll("li")).toHaveLength(3);
    await fireEvent.click(getByTestId("ed-form-input-relays-1-remove"));
    // Paste an nprofile for Carol and decode it into the inputs.
    const carol = getPersona("carol");
    const { encodeNprofile } = await import("@nostrschool/protocol");
    const pasted = encodeNprofile({ pubkey: carol.pubkey });
    if (!pasted.ok) throw new Error("encode");
    await input(out, pasted.value);
    await fireEvent.click(getByTestId("ed-form-decode"));
    expect(parsed(getByTestId("ed-json"))).toEqual({ pubkey: carol.pubkey });
    await input(out, "nprofile1garbage");
    await fireEvent.click(getByTestId("ed-form-decode"));
    expect(getByTestId("ed-form-decode-error").textContent).toContain("does not encode");
    await input(getByTestId("ed-form-input-pubkey-field-input"), "");
    expect(getByTestId("ed-form-error").textContent).toContain("Fill in");

    await fireEvent.click(getByTestId("ed-part-encoding-ncryptsec"));
    const persona = getByTestId("ed-form-input-secret-key-persona") as HTMLSelectElement;
    expect(persona.value).toBe("alice");
    persona.value = "bob";
    await fireEvent.change(persona);
    expect(parsed(getByTestId("ed-json"))).toMatchObject({ "secret-key": BOB.secretKeyHex });
    // scrypt runs on request only.
    expect((getByTestId("ed-form-output") as HTMLTextAreaElement).value).toBe("");
    await fireEvent.click(getByTestId("ed-form-run"));
    expect((getByTestId("ed-form-output") as HTMLTextAreaElement).value).toStartWith("ncryptsec1");
    await input(getByTestId("ed-form-input-log_n-field-input"), "20");
    expect((getByTestId("ed-form-output") as HTMLTextAreaElement).value).toBe("");
    await fireEvent.click(getByTestId("ed-form-run"));
    expect(getByTestId("ed-form-error").textContent).toContain("1024 MiB");

    await fireEvent.click(getByTestId("ed-part-encoding-mnemonic"));
    expect(getByTestId("ed-form-derived").textContent).toContain("m/44'/1237'/0'/0/0");
    await fireEvent.click(getByTestId("ed-part-encoding-payload"));
    expect(getByTestId("ed-form-breakdown").textContent).toContain("Nonce");
    expect(queryByTestId("ed-sign")).toBeNull();
  });

  test("process: sequence diagram and step list", async () => {
    const { getByTestId, queryByTestId } = renderEditor({ spec: processSpec });
    await tick();
    expect(queryByTestId("ed-json")).toBeNull();
    expect(getByTestId("ed-how-process-diagram")).toBeTruthy();
    const step = getByTestId("ed-how-process-step-store");
    await fireEvent.click(step.querySelector("button") as HTMLElement);
    expect(step.getAttribute("aria-current")).toBe("step");
    expect(step.textContent).toContain("p.store.x");
  });
});

describe("standalone parts", () => {
  test("ValidityBadge: checking, valid with notes, invalid with count", () => {
    const a = render(ValidityBadge, { props: { testid: "v", locale: "en", report: undefined } });
    expect(a.getByTestId("v").dataset["state"]).toBe("checking");
    cleanup();
    const b = render(ValidityBadge, {
      props: {
        testid: "v",
        locale: "en",
        report: { valid: true, issues: [{ severity: "info", code: "unsigned", path: [] }] },
      },
    });
    expect(b.getByTestId("v-count").textContent).toBe("1 note");
    cleanup();
    const c = render(ValidityBadge, {
      props: {
        testid: "v",
        locale: "es",
        report: {
          valid: false,
          issues: [
            { severity: "error", code: "missing-tag", path: [] },
            { severity: "warning", code: "unknown-tag", path: [] },
          ],
        },
      },
    });
    expect(c.getByTestId("v-count").textContent).toBe("2 problemas");
  });
  test("ExplainPanel: enum options, tag facts and issues", () => {
    const { getByTestId } = render(ExplainPanel, {
      props: {
        testid: "x",
        locale: "en",
        nip: "01",
        target: {
          path: ["tags", 0],
          breadcrumb: ["tags", "e"],
          field: { type: "enum", values: [{ value: "+" }] },
          tag: { name: "e", explain: "", presence: "required", repeatable: true, fields: [] },
          issues: [
            { severity: "warning", code: "unknown-tag", path: ["tags", 0], params: { tag: "e" } },
            { severity: "info", code: "unsigned", path: [] },
          ],
        },
      },
    });
    expect(getByTestId("x-type").textContent).toContain("Required");
    expect(getByTestId("x-body").textContent).toContain("+");
    expect(getByTestId("x-issues").querySelectorAll("li")).toHaveLength(2);
    cleanup();
    const s = render(ExplainPanel, {
      props: {
        testid: "x",
        locale: "en",
        nip: "01",
        target: { path: [], breadcrumb: [], schemaType: "object", issues: [] },
      },
    });
    expect(s.getByTestId("x-type").textContent).toContain("Object");
    expect(s.getByTestId("x-body").textContent).toContain("does not describe");
  });
  test("ExplainPanel: requireOneOf rules show their text, tags and state", () => {
    const { getByTestId } = render(ExplainPanel, {
      props: {
        testid: "x",
        locale: "es",
        nip: "09",
        target: {
          path: ["tags"],
          breadcrumb: ["tags"],
          builtin: "tags",
          issues: [],
          rules: [
            { explain: "rule.target", tags: ["e", "a"], present: ["a"] },
            { explain: "rule.target", tags: ["e", "a"], present: [] },
          ],
        },
      },
    });
    const met = getByTestId("x-rule-0");
    expect(met.dataset["met"]).toBe("true");
    expect(met.textContent).not.toContain("rule.target");
    expect(met.textContent).toContain("Cumplida por a.");
    expect(met.querySelector("code.present")?.textContent).toBe("a");
    expect(getByTestId("x-rule-1").textContent).toContain("Aún no se cumple");
    expect(getByTestId("x-rules").textContent).toContain("Reglas de etiquetas");
  });
  test("JsonCodeEditor: readonly view with highlight marks and hover paths", async () => {
    const paths: unknown[] = [];
    const value = formatJson({ a: [1, 2] });
    const { getByTestId } = render(JsonCodeEditor, {
      props: {
        testid: "j",
        locale: "en",
        value,
        diagnostics: [{ from: 0, to: 999, severity: "error", message: "x" }],
        highlight: [["a", 1], ["missing"]],
        readonly: true,
        label: "JSON",
        onselectpath: (p: unknown) => paths.push(p),
      },
    });
    await tick();
    const view = cmView(getByTestId("j"));
    expect(view.state.readOnly).toBe(true);
    expect(getByTestId("j-content").getAttribute("aria-label")).toBe("JSON");
    // Keyboard users can reach (and so scroll) the JSON region.
    expect(getByTestId("j-content").getAttribute("tabindex")).toBe("0");
    expect(getByTestId("j").querySelector(".cm-nip-highlight")?.textContent).toBe("2");
    await fireEvent.mouseMove(getByTestId("j-content"), { clientX: 1, clientY: 1 });
    expect(Array.isArray(paths)).toBe(true);
  });
  test("ProcessExplainer opens linked parts", async () => {
    const opened: unknown[] = [];
    const process = {
      actors: [{ id: "a", label: "A", kind: "client" as const }],
      steps: [
        {
          id: "s",
          from: "a",
          label: "S",
          explain: "E",
          packet: "REQ",
          payload: ["REQ"],
          part: { kind: "event" as const, id: "x" },
        },
      ],
    };
    const { getByTestId } = render(ProcessExplainer, {
      props: {
        testid: "p",
        locale: "en",
        nip: "01",
        process,
        step: 0,
        onopenpart: (p: unknown) => opened.push(p),
      },
    });
    await fireEvent.click(getByTestId("p-step-s-open"));
    expect(opened).toEqual([{ kind: "event", id: "x" }]);
  });
});
