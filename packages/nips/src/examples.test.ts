import { describe, expect, test } from "bun:test";
import { defaultEventTemplate } from "./build.ts";
import type { JsonValue, NipSpec, SpecPart } from "./spec.ts";
import { specParts } from "./spec.ts";
import { NIP_SPECS } from "./specs/index.ts";
import { type ValidationIssue, validateAgainstSpec } from "./validate.ts";

// The editor's default date (fixtures FIXTURE_NOW) for templates that omit created_at.
const FIXTURE_NOW = 1735689600;

/** Every example of a part as the value the editor would load (events stay unsigned templates). */
const exampleValues = (
  p: SpecPart,
): readonly { readonly id: string; readonly value: JsonValue }[] => {
  switch (p.kind) {
    case "event":
      return p.part.examples.map((e) => ({
        id: e.id,
        value: { ...defaultEventTemplate(p.part, { exampleId: e.id, createdAt: FIXTURE_NOW }) },
      }));
    case "message":
      return p.part.examples.map((e) => ({ id: e.id, value: e.message }));
    case "document":
      return p.part.examples.map((e) => ({ id: e.id, value: e.value }));
    case "http":
      return p.part.examples.map(({ id, url, headers, body }) => ({
        id,
        value: body === undefined ? { url, headers } : { url, headers, body },
      }));
    case "encoding":
      return p.part.examples.map((e) => ({ id: e.id, value: e.inputs }));
  }
};

const shapesOf = (spec: NipSpec) => Object.fromEntries((spec.events ?? []).map((e) => [e.id, e]));

const errors = (issues: readonly ValidationIssue[]) =>
  issues
    .filter((i) => i.severity === "error")
    .map((i) => `${i.code} at ${JSON.stringify(i.path)} ${JSON.stringify(i.params ?? {})}`);

// The contract's definition of done for spec authors: every example validates without errors
// against its own part. Finished specs only; `todo` stubs have no examples yet.
describe("spec examples validate against their own spec", () => {
  for (const spec of Object.values(NIP_SPECS).filter((s) => s.todo !== true))
    test(`NIP-${spec.nip}`, () => {
      const shapes = shapesOf(spec);
      for (const part of specParts(spec))
        for (const { id, value } of exampleValues(part)) {
          const report = validateAgainstSpec(value, part, { shapes });
          expect(errors(report.issues), `${part.kind}:${part.part.id} example "${id}"`).toEqual([]);
        }
    });
});
