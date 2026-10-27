"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createWorkoutSession } from "@/lib/workouts";
import {
  parseNewWorkoutSession,
  type FormState,
} from "@/lib/workout-validation";

export async function createWorkoutSessionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // The ONLY source of userId. Never read it from formData.
  const user = await requireUser();

  const parsed = parseNewWorkoutSession(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  const workout = await createWorkoutSession(user.id, parsed.data);
  redirect(`/workouts/${workout.id}`); // throws; keep it outside any try/catch
}
