import { expect, test } from "vitest";
import { parseNewWorkoutSession } from "@/lib/workout-validation";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const fran = { type: "FOR_TIME", title: "Fran", scheme: "21-15-9" };
const valid = {
  date: "2026-10-27",
  title: "  Monday  ",
  pieces: JSON.stringify([fran]),
};

test("accepts valid input and normalizes it", () => {
  expect(parseNewWorkoutSession(form(valid))).toEqual({
    ok: true,
    data: {
      date: new Date("2026-10-27T00:00:00Z"),
      title: "Monday",
      pieces: [fran],
    },
  });
});

test("blank optional text becomes null", () => {
  const result = parseNewWorkoutSession(
    form({
      ...valid,
      title: "   ",
      pieces: JSON.stringify([{ type: "AMRAP", title: " ", scheme: "" }]),
    }),
  );
  expect(result).toMatchObject({
    ok: true,
    data: {
      title: null,
      pieces: [{ type: "AMRAP", title: null, scheme: null }],
    },
  });
});

test("drops fields it doesn't know, such as userId", () => {
  const result = parseNewWorkoutSession(
    form({
      ...valid,
      pieces: JSON.stringify([
        { type: "STRENGTH", userId: "someone-else", position: 99 },
      ]),
    }),
  );
  expect(result.ok && result.data.pieces).toEqual([
    { type: "STRENGTH", title: null, scheme: null },
  ]);
});

test.each(["", "2026-02-30", "2026-13-01", "27/10/2026", "2026-10-27T10:00"])(
  "rejects invalid date %j",
  (date) => {
    expect(parseNewWorkoutSession(form({ ...valid, date }))).toMatchObject({
      ok: false,
      errors: { date: "Enter a valid date." },
    });
  },
);

test.each(["", "{", "[]", '"x"', "[null]"])(
  "rejects bad pieces input %j",
  (pieces) => {
    const result = parseNewWorkoutSession(form({ ...valid, pieces }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.pieces).toBeTruthy();
  },
);

test("rejects unknown piece types", () => {
  const result = parseNewWorkoutSession(
    form({ ...valid, pieces: JSON.stringify([{ type: "YOGA" }]) }),
  );
  expect(result).toMatchObject({
    ok: false,
    errors: { pieces: "Piece 1: choose a type." },
  });
});

test("rejects an over-long title", () => {
  const result = parseNewWorkoutSession(
    form({ ...valid, title: "x".repeat(101) }),
  );
  expect(result).toMatchObject({
    ok: false,
    errors: { title: expect.any(String) },
  });
});
