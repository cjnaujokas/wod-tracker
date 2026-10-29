import { PieceType } from "@/generated/prisma/client";
import { formatClock, parseClock } from "@/lib/clock";
import {
  CLOCK_FIELD_LABELS,
  PIECE_CLOCK_FIELDS,
  PIECE_TYPE_LABELS,
  type ClockField,
} from "@/lib/piece-types";
import { isLoadUnit, toKg } from "@/lib/units";
import type {
  NewPiece,
  NewPieceMovement,
  NewWorkoutSession,
} from "@/lib/workouts";

export const MAX_TITLE = 100;
export const MAX_SCHEME = 100;
export const MAX_PIECES = 20;
export const MAX_MOVEMENTS = 15;
export const MAX_REPS = 1000;
export const MAX_LOAD_KG = 500;
export const MAX_DISTANCE_M = 100_000;
export const MAX_ID = 50;

const MAX_CLOCK: Record<ClockField, number> = {
  timeCap: 3 * 60 * 60,
  duration: 3 * 60 * 60,
  interval: 30 * 60,
};

export type FieldErrors = Partial<Record<"date" | "title" | "pieces", string>>;
export type FormState = { errors?: FieldErrors };

type ParseResult =
  | { ok: true; data: NewWorkoutSession }
  | { ok: false; errors: FieldErrors };

const pieceTypes = new Set<string>(Object.values(PieceType));

/** Thrown inside parsePieces; its message becomes the pieces error. */
class InputError extends Error {}
function fail(message: string): never {
  throw new InputError(message);
}

/** Trimmed string, or null if missing/blank/not a string. */
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** "YYYY-MM-DD" → midnight UTC, matching @db.Date. Rejects 2026-02-30 etc. */
function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // JS rolls invalid days over (Feb 30 → Mar 2); reject anything that moved
  return date.toISOString().startsWith(value) ? date : null;
}

/**
 * Positive number typed as text, or null when blank. Plain digits only:
 * no signs, exponents, "Infinity" or "NaN", so nothing non-finite gets through
 * except digit strings too long for a double, which the callers' caps reject.
 */
function positiveNumber(
  value: unknown,
  label: string,
  where: string,
  { integer }: { integer: boolean },
): number | null {
  const s = text(value);
  if (s === null) return null;
  const pattern = integer ? /^\d+$/ : /^(\d+(\.\d+)?|\.\d+)$/;
  if (!pattern.test(s))
    fail(`${where}: ${label} must be a ${integer ? "whole " : ""}number.`);
  const n = Number(s);
  if (n <= 0) fail(`${where}: ${label} must be more than 0.`);
  return n;
}

function clockField(
  value: unknown,
  field: ClockField,
  type: PieceType,
  where: string,
): number | null {
  const s = text(value);
  if (s === null) return null;
  const label = CLOCK_FIELD_LABELS[field];
  if (!PIECE_CLOCK_FIELDS[type].includes(field))
    fail(`${where}: ${label} isn't used for ${PIECE_TYPE_LABELS[type]}.`);
  const seconds = parseClock(s);
  if (seconds === null)
    fail(`${where}: enter the ${label} as m:ss, e.g. 12:00.`);
  if (seconds === 0 || seconds > MAX_CLOCK[field])
    fail(
      `${where}: ${label} must be between 0:01 and ${formatClock(MAX_CLOCK[field])}.`,
    );
  return seconds;
}

