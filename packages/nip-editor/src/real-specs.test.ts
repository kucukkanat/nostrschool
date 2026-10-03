/**
 * Integration with the real NIP specs: every finished spec must open in the editor, every
 * example must show as valid (no errors) and every encoding example must encode. This is where
 * the editor's input-name conventions meet what spec authors actually wrote.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { specParts } from "@nostrschool/nips";
import { NIP_SPECS } from "@nostrschool/nips/specs";
import { cleanup, render } from "@testing-library/svelte";
import NipEditor from "./components/NipEditor.svelte";
import { type EncodingInputs, encodeInputs } from "./logic/encoding.ts";
import { checkValue } from "./logic/validate.ts";
import { initialValue } from "./state.ts";

const finished = Object.values(NIP_SPECS).filter((s) => s.todo !== true);

afterEach(() => cleanup());

describe("real specs", () => {
  test("there are finished specs to check", () => {
    expect(finished.length).toBeGreaterThan(0);
  });
  test.each(finished.map((s) => [s.nip, s] as const))(
    "NIP-%s: examples are valid and encode",
    (_nip, spec) => {
      for (const part of specParts(spec)) {
        const ids =
          part.part.examples.length > 0 ? part.part.examples.map((e) => e.id) : [undefined];
        for (const id of ids) {
          const value = initialValue(part, id);
          const errors = checkValue(spec, part, value).issues.filter((i) => i.severity === "error");
          expect({ part: part.part.id, example: id, errors }).toEqual({
            part: part.part.id,
            example: id,
            errors: [],
          });
          if (part.kind === "encoding") {
            const out = encodeInputs(part.part, value as EncodingInputs);
            // Deliberately heavy scrypt settings are explained, not run (see MAX_DEMO_LOGN).
            const ok = out.ok || out.error.code === "too-costly";
            expect({ example: id, ok, error: out.ok ? undefined : out.error.message }).toEqual({
              example: id,
              ok: true,
              error: out.ok ? undefined : out.error.message,
            });
          }
        }
      }
    },
    // NIP-49 examples run real scrypt (log_n 16): slow under coverage instrumentation.
    30_000,
  );
  test.each(finished.map((s) => [s.nip, s] as const))(
    "NIP-%s: the editor renders",
    (_nip, spec) => {
      const { getByTestId } = render(NipEditor, {
        props: { testid: "ed", locale: "es", spec, syncHash: false, layout: "split" },
      });
      expect(getByTestId("ed")).toBeTruthy();
      if (specParts(spec).length > 0)
        expect(getByTestId("ed-validity").dataset["state"]).toBe("valid");
    },
  );
});

describe("relay-url literals", () => {
  test("NIP-62's relay field offers ALL_RELAYS and accepts it as text", () => {
    const spec = NIP_SPECS["62"];
    if (spec === undefined) throw new Error("NIP-62 spec missing");
    const { container } = render(NipEditor, {
      props: { testid: "ed", locale: "en", spec, syncHash: false, layout: "split" },
    });
    const fields = [...container.querySelectorAll('[data-type="relay-url"]')];
    expect(fields.length).toBeGreaterThan(0);
    for (const f of fields) {
      expect(f.querySelector("input")?.getAttribute("type")).toBe("text");
      const options = [...f.querySelectorAll("datalist option")].map((o) =>
        o.getAttribute("value"),
      );
      expect(options[0]).toBe("ALL_RELAYS");
      expect(options.some((v) => v?.startsWith("wss://"))).toBe(true);
    }
  });
});
