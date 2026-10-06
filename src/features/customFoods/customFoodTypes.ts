import type { Food, FoodCategory } from "../../types/food";

export type CustomFoodDraft = {
  name: string;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  notes: string;
  image: string | null;
};

export type CustomFood = Food & { source: "custom"; sourceId: string };
