import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export default function MovementsPage() {
  return (
    <main>
      <h1>Movements</h1>
      fallback={<p>Loading movements…</p>}
      <MovementList />
    </main>
  );
}

async function MovementList() {
  await connection();

  const movements = await prisma.movement.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  if (movements.length === 0) {
    return <p>No movements yet.</p>;
  }

  return (
    <ul>
      {movements.map((m) => (
        <li key={m.id}>
          {m.name} <span>({m.category})</span>
        </li>
      ))}
    </ul>
  );
}
