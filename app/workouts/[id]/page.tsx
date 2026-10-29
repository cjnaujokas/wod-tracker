import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getWorkoutSession } from "@/lib/workouts";
import { PIECE_TYPE_LABELS } from "@/lib/piece-types";
import { formatClock } from "@/lib/clock";
import { DISPLAY_UNIT, formatLoad } from "@/lib/units";

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
            {clockSummary(piece) && <> · {clockSummary(piece)}</>}
            {piece.movements.length > 0 && (
              <ul>
                {piece.movements.map((m) => (
                  <li key={m.id}>{describeMovement(m)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
function clockSummary(p: {
  timeCapSeconds: number | null;
  durationSeconds: number | null;
  intervalSeconds: number | null;
}) {
  const parts: string[] = [];
  if (p.timeCapSeconds !== null)
    parts.push(`${formatClock(p.timeCapSeconds)} cap`);
  if (p.intervalSeconds !== null)
    parts.push(`every ${formatClock(p.intervalSeconds)}`);
  if (p.durationSeconds !== null)
    parts.push(
      p.intervalSeconds !== null
        ? `for ${formatClock(p.durationSeconds)}`
        : formatClock(p.durationSeconds),
    );
  return parts.join(" ");
}

/** "21 Thruster @ 95 lb", "400 m Run" */
function describeMovement(m: {
  reps: number | null;
  loadKg: number | null;
  distanceM: number | null;
  movement: { name: string };
}) {
  return [
    m.reps,
    m.distanceM !== null ? `${m.distanceM} m` : null,
    m.movement.name,
    m.loadKg !== null ? `@ ${formatLoad(m.loadKg, DISPLAY_UNIT)}` : null,
  ]
    .filter((part) => part !== null)
    .join(" ");
}
