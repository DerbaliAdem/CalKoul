import type { FoodVisionService } from "./foodVisionTypes";

/** Placeholder boundary until a Calkoul backend and image-analysis provider exist. */
export const foodVisionService: FoodVisionService = {
  async analyzeFoodImage({ imageUri }) {
    if (!imageUri.trim()) throw new Error("A captured image is required");
    return { status: "notConfigured" };
  },
};
