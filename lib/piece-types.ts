import type { PieceType } from "@/generated/prisma/client";

export const PIECE_TYPE_LABELS: Record<PieceType, string> = {
  FOR_TIME: "For time",
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  STRENGTH: "Strength",
  OTHER: "Other",
};

export const PIECE_TYPES = Object.keys(PIECE_TYPE_LABELS) as PieceType[];

export type ClockField = "timeCap" | "duration" | "interval";

export const CLOCK_FIELD_LABELS: Record<ClockField, string> = {
  timeCap: "time cap",
  duration: "duration",
  interval: "interval",
};

/** Which clock fields each type takes. Validation rejects the others; the form hides them. */
export const PIECE_CLOCK_FIELDS: Record<PieceType, readonly ClockField[]> = {
  FOR_TIME: ["timeCap"],
  AMRAP: ["duration"],
  EMOM: ["duration", "interval"],
  STRENGTH: [],
  OTHER: [],
};
