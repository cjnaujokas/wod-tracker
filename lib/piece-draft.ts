// Client-safe: draft state for the new-workout form, and what it sends.
// Inputs stay strings here; the server parses them (lib/workout-validation.ts).
import type { PieceType } from "@/generated/prisma/client";
import { PIECE_CLOCK_FIELDS, type ClockField } from "@/lib/piece-types";
import type { LoadUnit } from "@/lib/units";

export type MovementOption = { id: string; name: string; category: string };
export type MovementGroup = [category: string, movements: MovementOption[]];

export type DraftMovement = {
  key: string;
  movementId: string;
  reps: string;
  load: string;
  unit: LoadUnit;
  distance: string;
};

export type DraftPiece = {
  key: string;
  type: PieceType | "";
  title: string;
  scheme: string;
  timeCap: string;
  duration: string;
  interval: string;
  movements: DraftMovement[];
};

/** React list key only; never sent to the server. */
const newKey = () => crypto.randomUUID();

export const emptyPiece = (key = newKey()): DraftPiece => ({
  key,
  type: "",
  title: "",
  scheme: "",
  timeCap: "",
  duration: "",
  interval: "",
  movements: [],
});

export const emptyMovement = (): DraftMovement => ({
  key: newKey(),
  movementId: "",
  reps: "",
  load: "",
  unit: "lb",
  distance: "",
});

export function withClock(
  piece: DraftPiece,
  field: ClockField,
  value: string,
): DraftPiece {
  const next = { ...piece };
  next[field] = value;
  return next;
}

/** Swap item at index with its neighbour; out-of-range moves are ignored. */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Library list (sorted by category, name) → [category, movements] groups. */
export function groupMovements(movements: MovementOption[]): MovementGroup[] {
  const groups = new Map<string, MovementOption[]>();
  for (const m of movements) {
    const list = groups.get(m.category);
    if (list) list.push(m);
    else groups.set(m.category, [m]);
  }
  return [...groups];
}

/**
 * What the form sends for a piece. Only the clock fields the type uses: a
 * value typed before switching type stays hidden in state and must not be
 * submitted (the server would reject it). Keys are dropped.
 */
export function serializePiece(piece: DraftPiece) {
  const clockFields = piece.type === "" ? [] : PIECE_CLOCK_FIELDS[piece.type];
  return {
    type: piece.type,
    title: piece.title,
    scheme: piece.scheme,
    ...Object.fromEntries(clockFields.map((f) => [f, piece[f]])),
    movements: piece.movements.map(
      ({ movementId, reps, load, unit, distance }) => ({
        movementId,
        reps,
        load,
        unit,
        distance,
      }),
    ),
  };
}
