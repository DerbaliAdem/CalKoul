export type ActivityPermissionState = "notRequested" | "granted" | "denied" | "unavailable" | "loading" | "error";

export type ActivityDay = {
  date: string;
  steps: number;
  stepGoal: number;
  distanceMeters: number;
  activeCalories: number | null;
  updatedAt: string;
  source: "sensor" | "manual";
};

export type ActivityEstimates = {
  distanceMeters: number | null;
  activeCalories: number | null;
};
