export type FoodAnalysisInput = { imageUri: string };

export type FoodAnalysisResult =
  | { status: "notConfigured" }
  | { status: "identified"; foodId: string; confidence: number };

export type FoodVisionService = {
  analyzeFoodImage(input: FoodAnalysisInput): Promise<FoodAnalysisResult>;
};
