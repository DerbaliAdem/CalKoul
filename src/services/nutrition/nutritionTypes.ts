export type NutritionTargetReason = "incompleteProfile" | "adultOnly" | "belowSafeFloor";

export type NutritionTargets =
  | {
      available: true;
      estimatedMaintenanceCalories: number;
      dailyCalories: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
    }
  | { available: false; reason: NutritionTargetReason };
