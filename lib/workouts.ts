import { prisma } from "@/lib/prisma";
import type { PieceType } from "@/generated/prisma/client";

// Every function takes the user's id from the caller, which must get it from
// requireUser() on the server, never from form input or URL params.

/** A movementId that isn't in the library (stale form or tampered input). */
export class UnknownMovementError extends Error {
  constructor() {
    super("Unknown movement");
    this.name = "UnknownMovementError";
  }
}

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
  // Check movement ids up front: otherwise a bad id fails inside the nested
  // create as a Prisma error, which would surface as a 500.
  const ids = [
    ...new Set(
      input.pieces.flatMap((p) => (p.movements ?? []).map((m) => m.movementId)),
    ),
  ];
  if (ids.length > 0) {
    const found = await prisma.movement.count({ where: { id: { in: ids } } });
    if (found !== ids.length) throw new UnknownMovementError();
  }

  return prisma.workoutSession.create({
    data: {
      userId,
      date: input.date,
      title: input.title ?? null,
      pieces: {
        // Position comes from array order; callers can't set it.
        // userId on pieces and their movements is filled from the parent via
        // the composite FKs: code never sets it.
        create: input.pieces.map((piece, position) => ({
          position,
          type: piece.type,
          title: piece.title ?? null,
          scheme: piece.scheme ?? null,
          timeCapSeconds: piece.timeCapSeconds ?? null,
          durationSeconds: piece.durationSeconds ?? null,
          intervalSeconds: piece.intervalSeconds ?? null,
          movements: {
            create: (piece.movements ?? []).map((m, position) => ({
              position,
              movement: { connect: { id: m.movementId } },
              reps: m.reps ?? null,
              loadKg: m.loadKg ?? null,
              distanceM: m.distanceM ?? null,
            })),
          },
        })),
      },
    },
    include: { pieces: { orderBy: { position: "asc" } } },
  });
}

export async function getWorkoutSession(userId: string, id: string) {
  return prisma.workoutSession.findUnique({
    where: { id, userId },
    include: {
      pieces: {
        orderBy: { position: "asc" },
        include: {
          movements: {
            orderBy: { position: "asc" },
            include: { movement: { select: { name: true } } },
          },
        },
      },
    },
  });
}

export async function listWorkoutSessions(userId: string) {
  return prisma.workoutSession.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
