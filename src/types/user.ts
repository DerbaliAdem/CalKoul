export type ActivityLevel =
  | "Sedentary"
  | "Lightly active"
  | "Moderately active"
  | "Very active";

export type NutritionGoal =
  | "Maintain my nutrition"
  | "Improve my eating habits"
  | "Gain weight"
  | "Lose weight";

export type EnergyEquation = "female" | "male";

export type UserProfile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  activity: ActivityLevel | "";
  goal: NutritionGoal | "";
  energyEquation: EnergyEquation | "";
  profilePhotoUri: string;
};

export const emptyProfile: UserProfile = {
  name: "",
  age: "",
  height: "",
  weight: "",
  activity: "",
  goal: "",
  energyEquation: "",
  profilePhotoUri: "",
};
