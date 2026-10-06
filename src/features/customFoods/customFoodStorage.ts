import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomFood } from "./customFoodTypes";

const CUSTOM_FOODS_KEY = "calkoul.customFoods.v1";

export async function loadCustomFoods(): Promise<CustomFood[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((food): food is CustomFood => typeof food === "object" && food !== null && "id" in food && typeof food.id === "string" && food.source === "custom");
}

export async function persistCustomFoods(foods: CustomFood[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
}
