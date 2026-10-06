import type { Food } from "../../types/food";

export type NutritionValues = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
};

export function nutritionForQuantity(food: Food, quantity: number): NutritionValues {
  const scaled = (value: number | null | undefined, key?: "calories" | "protein" | "carbs" | "fat") => {
    if (key && food.availableNutrients?.[key] === false) return null;
    return typeof value === "number" && Number.isFinite(value) ? value * quantity : null;
  };
  return {
    calories: scaled(food.calories, "calories"),
    protein: scaled(food.protein, "protein"),
    carbs: scaled(food.carbs, "carbs"),
    fat: scaled(food.fat, "fat"),
    fiber: scaled(food.fiber),
    sugar: scaled(food.sugar),
    sodium: scaled(food.sodium),
  };
}

export function sumNutrition(values: NutritionValues[]): NutritionValues {
  const sum = (key: keyof NutritionValues): number | null => {
    if (values.length === 0) return 0;
    if (values.some((value) => value[key] === null)) return null;
    return values.reduce<number>((total, value) => total + (value[key] ?? 0), 0);
  };
  return { calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat"), fiber: sum("fiber"), sugar: sum("sugar"), sodium: sum("sodium") };
}
