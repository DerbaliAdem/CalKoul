import type { UserProfile } from "../../types/user";

export type ProfileValidationIssue = {
  field: "name" | "age" | "height" | "weight";
  min?: number;
  max: number;
};

const ranges = {
  age: { min: 13, max: 120 },
  height: { min: 80, max: 250 },
  weight: { min: 25, max: 350 },
} as const;

export function validateProfile(profile: UserProfile): ProfileValidationIssue | null {
  if (profile.name.trim().length > 80) return { field: "name", max: 80 };
  for (const field of ["age", "height", "weight"] as const) {
    const input = profile[field].trim();
    if (!input) continue;
    const value = Number(input);
    const { min, max } = ranges[field];
    if (!Number.isFinite(value) || value < min || value > max || (field === "age" && !Number.isInteger(value))) {
      return { field, min, max };
    }
  }
  return null;
}
