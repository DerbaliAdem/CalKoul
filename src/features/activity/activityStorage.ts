import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_STEP_GOAL, validateStepGoal } from "./activityUtils";
import type { ActivityDay } from "./activityTypes";

const ACTIVITY_KEY = "calkoul.activity.v1";

export type ActivityStorageData = { stepGoal: number; days: ActivityDay[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeDay(value: unknown): ActivityDay | null {
  if (!isRecord(value) || typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return null;
  if (typeof value.steps !== "number" || !Number.isFinite(value.steps) || value.steps < 0) return null;
  const stepGoal = typeof value.stepGoal === "number" && validateStepGoal(value.stepGoal) ? value.stepGoal : DEFAULT_STEP_GOAL;
  const distanceMeters = typeof value.distanceMeters === "number" && Number.isFinite(value.distanceMeters) && value.distanceMeters >= 0 ? value.distanceMeters : 0;
  const activeCalories = typeof value.activeCalories === "number" && Number.isFinite(value.activeCalories) ? value.activeCalories : null;
  const updatedAt = typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt)) ? value.updatedAt : new Date().toISOString();
  return { date: value.date, steps: Math.round(value.steps), stepGoal, distanceMeters, activeCalories, updatedAt, source: value.source === "manual" ? "manual" : "sensor" };
}

export async function loadActivityData(): Promise<ActivityStorageData> {
  const stored = await AsyncStorage.getItem(ACTIVITY_KEY);
  if (!stored) return { stepGoal: DEFAULT_STEP_GOAL, days: [] };
  const parsed: unknown = JSON.parse(stored);
  if (!isRecord(parsed)) return { stepGoal: DEFAULT_STEP_GOAL, days: [] };
  const days = Array.isArray(parsed.days) ? parsed.days.map(normalizeDay).filter((day): day is ActivityDay => day !== null) : [];
  return {
    stepGoal: typeof parsed.stepGoal === "number" && validateStepGoal(parsed.stepGoal) ? parsed.stepGoal : DEFAULT_STEP_GOAL,
    days: days.sort((left, right) => right.date.localeCompare(left.date)),
  };
}

export async function persistActivityData(data: ActivityStorageData): Promise<void> {
  await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
}
