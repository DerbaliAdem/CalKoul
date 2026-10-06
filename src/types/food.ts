export type FoodCategory =
  | "Breakfast"
  | "Main dishes"
  | "Couscous"
  | "Street food"
  | "Salads"
  | "Desserts"
  | "Drinks"
  | "Ingredients";

export type Food = {
  id: string;
  name: string;
  nameFr: string;
  nameAr: string;
  nameDe: string;
  category: FoodCategory;
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionDe: string;
  servingSize: number;
  servingUnit: string;
  servingLabel?: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  brand?: string | null;
  image?: string | null;
  source?: "local" | "usda" | "custom" | "external" | "calkoul";
  sourceId?: string;
  isLocal?: boolean;
  availableNutrients?: Partial<Record<"calories" | "protein" | "carbs" | "fat", boolean>>;
  ingredients: string[];
  emoji: string;
};
