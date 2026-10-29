"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createWorkoutSession } from "@/lib/workouts";
import {
  parseNewWorkoutSession,
  type FormState,
} from "@/lib/workout-validation";
import { UnknownMovementError } from "@/lib/workouts";

export async function createWorkoutSessionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // The ONLY source of userId. Never read it from formData.
  const user = await requireUser();

  const parsed = parseNewWorkoutSession(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  let workout;
  try {
    workout = await createWorkoutSession(user.id, parsed.data);
  } catch (error) {
    if (error instanceof UnknownMovementError)
      return {
        errors: {
          pieces: "A movement wasn't found. Reload the page and pick it again.",
        },
      };
    throw error;
  }
  redirect(`/workouts/${workout.id}`); // throws; keep it outside any try/catch
}
