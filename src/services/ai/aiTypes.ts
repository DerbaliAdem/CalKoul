import type { NutritionTargets } from "../nutrition/nutritionTypes";
import type { NutritionValues } from "../nutrition/nutritionMath";
import type { MealType } from "../../types/meal";

export type NutritionAssistantContext = {
  language: string;
  date: string;
  profile: { age: number | null; heightCm: number | null; weightKg: number | null; activity: string | null; goal: string | null };
  targets: NutritionTargets;
  today: { totals: NutritionValues; meals: { type: MealType; foods: { name: string; quantity: number; serving: string; nutrition: NutritionValues }[] }[] };
  history: { date: string; totals: NutritionValues; meals: number }[];
  availableFoods: { name: string; calories: number | null; protein: number | null; carbs: number | null; fat: number | null }[];
};

export type AssistantMessage = { id: string; role: "user" | "assistant"; content: string };
export type AskAssistantInput = { question: string; context: NutritionAssistantContext; signal?: AbortSignal };
