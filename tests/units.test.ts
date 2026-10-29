import { expect, test } from "vitest";
import { formatLoad, fromKg, toKg } from "@/lib/units";

test("1 lb is exactly 0.45359237 kg", () => {
  expect(toKg(1, "lb")).toBe(0.45359237);
  expect(toKg(24, "kg")).toBe(24);
});

test.each([0.5, 1.5, 45, 53, 65, 95, 135, 225, 315])(
  "%j lb survives the round trip through kg",
  (lb) => {
    expect(formatLoad(toKg(lb, "lb"), "lb")).toBe(`${lb} lb`);
  },
);

test.each([16, 20, 24, 32])("%j kg displays as entered in kg", (kg) => {
  expect(formatLoad(toKg(kg, "kg"), "kg")).toBe(`${kg} kg`);
});

test("a kg implement shown in lb is rounded to one decimal", () => {
  expect(formatLoad(24, "lb")).toBe("52.9 lb");
  expect(fromKg(24, "lb")).toBeCloseTo(52.9109, 4);
});
