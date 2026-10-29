import { prisma } from "@/lib/prisma";
import type { PieceType } from "@/generated/prisma/client";

// Every function takes the user's id from the caller, which must get it from
// requireUser() on the server, never from form input or URL params.

export type NewPieceMovement = {
  movementId: string;
  reps?: number | null;
  /** Unrounded kg; validation converts from what was typed */
  loadKg?: number | null;
  distanceM?: number | null;
};

export type NewPiece = {
  type: PieceType;
  title?: string | null;
  scheme?: string | null;
  timeCapSeconds?: number | null;
  durationSeconds?: number | null;
  intervalSeconds?: number | null;
  movements?: NewPieceMovement[];
};

export type NewWorkoutSession = {
  date: Date;
  title?: string | null;
  pieces: NewPiece[];
};

export async function createWorkoutSession(
  userId: string,
  input: NewWorkoutSession,
) {
  return prisma.workoutSession.create({
    data: {
      userId,
      date: input.date,
      title: input.title ?? null,
      pieces: {
        // Position comes from array order; callers can't set it.
        // userId on each piece is filled from the parent via the composite FK.
        create: input.pieces.map((piece, position) => ({
          position,
          type: piece.type,
          title: piece.title ?? null,
          scheme: piece.scheme ?? null,
        })),
      },
    },
    include: { pieces: { orderBy: { position: "asc" } } },
  });
}

export async function getWorkoutSession(userId: string, id: string) {
  return prisma.workoutSession.findUnique({
    where: { id, userId },
    include: { pieces: { orderBy: { position: "asc" } } },
  });
}

export async function listWorkoutSessions(userId: string) {
  return prisma.workoutSession.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
