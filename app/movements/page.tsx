import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

async function MovementCount() {
  await connection();
  const count = await prisma.movement.count();
  return <p>Movements: {count}</p>;
}

export default function MovementsPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <MovementCount />
    </Suspense>
  );
}