function parseMovement(item: unknown, where: string): NewPieceMovement {
  if (typeof item !== "object" || item === null || Array.isArray(item))
    fail(`${where} is invalid.`);
  const { movementId, reps, load, unit, distance } = item as Record<
    string,
    unknown
  >;

  // Existence is checked against the database in createWorkoutSession.
  if (
    typeof movementId !== "string" ||
    movementId === "" ||
    movementId.length > MAX_ID
  )
    fail(`${where}: choose a movement.`);

  const repCount = positiveNumber(reps, "reps", where, { integer: true });
  if (repCount !== null && repCount > MAX_REPS)
    fail(`${where}: reps can be at most ${MAX_REPS}.`);

  let loadKg: number | null = null;
  const loadValue = positiveNumber(load, "load", where, { integer: false });
  if (loadValue !== null) {
    if (!isLoadUnit(unit)) fail(`${where}: choose lb or kg for the load.`);
    loadKg = toKg(loadValue, unit); // stored unrounded
    if (loadKg > MAX_LOAD_KG) fail(`${where}: load is too heavy.`);
  }

  const distanceM = positiveNumber(distance, "distance", where, {
    integer: false,
  });
  if (distanceM !== null && distanceM > MAX_DISTANCE_M)
    fail(`${where}: distance can be at most ${MAX_DISTANCE_M} m.`);

  // Copy known fields only (no pieceId, userId, position).
  return { movementId, reps: repCount, loadKg, distanceM };
}

function parsePiece(item: unknown, where: string): NewPiece {
  if (typeof item !== "object" || item === null || Array.isArray(item))
    fail(`${where} is invalid.`);
  const {
    type,
    title,
    scheme,
    timeCap,
    duration,
    interval,
    movements = [],
  } = item as Record<string, unknown>;

  if (typeof type !== "string" || !pieceTypes.has(type))
    fail(`${where}: choose a type.`);
  const pieceType = type as PieceType;

  const pieceTitle = text(title);
  const pieceScheme = text(scheme);
  if (pieceTitle && pieceTitle.length > MAX_TITLE)
    fail(`${where}: title can be at most ${MAX_TITLE} characters.`);
  if (pieceScheme && pieceScheme.length > MAX_SCHEME)
    fail(`${where}: scheme can be at most ${MAX_SCHEME} characters.`);

  const timeCapSeconds = clockField(timeCap, "timeCap", pieceType, where);
  const durationSeconds = clockField(duration, "duration", pieceType, where);
  const intervalSeconds = clockField(interval, "interval", pieceType, where);
  if (
    durationSeconds !== null &&
    intervalSeconds !== null &&
    intervalSeconds > durationSeconds
  )
    fail(`${where}: interval can't be longer than the duration.`);

  if (!Array.isArray(movements)) fail(`${where}: movements are invalid.`);
  if (movements.length > MAX_MOVEMENTS)
    fail(`${where}: at most ${MAX_MOVEMENTS} movements.`);

  // Copy known fields only. Anything else (userId, position, ...) is dropped.
  return {
    type: pieceType,
    title: pieceTitle,
    scheme: pieceScheme,
    timeCapSeconds,
    durationSeconds,
    intervalSeconds,
    movements: movements.map((m, j) =>
      parseMovement(m, `${where}, movement ${j + 1}`),
    ),
  };
}

function parsePieces(raw: FormDataEntryValue | null): NewPiece[] | string {
  let value: unknown;
  try {
    value = JSON.parse(typeof raw === "string" ? raw : "");
  } catch {
    return "Pieces could not be read. Reload the page and try again.";
  }
  if (!Array.isArray(value) || value.length === 0)
    return "Add at least one piece.";
  if (value.length > MAX_PIECES)
    return `A session can have at most ${MAX_PIECES} pieces.`;

  try {
    return value.map((item, i) => parsePiece(item, `Piece ${i + 1}`));
  } catch (error) {
    if (error instanceof InputError) return error.message;
    throw error;
  }
}

export function parseNewWorkoutSession(formData: FormData): ParseResult {
  const errors: FieldErrors = {};

  const date = parseDate(formData.get("date"));
  if (!date) errors.date = "Enter a valid date.";

  const title = text(formData.get("title"));
  if (title && title.length > MAX_TITLE)
    errors.title = `Title can be at most ${MAX_TITLE} characters.`;

  const pieces = parsePieces(formData.get("pieces"));
  if (typeof pieces === "string") errors.pieces = pieces;

  if (!date || typeof pieces === "string" || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: { date, title, pieces } };
}
