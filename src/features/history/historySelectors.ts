import type { ActivityDay } from "../activity/activityTypes";
import type { LoggedFood } from "../../types/meal";
import { sumNutrition } from "../../services/nutrition/nutritionMath";
import type { DailyHistory, HistoryPeriod, PeriodSummary, ProgressMetric, ProgressPoint } from "./historyTypes";
import { endOfMonth, endOfYear, shiftDate, startOfWeek } from "./historyUtils";

export function selectDailyHistory(entries: LoggedFood[], activityDays: ActivityDay[]): DailyHistory[] {
  const entriesByDate = new Map<string, LoggedFood[]>();
  for (const entry of entries) entriesByDate.set(entry.date, [...(entriesByDate.get(entry.date) ?? []), entry]);
  const activityByDate = new Map(activityDays.map((day) => [day.date, day]));
  const dates = new Set([...entriesByDate.keys(), ...activityByDate.keys()]);
  return [...dates].sort((a, b) => b.localeCompare(a)).map((date) => {
    const dayEntries = entriesByDate.get(date) ?? [];
    const totals = dayEntries.length ? sumNutrition(dayEntries.map((entry) => entry.nutrition)) : null;
    const targetCalories = [...dayEntries].reverse().find((entry) => entry.dailyTargetCalories !== null)?.dailyTargetCalories ?? null;
    return { date, entries: dayEntries, activity: activityByDate.get(date) ?? null, calories: totals?.calories ?? null, targetCalories, protein: totals?.protein ?? null, carbs: totals?.carbs ?? null, fat: totals?.fat ?? null };
  });
}

export function selectPeriodSummaries(days: DailyHistory[], period: Exclude<HistoryPeriod, "day">, selectedYear?: number): PeriodSummary[] {
  const grouped = new Map<string, DailyHistory[]>();
  for (const day of days) {
    if (selectedYear && Number(day.date.slice(0, 4)) !== selectedYear) continue;
    const key = period === "week" ? startOfWeek(day.date) : period === "month" ? day.date.slice(0, 7) : day.date.slice(0, 4);
    grouped.set(key, [...(grouped.get(key) ?? []), day]);
  }
  return [...grouped.entries()].map(([key, group]) => {
    const values = (selector: (day: DailyHistory) => number | null) => group.map(selector).filter((value): value is number => value !== null && Number.isFinite(value));
    const average = (items: number[]) => items.length ? items.reduce((total, value) => total + value, 0) / items.length : null;
    const steps = values((day) => day.activity?.steps ?? null);
    const activeCalories = values((day) => day.activity?.activeCalories ?? null);
    const trackedActivity = group.filter((day) => day.activity !== null);
    const goalsMet = trackedActivity.filter((day) => day.activity!.steps >= day.activity!.stepGoal).length;
    const startDate = period === "week" ? key : period === "month" ? key + "-01" : key + "-01-01";
    const endDate = period === "week" ? shiftDate(key, 6) : period === "month" ? endOfMonth(key + "-01") : endOfYear(key + "-01-01");
    return {
      key, period, startDate, endDate,
      daysTracked: group.filter((day) => day.entries.length > 0 || day.activity !== null).length,
      averageCalories: average(values((day) => day.calories)),
      averageProtein: average(values((day) => day.protein)),
      averageSteps: average(steps),
      totalSteps: steps.length ? steps.reduce((sum, value) => sum + value, 0) : null,
      estimatedActiveCalories: activeCalories.length ? activeCalories.reduce((sum, value) => sum + value, 0) : null,
      goalAdherence: trackedActivity.length ? Math.round(goalsMet / trackedActivity.length * 100) : null,
    };
  }).sort((a, b) => b.key.localeCompare(a.key));
}

export function selectTrailingProgress(days: DailyHistory[], metric: ProgressMetric, count: number, today: string): ProgressPoint[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const points: ProgressPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = shiftDate(today, -offset);
    const day = byDate.get(date);
    let value: number | null = null;
    if (day) {
      if (metric === "steps") value = day.activity?.steps ?? null;
      if (metric === "calories") value = day.calories;
      if (metric === "activeCalories") value = day.activity?.activeCalories ?? null;
      if (metric === "protein") value = day.protein;
      if (metric === "goalAdherence" && day.activity) value = day.activity.steps >= day.activity.stepGoal ? 100 : 0;
    }
    points.push({ date, value });
  }
  return points;
}

export function selectTrackingStreak(days: DailyHistory[], today: string): number {
  const tracked = new Set(days.filter((day) => day.entries.length > 0 || day.activity !== null).map((day) => day.date));
  let cursor = tracked.has(today) ? today : shiftDate(today, -1);
  let count = 0;
  while (tracked.has(cursor)) { count += 1; cursor = shiftDate(cursor, -1); }
  return count;
}

export function selectedYearOptions(days: DailyHistory[], currentYear: number): number[] {
  return [...new Set([currentYear, ...days.map((day) => Number(day.date.slice(0, 4)))])].filter(Number.isFinite).sort((a, b) => b - a);
}
