import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyProfile, type ActivityLevel, type EnergyEquation, type NutritionGoal, type UserProfile } from "../../types/user";

const PROFILE_KEY = "calkoul.profile";
const activities: ActivityLevel[] = ["Sedentary", "Lightly active", "Moderately active", "Very active"];
const goals: NutritionGoal[] = ["Maintain my nutrition", "Improve my eating habits", "Gain weight", "Lose weight"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseProfile(value: unknown): UserProfile {
  if (!isRecord(value)) return emptyProfile;
  return {
    name: typeof value.name === "string" ? value.name : "",
    age: typeof value.age === "string" ? value.age : "",
    height: typeof value.height === "string" ? value.height : "",
    weight: typeof value.weight === "string" ? value.weight : "",
    activity: activities.includes(value.activity as ActivityLevel) ? value.activity as ActivityLevel : "",
    goal: goals.includes(value.goal as NutritionGoal) ? value.goal as NutritionGoal : "",
    energyEquation: value.energyEquation === "female" || value.energyEquation === "male" ? value.energyEquation as EnergyEquation : "",
    profilePhotoUri: typeof value.profilePhotoUri === "string" ? value.profilePhotoUri : "",
  };
}

export async function loadProfile(): Promise<UserProfile> {
  const stored = await AsyncStorage.getItem(PROFILE_KEY);
  if (!stored) return emptyProfile;
  try {
    return parseProfile(JSON.parse(stored) as unknown);
  } catch {
    return emptyProfile;
  }
}

export async function persistProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
