import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Food } from "../../types/food";
import type { LoggedFood, MealType } from "../../types/meal";
import { nutritionForQuantity, type NutritionValues } from "../../services/nutrition/nutritionMath";

const MEALS_KEY = "calkoul.meals.v1";
const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const nutritionKeys: (keyof NutritionValues)[] = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeFood(value: unknown): Food | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const calories = value.calories;
  const protein = value.protein;
  const carbs = value.carbs;
  const fat = value.fat;
  const validNutritionValue = (item: unknown) => item === null || (typeof item === "number" && Number.isFinite(item));
  if (![calories, protein, carbs, fat].every(validNutritionValue)) return null;
  const name = value.name;
  return {
    id: value.id, name,
    nameFr: typeof value.nameFr === "string" ? value.nameFr : name,
    nameAr: typeof value.nameAr === "string" ? value.nameAr : name,
    nameDe: typeof value.nameDe === "string" ? value.nameDe : name,
    category: typeof value.category === "string" ? value.category as Food["category"] : "Ingredients",
    description: typeof value.description === "string" ? value.description : "",
    descriptionFr: typeof value.descriptionFr === "string" ? value.descriptionFr : "",
    descriptionAr: typeof value.descriptionAr === "string" ? value.descriptionAr : "",
    descriptionDe: typeof value.descriptionDe === "string" ? value.descriptionDe : "",
    servingSize: typeof value.servingSize === "number" ? value.servingSize : 100,
    servingUnit: typeof value.servingUnit === "string" ? value.servingUnit : "g",
    servingLabel: typeof value.servingLabel === "string" ? value.servingLabel : undefined,
    calories: calories as number | null, protein: protein as number | null, carbs: carbs as number | null, fat: fat as number | null,
    fiber: typeof value.fiber === "number" ? value.fiber : null,
    sugar: typeof value.sugar === "number" ? value.sugar : null,
    sodium: typeof value.sodium === "number" ? value.sodium : null,
    brand: typeof value.brand === "string" ? value.brand : null,
    image: typeof value.image === "string" ? value.image : null,
    source: value.source === "external" || value.source === "usda" ? "usda" : value.source === "custom" ? "custom" : "local",
    sourceId: typeof value.sourceId === "string" ? value.sourceId : value.id,
    isLocal: value.isLocal === true,
    availableNutrients: isRecord(value.availableNutrients) ? value.availableNutrients as Food["availableNutrients"] : undefined,
    ingredients: Array.isArray(value.ingredients) ? value.ingredients.filter((item): item is string => typeof item === "string") : [],
    emoji: typeof value.emoji === "string" ? value.emoji : "🍽️",
  };
}

function normalizeNutrition(value: unknown, food: Food, quantity: number): NutritionValues {
  const fallback = nutritionForQuantity(food, quantity);
  if (!isRecord(value)) return fallback;
  return Object.fromEntries(nutritionKeys.map((key) => [key, typeof value[key] === "number" && Number.isFinite(value[key]) ? value[key] : value[key] === null ? null : fallback[key]])) as unknown as NutritionValues;
}

function normalizeEntry(value: unknown): LoggedFood | null {
  if (!isRecord(value) || typeof value.id !== "string" || !mealTypes.includes(value.meal as MealType)) return null;
  const food = normalizeFood(value.food);
  const quantity = value.quantity;
  if (!food || typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) return null;
  const createdAt = typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt)) ? value.createdAt : new Date().toISOString();
  const date = typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.date) ? value.date : localDateKey(new Date(createdAt));
  return { id: value.id, food, quantity, meal: value.meal as MealType, date, createdAt, nutrition: normalizeNutrition(value.nutrition, food, quantity), dailyTargetCalories: typeof value.dailyTargetCalories === "number" ? value.dailyTargetCalories : null };
}

export async function loadMeals(): Promise<LoggedFood[]> {
  const stored = await AsyncStorage.getItem(MEALS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeEntry).filter((entry): entry is LoggedFood => entry !== null) : [];
  } catch {
    return [];
  }
}

export async function persistMeals(entries: LoggedFood[]): Promise<void> {
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(entries));
}

export async function clearStoredMeals(): Promise<void> {
  await AsyncStorage.removeItem(MEALS_KEY);
}
