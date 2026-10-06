import type { UserProfile } from "../../types/user";
import type { NutritionTargets } from "./nutritionTypes";

const activityFactors: Record<Exclude<UserProfile["activity"], "">, number> = {
  Sedentary: 1.2,
  "Lightly active": 1.375,
  "Moderately active": 1.55,
  "Very active": 1.725,
};

const goalAdjustment: Record<Exclude<UserProfile["goal"], "">, number> = {
  "Maintain my nutrition": 0,
  "Improve my eating habits": 0,
  "Gain weight": 200,
  "Lose weight": -200,
};

const MINIMUM_TARGET_CALORIES = 1200;

/** Mifflin–St Jeor estimate for adults; output is a general estimate, not advice. */
export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const age = Number(profile.age);
  const height = Number(profile.height);
  const weight = Number(profile.weight);
  if (profile.age && Number.isFinite(age) && age < 18) return { available: false, reason: "adultOnly" };
  if (!profile.age || !profile.height || !profile.weight || !profile.activity || !profile.goal || !profile.energyEquation ||
      !Number.isFinite(age) || age > 120 || !Number.isInteger(age) || !Number.isFinite(height) || height < 80 || height > 250 || !Number.isFinite(weight) || weight < 25 || weight > 350) {
    return { available: false, reason: "incompleteProfile" };
  }
  if (age < 18) return { available: false, reason: "adultOnly" };

  const equationConstant = profile.energyEquation === "male" ? 5 : -161;
  const restingEstimate = (10 * weight) + (6.25 * height) - (5 * age) + equationConstant;
  const estimatedMaintenanceCalories = Math.round(restingEstimate * activityFactors[profile.activity]);
  const dailyCalories = Math.round(estimatedMaintenanceCalories + goalAdjustment[profile.goal]);
  if (!Number.isFinite(dailyCalories) || dailyCalories < MINIMUM_TARGET_CALORIES) {
    return { available: false, reason: "belowSafeFloor" };
  }

  // A simple 20/50/30 macro split for an estimate, not individualized guidance.
  return {
    available: true,
    estimatedMaintenanceCalories,
    dailyCalories,
    proteinGrams: Math.round((dailyCalories * 0.2) / 4),
    carbsGrams: Math.round((dailyCalories * 0.5) / 4),
    fatGrams: Math.round((dailyCalories * 0.3) / 9),
  };
}
