import type { Food } from "../../types/food";

export type FoodSearchOptions = { page?: number; pageSize?: number; signal?: AbortSignal };

export type FoodSearchResult = {
  foods: Food[];
  page: number;
  pageSize: number;
  total: number | null;
  hasMore: boolean;
  remoteStatus?: "unavailable" | "notConfigured";
};

/** Provider contract consumed by the Foods screen. */
export type FoodProvider = {
  searchFoods(query: string, options?: FoodSearchOptions): Promise<FoodSearchResult>;
  getFoodById(id: string, options?: Pick<FoodSearchOptions, "signal">): Promise<Food | null>;
};

export type UsdaNutrient = { nutrientId?: number; nutrientName?: string; unitName?: string; value?: number };
export type UsdaFood = {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  foodCategory?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
};
export type UsdaSearchResponse = {
  foods?: UsdaFood[];
  totalHits?: number;
  currentPage?: number;
  totalPages?: number;
};
