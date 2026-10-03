import { describe, expect, test } from "bun:test";
import { validateData, validateSeries, validateTree } from "./validate.ts";

const code = (r: { ok: boolean; error?: { code: string } }) => (r.ok ? "ok" : r.error?.code);

describe("validateData", () => {
  test("accepts unique finite data, including negatives by default", () => {
    const data = [
      { id: "a", label: "A", value: 1 },
      { id: "b", label: "B", value: -2 },
    ];
    expect(validateData(data)).toEqual({ ok: true, value: data });
  });
  test("rejects empty, duplicate ids, non-finite and (when asked) negative values", () => {
    expect(code(validateData([]))).toBe("empty");
    expect(
      code(
        validateData([
          { id: "a", label: "A", value: 1 },
          { id: "a", label: "A2", value: 2 },
        ]),
      ),
    ).toBe("duplicate-id");
    expect(code(validateData([{ id: "a", label: "A", value: Number.NaN }]))).toBe("non-finite");
    expect(code(validateData([{ id: "a", label: "A", value: -1 }], { nonNegative: true }))).toBe(
      "negative",
    );
  });
});

describe("validateSeries", () => {
  test("detects time vs numeric x", () => {
    const num = validateSeries([{ id: "s", label: "S", points: [{ x: 1, y: 2 }] }]);
    const time = validateSeries([{ id: "s", label: "S", points: [{ x: new Date(0), y: 2 }] }]);
    expect(num.ok && num.value.time).toBe(false);
    expect(time.ok && time.value.time).toBe(true);
  });
  test("rejects empty, duplicates, mixed x and non-finite points", () => {
    expect(code(validateSeries([]))).toBe("empty");
    expect(code(validateSeries([{ id: "s", label: "S", points: [] }]))).toBe("empty");
    const p = [{ x: 1, y: 1 }];
    expect(
      code(
        validateSeries([
          { id: "s", label: "S", points: p },
          { id: "s", label: "T", points: p },
        ]),
      ),
    ).toBe("duplicate-id");
    expect(
      code(
        validateSeries([
          {
            id: "s",
            label: "S",
            points: [
              { x: 1, y: 1 },
              { x: new Date(0), y: 1 },
            ],
          },
        ]),
      ),
    ).toBe("mixed-x");
    expect(code(validateSeries([{ id: "s", label: "S", points: [{ x: 1, y: Infinity }] }]))).toBe(
      "non-finite",
    );
    expect(
      code(validateSeries([{ id: "s", label: "S", points: [{ x: new Date(Number.NaN), y: 1 }] }])),
    ).toBe("non-finite");
  });
});

describe("validateTree", () => {
  const leaf = (id: string, value?: number) =>
    value === undefined ? { id, label: id } : { id, label: id, value };
  test("accepts a nested tree with a positive leaf", () => {
    const root = { id: "r", label: "R", children: [{ ...leaf("g"), children: [leaf("x", 3)] }] };
    expect(validateTree(root)).toEqual({ ok: true, value: root });
  });
  test("rejects duplicate ids, bad values and all-zero trees", () => {
    expect(code(validateTree({ id: "r", label: "R", children: [leaf("r", 1)] }))).toBe(
      "duplicate-id",
    );
    expect(code(validateTree({ id: "r", label: "R", children: [leaf("a", Number.NaN)] }))).toBe(
      "non-finite",
    );
    expect(code(validateTree({ id: "r", label: "R", children: [leaf("a", -1)] }))).toBe("negative");
    expect(code(validateTree({ id: "r", label: "R", children: [leaf("a"), leaf("b", 0)] }))).toBe(
      "empty",
    );
  });
});
