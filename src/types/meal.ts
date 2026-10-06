import type { Food } from "./food";
import type { NutritionValues } from "../services/nutrition/nutritionMath";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type LoggedFood = { id: string; food: Food; quantity: number; meal: MealType; date: string; createdAt: string; nutrition: NutritionValues; dailyTargetCalories: number | null };
