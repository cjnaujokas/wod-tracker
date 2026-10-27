import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createWorkoutSession,
  getWorkoutSession,
  listWorkoutSessions,
} from "@/lib/workouts";

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
