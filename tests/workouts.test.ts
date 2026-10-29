import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createWorkoutSession,
  getWorkoutSession,
  listWorkoutSessions,
} from "@/lib/workouts";
import { UnknownMovementError } from "@/lib/workouts";

const date = new Date("2026-10-27");
let userA: string;
let userB: string;

async function createUser(id: string) {
  await prisma.user.create({
    data: { id, name: id, email: `${id}@test.local` },
  });
  return id;
}

beforeEach(async () => {
  userA = await createUser("user-a");
  userB = await createUser("user-b");
});

test("a user can read their own session but not another user's", async () => {
  const session = await createWorkoutSession(userA, { date, pieces: [] });

  expect(await getWorkoutSession(userA, session.id)).not.toBeNull();
  expect(await getWorkoutSession(userB, session.id)).toBeNull();
});

test("listing returns only the user's own sessions", async () => {
  const a = await createWorkoutSession(userA, { date, pieces: [] });
  const b = await createWorkoutSession(userB, { date, pieces: [] });

  expect((await listWorkoutSessions(userA)).map((s) => s.id)).toEqual([a.id]);
  expect((await listWorkoutSessions(userB)).map((s) => s.id)).toEqual([b.id]);
});

test("pieces are stored in order and owned by the session's user", async () => {
  const session = await createWorkoutSession(userA, {
    date,
    title: "Monday",
    pieces: [
      { type: "STRENGTH", scheme: "5x5" },
      { type: "FOR_TIME", title: "Fran", scheme: "21-15-9" },
    ],
  });

  const rows = await prisma.piece.findMany({
    where: { workoutSessionId: session.id },
    orderBy: { position: "asc" },
  });
  expect(rows.map((r) => [r.position, r.type, r.userId])).toEqual([
    [0, "STRENGTH", userA],
    [1, "FOR_TIME", userA],
  ]);

  // @db.Date comes back as midnight UTC
  expect(session.date.toISOString()).toBe("2026-10-27T00:00:00.000Z");
});

async function createMovement(name: string) {
  return (await prisma.movement.create({ data: { name, category: "test" } }))
    .id;
}

test("movements are stored in order, owned by the session's user", async () => {
  const thruster = await createMovement("Thruster");
  const pullUp = await createMovement("Pull-up");
  const session = await createWorkoutSession(userA, {
    date,
    pieces: [
      {
        type: "FOR_TIME",
        timeCapSeconds: 600,
        movements: [
          { movementId: thruster, reps: 21, loadKg: 43.09127515 },
          { movementId: pullUp, reps: 21 },
        ],
      },
    ],
  });

  const rows = await prisma.pieceMovement.findMany({
    where: { pieceId: session.pieces[0].id },
    orderBy: { position: "asc" },
  });
  expect(
    rows.map((r) => [
      r.position,
      r.movementId,
      r.userId,
      r.reps,
      r.loadKg,
      r.distanceM,
    ]),
  ).toEqual([
    [0, thruster, userA, 21, 43.09127515, null],
    [1, pullUp, userA, 21, null, null],
  ]);
  expect(session.pieces[0].timeCapSeconds).toBe(600);
});

test("the owner reads movements with names; another user gets nothing", async () => {
  const thruster = await createMovement("Thruster");
  const session = await createWorkoutSession(userA, {
    date,
    pieces: [
      { type: "FOR_TIME", movements: [{ movementId: thruster, reps: 21 }] },
    ],
  });

  const own = await getWorkoutSession(userA, session.id);
  expect(
    own?.pieces[0].movements.map((m) => [m.movement.name, m.reps]),
  ).toEqual([["Thruster", 21]]);
  expect(await getWorkoutSession(userB, session.id)).toBeNull();
});

test("an unknown movement is rejected and nothing is saved", async () => {
  await expect(
    createWorkoutSession(userA, {
      date,
      pieces: [
        { type: "OTHER", movements: [{ movementId: "no-such-movement" }] },
      ],
    }),
  ).rejects.toBeInstanceOf(UnknownMovementError);
  expect(await prisma.workoutSession.count()).toBe(0);
});

test("the same movement can appear twice in a piece", async () => {
  const run = await createMovement("Run");
  const session = await createWorkoutSession(userA, {
    date,
    pieces: [
      {
        type: "FOR_TIME",
        movements: [
          { movementId: run, distanceM: 400 },
          { movementId: run, distanceM: 400 },
        ],
      },
    ],
  });
  expect(
    await prisma.pieceMovement.count({
      where: { pieceId: session.pieces[0].id },
    }),
  ).toBe(2);
});
