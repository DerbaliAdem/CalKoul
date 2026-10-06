import type { Food } from "../../types/food";
import { foodDescription } from "../../i18n/foods";
import type { UsdaFood, UsdaNutrient } from "./foodTypes";

function nutrient(food: UsdaFood, ids: number[], names: string[]): number | null {
  const match = food.foodNutrients?.find((item: UsdaNutrient) => {
    const idMatches = item.nutrientId !== undefined && ids.includes(item.nutrientId);
    const nameMatches = item.nutrientName !== undefined && names.includes(item.nutrientName.toLowerCase());
    return idMatches || nameMatches;
  });
  return typeof match?.value === "number" && Number.isFinite(match.value) ? match.value : null;
}

/** Keeps FoodData Central fields inside the service layer. Values are per 100 g. */
export function mapUsdaFood(food: UsdaFood): Food {
  const name = food.description?.trim() || "Food item";
  const servingSize = typeof food.servingSize === "number" && food.servingSize > 0 ? food.servingSize : 100;
  const servingUnit = food.servingSizeUnit?.trim() || "g";
  const servingFactor = servingSize / 100;
  const perServing = (ids: number[], names: string[]) => {
    const value = nutrient(food, ids, names);
    return value === null ? null : value * servingFactor;
  };
  const calories = perServing([1008], ["energy"]);
  const protein = perServing([1003], ["protein"]);
  const carbs = perServing([1005], ["carbohydrate, by difference", "carbohydrate"]);
  const fat = perServing([1004], ["total lipid (fat)", "total lipid"]);

  return {
    id: `usda-${food.fdcId}`,
    name,
    nameFr: name,
    nameAr: name,
    nameDe: name,
    category: "Ingredients",
    description: foodDescription(name, "en"),
    descriptionFr: foodDescription(name, "fr"),
    descriptionAr: foodDescription(name, "ar"),
    descriptionDe: foodDescription(name, "de"),
    servingSize,
    servingUnit,
    servingLabel: food.householdServingFullText
      ? `${food.householdServingFullText} (${servingSize} ${servingUnit})`
      : `${servingSize} ${servingUnit}`,
    calories,
    protein,
    carbs,
    fat,
    fiber: perServing([1079], ["fiber, total dietary"]),
    sugar: perServing([2000, 1063], ["sugars, total including nlea", "sugars, total"]),
    sodium: perServing([1093], ["sodium, na"]),
    availableNutrients: {
      calories: calories !== null,
      protein: protein !== null,
      carbs: carbs !== null,
      fat: fat !== null,
    },
    brand: food.brandOwner ?? food.brandName ?? null,
    image: null,
    source: "usda",
    sourceId: String(food.fdcId),
    isLocal: false,
    ingredients: [],
    emoji: "🥗",
  };
}
