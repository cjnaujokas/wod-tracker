import { beforeEach } from "vitest";
import { assertLocalDatabase } from "./test-db";

assertLocalDatabase(process.env.DATABASE_URL);

const { prisma } = await import("@/lib/prisma");

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "user", "Movement" CASCADE`;
});
