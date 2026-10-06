import type { DailyHistory } from "./historyTypes";
import { selectTrackingStreak } from "./historySelectors";

export type ProgressOverview = { trackingStreak: number; averageSteps: number | null; averageCalories: number | null; goalAdherence: number | null };

export function selectProgressOverview(days: DailyHistory[], today: string): ProgressOverview {
  const tracked = days.filter((day) => day.entries.length > 0 || day.activity !== null);
  const steps = tracked.map((day) => day.activity?.steps).filter((value): value is number => typeof value === "number");
  const calories = tracked.map((day) => day.calories).filter((value): value is number => typeof value === "number");
  const activityDays = tracked.filter((day) => day.activity !== null);
  const goalsMet = activityDays.filter((day) => day.activity!.steps >= day.activity!.stepGoal).length;
  const mean = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  return {
    trackingStreak: selectTrackingStreak(days, today),
    averageSteps: mean(steps),
    averageCalories: mean(calories),
    goalAdherence: activityDays.length ? Math.round(goalsMet / activityDays.length * 100) : null,
  };
}
