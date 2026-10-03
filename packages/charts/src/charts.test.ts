import { describe, expect, test } from "bun:test";
import { deltaTone, niceMax, seriesColor } from "./index.ts";
import { spacePx } from "./scales.ts";

test("series colors cycle through chart tokens", () => {
  expect(seriesColor(0)).toBe("var(--color-chart-1)");
  expect(seriesColor(3)).toBe("var(--color-chart-4)");
  expect(seriesColor(8)).toBe("var(--color-chart-1)");
  expect(seriesColor(-1)).toBe("var(--color-chart-8)");
});

describe("niceMax", () => {
  test("rounds the max up to a nice number", () => {
    expect(niceMax([3, 87, 12])).toBe(90);
    expect(niceMax([312, 201])).toBe(350);
    expect(niceMax([1000])).toBe(1000);
  });
  test("never collapses: empty, zero, negative or non-finite input gives 1", () => {
    expect(niceMax([])).toBe(1);
    expect(niceMax([0, 0])).toBe(1);
    expect(niceMax([-5, -2])).toBe(1);
    expect(niceMax([Number.NaN, Number.POSITIVE_INFINITY])).toBe(1);
  });
});

test("deltaTone classifies direction with a float-noise dead zone", () => {
  expect(deltaTone(0.12)).toBe("up");
  expect(deltaTone(-0.3)).toBe("down");
  expect(deltaTone(0)).toBe("flat");
  expect(deltaTone(0.0001)).toBe("flat");
});

test("spacePx reads spacing tokens as numbers", () => {
  expect(spacePx("md")).toBe(16);
  expect(spacePx("4xl")).toBe(96);
});
