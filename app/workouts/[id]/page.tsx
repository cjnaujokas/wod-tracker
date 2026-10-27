import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getWorkoutSession } from "@/lib/workouts";
import { PIECE_TYPE_LABELS } from "@/lib/piece-types";

export default function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  return (
    <main>
      <Suspense fallback={<p>Loading workout…</p>}>
        <Workout params={params} />
      </Suspense>
      <p>
        <Link href="/workouts/new">New workout</Link>
      </p>
    </main>
  );
}

async function Workout({
  params,
}: {
  params: PageProps<"/workouts/[id]">["params"];
}) {
  const { id } = await params;
  const user = await requireUser();

  // Filtered on user.id: another user's workout looks exactly like a missing one
  const workout = await getWorkoutSession(user.id, id);
  if (!workout) notFound();

  const date = workout.date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    dateStyle: "full",
  });

  return (
    <>
      <h1>{workout.title ?? "Workout"}</h1>
      <p>{date}</p>
      <ol>
        {workout.pieces.map((piece) => (
          <li key={piece.id}>
            {PIECE_TYPE_LABELS[piece.type]}
            {piece.title && <> — {piece.title}</>}
            {piece.scheme && <> ({piece.scheme})</>}
          </li>
        ))}
      </ol>
    </>
  );
}
