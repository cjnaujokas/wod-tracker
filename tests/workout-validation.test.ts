import { expect, test } from "vitest";
import { parseNewWorkoutSession } from "@/lib/workout-validation";
import { toKg } from "@/lib/units";

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
// What a piece with no clock fields and no movements parses to
const bare = {
  timeCapSeconds: null,
  durationSeconds: null,
  intervalSeconds: null,
  movements: [],
};

function withPieces(pieces: unknown[]) {
  return parseNewWorkoutSession(
    form({ ...valid, pieces: JSON.stringify(pieces) }),
  );
}
function piecesError(pieces: unknown[]) {
  const result = withPieces(pieces);
  return result.ok ? null : result.errors.pieces;
}

test("accepts valid input and normalizes it", () => {
  expect(parseNewWorkoutSession(form(valid))).toEqual({
    ok: true,
    data: {
      date: new Date("2026-10-27T00:00:00Z"),
      title: "Monday",
      pieces: [{ ...fran, ...bare }],
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
    { type: "STRENGTH", title: null, scheme: null, ...bare },
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

// --- #12: clock fields ---

test("parses the clock fields each type allows", () => {
  const result = withPieces([
    { type: "FOR_TIME", timeCap: "12:00" },
    { type: "AMRAP", duration: "20:00" },
    { type: "EMOM", duration: "10:00", interval: "1:00" },
  ]);
  expect(result).toMatchObject({
    ok: true,
    data: {
      pieces: [
        { timeCapSeconds: 720, durationSeconds: null, intervalSeconds: null },
        { timeCapSeconds: null, durationSeconds: 1200, intervalSeconds: null },
        { timeCapSeconds: null, durationSeconds: 600, intervalSeconds: 60 },
      ],
    },
  });
});

test.each([
  [
    { type: "AMRAP", timeCap: "10:00" },
    "Piece 1: time cap isn't used for AMRAP.",
  ],
  [
    { type: "FOR_TIME", interval: "1:00" },
    "Piece 1: interval isn't used for For time.",
  ],
  [
    { type: "STRENGTH", duration: "10:00" },
    "Piece 1: duration isn't used for Strength.",
  ],
  [
    { type: "AMRAP", duration: "12" },
    "Piece 1: enter the duration as m:ss, e.g. 12:00.",
  ],
  [
    { type: "AMRAP", duration: "0:00" },
    "Piece 1: duration must be between 0:01 and 3:00:00.",
  ],
  [
    { type: "FOR_TIME", timeCap: "3:00:01" },
    "Piece 1: time cap must be between 0:01 and 3:00:00.",
  ],
  [
    { type: "EMOM", duration: "40:00", interval: "30:01" },
    "Piece 1: interval must be between 0:01 and 30:00.",
  ],
  [
    { type: "EMOM", duration: "1:00", interval: "2:00" },
    "Piece 1: interval can't be longer than the duration.",
  ],
])("rejects clock input %j", (piece, message) => {
  expect(piecesError([piece])).toBe(message);
});

// --- #12: movements ---

test("parses movements in order, converts lb to kg, drops unknown fields", () => {
  const result = withPieces([
    {
      type: "FOR_TIME",
      movements: [
        {
          movementId: "thruster",
          reps: "21",
          load: "95",
          unit: "lb",
          userId: "x",
          position: 7,
        },
        { movementId: "pull-up", reps: " 21 " },
      ],
    },
  ]);
  expect(result.ok && result.data.pieces[0].movements).toEqual([
    {
      movementId: "thruster",
      reps: 21,
      loadKg: toKg(95, "lb"),
      distanceM: null,
    },
    { movementId: "pull-up", reps: 21, loadKg: null, distanceM: null },
  ]);
});

test("kg loads and decimal distances are kept as entered", () => {
  const result = withPieces([
    {
      type: "OTHER",
      movements: [
        { movementId: "kb", load: "24", unit: "kg", distance: "0.5" },
      ],
    },
  ]);
  expect(result.ok && result.data.pieces[0].movements).toEqual([
    { movementId: "kb", reps: null, loadKg: 24, distanceM: 0.5 },
  ]);
});

test("blank movement numbers become null and need no unit", () => {
  const result = withPieces([
    {
      type: "OTHER",
      movements: [{ movementId: "run", reps: " ", load: "", distance: "" }],
    },
  ]);
  expect(result.ok && result.data.pieces[0].movements).toEqual([
    { movementId: "run", reps: null, loadKg: null, distanceM: null },
  ]);
});

test.each([
  ["1.5", "reps must be a whole number."],
  ["-1", "reps must be a whole number."],
  ["1e3", "reps must be a whole number."],
  ["abc", "reps must be a whole number."],
  ["Infinity", "reps must be a whole number."],
  ["0", "reps must be more than 0."],
  ["1001", "reps can be at most 1000."],
])("rejects reps %j", (reps, message) => {
  expect(
    piecesError([{ type: "OTHER", movements: [{ movementId: "m", reps }] }]),
  ).toBe(`Piece 1, movement 1: ${message}`);
});

test.each([
  ["Infinity", "lb", "load must be a number."],
  ["NaN", "lb", "load must be a number."],
  ["-5", "lb", "load must be a number."],
  ["1e2", "lb", "load must be a number."],
  ["0", "lb", "load must be more than 0."],
  ["9".repeat(400), "lb", "load is too heavy."], // Number() gives Infinity
  ["600", "kg", "load is too heavy."],
])("rejects load %j %s", (load, unit, message) => {
  expect(
    piecesError([
      { type: "OTHER", movements: [{ movementId: "m", load, unit }] },
    ]),
  ).toBe(`Piece 1, movement 1: ${message}`);
});

test.each([undefined, "stone"])("rejects a load with unit %j", (unit) => {
  expect(
    piecesError([
      { type: "OTHER", movements: [{ movementId: "m", load: "95", unit }] },
    ]),
  ).toBe("Piece 1, movement 1: choose lb or kg for the load.");
});

test.each([
  ["x", "Piece 1: movements are invalid."],
  [null, "Piece 1: movements are invalid."],
  [[{ reps: "5" }], "Piece 1, movement 1: choose a movement."],
  [[{ movementId: "x".repeat(51) }], "Piece 1, movement 1: choose a movement."],
  [[null], "Piece 1, movement 1 is invalid."],
  [Array(16).fill({ movementId: "m" }), "Piece 1: at most 15 movements."],
])("rejects movements %j", (movements, message) => {
  expect(piecesError([{ type: "OTHER", movements }])).toBe(message);
});
