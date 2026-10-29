import { prisma } from "@/lib/prisma";

/** Shared library data: no owner, so no userId filter. */
export async function listMovements() {
  return prisma.movement.findMany({
    select: { id: true, name: true, category: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}
