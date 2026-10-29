import { Suspense } from "react";
import { connection } from "next/server";
import { listMovements } from "@/lib/movements";
import { groupMovements } from "@/lib/piece-draft";
import { WorkoutForm } from "./workout-form";

export default function NewWorkoutPage() {
  return (
    <main>
      <h1>New workout</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewWorkout />
      </Suspense>
    </main>
  );
}

async function NewWorkout() {
  await connection();
  const movements = await listMovements();
  return <WorkoutForm movementGroups={groupMovements(movements)} />;
}
