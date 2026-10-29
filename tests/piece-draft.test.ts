import { expect, test } from "vitest";
import {
  emptyMovement,
  emptyPiece,
  groupMovements,
  moveItem,
  serializePiece,
  type DraftPiece,
} from "@/lib/piece-draft";
import { parseNewWorkoutSession } from "@/lib/workout-validation";
import { toKg } from "@/lib/units";

function draft(patch: Partial<DraftPiece>): DraftPiece {
  return { ...emptyPiece(), ...patch };
}

test("sends only the clock fields the type uses, and no keys", () => {
  // duration was typed while the piece was an AMRAP, then the type changed
  const piece = draft({
    type: "FOR_TIME",
    timeCap: "10:00",
    duration: "20:00",
  });
  expect(serializePiece(piece)).toEqual({
    type: "FOR_TIME",
    title: "",
    scheme: "",
    timeCap: "10:00",
    movements: [],
  });
});

test("a piece without a type sends no clock fields", () => {
  const sent = serializePiece(draft({ timeCap: "10:00", interval: "1:00" }));
  expect(Object.keys(sent).sort()).toEqual([
    "movements",
    "scheme",
    "title",
    "type",
  ]);
});

test("what the form sends is what the server accepts", () => {
  const thruster = {
    ...emptyMovement(),
    movementId: "t",
    reps: "21",
    load: "95",
  };
  const kb = {
    ...emptyMovement(),
    movementId: "kb",
    load: "24",
    unit: "kg" as const,
  };
  const piece = draft({
    type: "EMOM",
    title: "EMOM 10",
    duration: "10:00",
    interval: "1:00",
    timeCap: "5:00", // hidden leftover: must not reach the server
    movements: [thruster, kb],
  });

  const fd = new FormData();
  fd.set("date", "2026-10-29");
  fd.set("title", "");
  fd.set("pieces", JSON.stringify([serializePiece(piece)]));

  expect(parseNewWorkoutSession(fd)).toMatchObject({
    ok: true,
    data: {
      pieces: [
        {
          type: "EMOM",
          durationSeconds: 600,
          intervalSeconds: 60,
          timeCapSeconds: null,
          movements: [
            { movementId: "t", reps: 21, loadKg: toKg(95, "lb") },
            { movementId: "kb", reps: null, loadKg: 24 },
          ],
        },
      ],
    },
  });
});

test("moveItem swaps neighbours and ignores moves past the ends", () => {
  expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
  const list = ["a", "b"];
  expect(moveItem(list, 0, -1)).toBe(list);
  expect(moveItem(list, 1, 1)).toBe(list);
});

test("groupMovements keeps the library's order within categories", () => {
  const m = (name: string, category: string) => ({ id: name, name, category });
  expect(
    groupMovements([
      m("Pull-up", "Gymnastics"),
      m("Push-up", "Gymnastics"),
      m("Thruster", "Weightlifting"),
    ]),
  ).toEqual([
    ["Gymnastics", [m("Pull-up", "Gymnastics"), m("Push-up", "Gymnastics")]],
    ["Weightlifting", [m("Thruster", "Weightlifting")]],
  ]);
});
