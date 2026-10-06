import type { UserProfile } from "../../types/user";
import type { ActivityEstimates } from "./activityTypes";

export const DEFAULT_STEP_GOAL = 8000;
export const MIN_STEP_GOAL = 1000;
export const MAX_STEP_GOAL = 20000;

export function localActivityDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validateStepGoal(goal: number): boolean {
  return Number.isInteger(goal) && goal >= MIN_STEP_GOAL && goal <= MAX_STEP_GOAL;
}

export function calculateActivityEstimates(steps: number, profile: UserProfile): ActivityEstimates {
  if (!Number.isFinite(steps) || steps < 0) return { distanceMeters: null, activeCalories: null };

  const heightCm = Number(profile.height);
  const weightKg = Number(profile.weight);
  // Average stride is estimated from height when available; otherwise use a
  // broad 70 cm step length and keep the result clearly labeled as estimated.
  const strideMeters = Number.isFinite(heightCm) && heightCm >= 100 && heightCm <= 250
    ? (heightCm * 0.415) / 100
    : 0.7;
  const distanceMeters = Math.round(steps * strideMeters);
  // A rough walking estimate. Do not derive calories without a configured weight.
  const activeCalories = Number.isFinite(weightKg) && weightKg >= 25 && weightKg <= 350
    ? Math.round(steps * weightKg * 0.0005)
    : null;

  return { distanceMeters, activeCalories };
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
