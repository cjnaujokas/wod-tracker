import { expect, test } from "vitest";
import { formatClock, parseClock } from "@/lib/clock";

test.each([
  ["0:30", 30],
  ["1:00", 60],
  ["12:00", 720],
  [" 20:00 ", 1200],
  ["90:00", 5400],
  ["1:05:00", 3900],
  ["0:00", 0],
])("parses %j as %i seconds", (input, seconds) => {
  expect(parseClock(input)).toBe(seconds);
});

test.each([
  "",
  "12",
  ":30",
  "1:",
  "1:5",
  "1:60",
  "1:05:60",
  "1:60:00",
  "1:5:00",
  "1:00:00:00",
  "-1:00",
  "1.5:00",
  "1:0a",
  "1e3:00",
])("rejects %j", (input) => {
  expect(parseClock(input)).toBeNull();
});

test.each([
  [0, "0:00"],
  [30, "0:30"],
  [720, "12:00"],
  [3599, "59:59"],
  [3600, "1:00:00"],
  [3900, "1:05:00"],
])("formats %i as %j", (seconds, text) => {
  expect(formatClock(seconds)).toBe(text);
});

test("format → parse round-trips", () => {
  for (const s of [0, 59, 60, 342, 3599, 3600, 3661, 7200]) {
    expect(parseClock(formatClock(s))).toBe(s);
  }
});
