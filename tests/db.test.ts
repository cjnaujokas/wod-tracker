import { expect, test } from "vitest";
import { prisma } from "@/lib/prisma";

test("test database is migrated and empty", async () => {
  expect(await prisma.workoutSession.count()).toBe(0);
});
