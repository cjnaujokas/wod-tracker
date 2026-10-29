import { Suspense } from "react";
import { connection } from "next/server";
import { listMovements } from "@/lib/movements";

export default function MovementsPage() {
  return (
    <main>
      <h1>Movements</h1>
      <Suspense fallback={<p>Loading movements…</p>}>
        <MovementList />
      </Suspense>
    </main>
  );
}

async function MovementList() {
  await connection();

  const movements = await listMovements();

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
