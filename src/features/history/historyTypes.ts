import type { ActivityDay } from "../activity/activityTypes";
import type { LoggedFood } from "../../types/meal";

export type HistoryPeriod = "day" | "week" | "month" | "year";
export type ProgressMetric = "steps" | "calories" | "activeCalories" | "protein" | "goalAdherence";
export type DailyHistory = {
  date: string;
  entries: LoggedFood[];
  activity: ActivityDay | null;
  calories: number | null;
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};
export type PeriodSummary = {
  key: string;
  period: Exclude<HistoryPeriod, "day">;
  startDate: string;
  endDate: string;
  daysTracked: number;
  averageCalories: number | null;
  averageProtein: number | null;
  averageSteps: number | null;
  totalSteps: number | null;
  estimatedActiveCalories: number | null;
  goalAdherence: number | null;
};
export type ProgressPoint = { date: string; value: number | null };
