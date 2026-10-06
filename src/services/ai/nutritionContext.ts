import type { UserProfile } from "../../types/user";
import type { LoggedFood, MealType } from "../../types/meal";
import { foods } from "../../data/foods";
import { sumNutrition } from "../nutrition/nutritionMath";
import { calculateNutritionTargets } from "../nutrition/nutritionCalculator";
import type { NutritionAssistantContext } from "./aiTypes";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildNutritionContext(profile: UserProfile, entries: LoggedFood[], language: string, now = new Date()): NutritionAssistantContext {
  const todayKey = dateKey(now);
  const todayEntries = entries.filter((entry) => entry.date === todayKey);
  const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const byDate = new Map<string, LoggedFood[]>();
  entries.filter((entry) => entry.date !== todayKey && entry.date >= dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)))
    .forEach((entry) => byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry]));
  return {
    language,
    date: todayKey,
    profile: {
      age: profile.age ? Number(profile.age) : null,
      heightCm: profile.height ? Number(profile.height) : null,
      weightKg: profile.weight ? Number(profile.weight) : null,
      activity: profile.activity || null,
      goal: profile.goal || null,
    },
    targets: calculateNutritionTargets(profile),
    today: {
      totals: sumNutrition(todayEntries.map((entry) => entry.nutrition)),
      meals: mealTypes.map((type) => ({
        type,
        foods: todayEntries.filter((entry) => entry.meal === type).map((entry) => ({
          name: entry.food.name,
          quantity: entry.quantity,
          serving: entry.food.servingLabel ?? `${entry.food.servingSize} ${entry.food.servingUnit}`,
          nutrition: entry.nutrition,
        })),
      })),
    },
    history: [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, dayEntries]) => ({
      date,
      totals: sumNutrition(dayEntries.map((entry) => entry.nutrition)),
      meals: dayEntries.length,
    })),
    availableFoods: foods.map((food) => ({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    })),
  };
}
