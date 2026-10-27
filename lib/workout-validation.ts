import { PieceType } from "@/generated/prisma/client";
import type { NewPiece, NewWorkoutSession } from "@/lib/workouts";

export const MAX_TITLE = 100;
export const MAX_SCHEME = 100;
export const MAX_PIECES = 20;

export type FieldErrors = Partial<Record<"date" | "title" | "pieces", string>>;
export type FormState = { errors?: FieldErrors };

type ParseResult =
  | { ok: true; data: NewWorkoutSession }
  | { ok: false; errors: FieldErrors };

const pieceTypes = new Set<string>(Object.values(PieceType));

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

  const pieces: NewPiece[] = [];
  for (const [i, item] of value.entries()) {
    const n = i + 1;
    if (typeof item !== "object" || item === null)
      return `Piece ${n} is invalid.`;
    const { type, title, scheme } = item as Record<string, unknown>;

    if (typeof type !== "string" || !pieceTypes.has(type))
      return `Piece ${n}: choose a type.`;
    const pieceTitle = text(title);
    const pieceScheme = text(scheme);
    if (pieceTitle && pieceTitle.length > MAX_TITLE)
      return `Piece ${n}: title can be at most ${MAX_TITLE} characters.`;
    if (pieceScheme && pieceScheme.length > MAX_SCHEME)
      return `Piece ${n}: scheme can be at most ${MAX_SCHEME} characters.`;

    // Copy known fields only. Anything else in the input (userId, position, ...) is dropped.
    pieces.push({
      type: type as PieceType,
      title: pieceTitle,
      scheme: pieceScheme,
    });
  }
  return pieces;
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
