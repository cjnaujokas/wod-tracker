import type { PieceType } from "@/generated/prisma/client";

export const PIECE_TYPE_LABELS: Record<PieceType, string> = {
  FOR_TIME: "For time",
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  STRENGTH: "Strength",
  OTHER: "Other",
};

export const PIECE_TYPES = Object.keys(PIECE_TYPE_LABELS) as PieceType[];
