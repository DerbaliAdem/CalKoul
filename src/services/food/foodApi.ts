import { mapUsdaFood } from "./foodMapper";
import type { Food } from "../../types/food";
import type { FoodProvider, FoodSearchOptions, FoodSearchResult, UsdaFood, UsdaSearchResponse } from "./foodTypes";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

/** USDA adapter. Replace this provider with a Calkoul backend adapter for production. */
export class USDAFoodProvider implements FoodProvider {
  private readonly foodsById = new Map<string, Food>();
  private readonly searchCache = new Map<string, FoodSearchResult>();

  constructor(private readonly apiKey: string) {}

  async searchFoods(query: string, options: FoodSearchOptions = {}): Promise<FoodSearchResult> {
    const trimmedQuery = query.trim();
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    if (!trimmedQuery) return { foods: [], page, pageSize, total: 0, hasMore: false };
    const cacheKey = `${trimmedQuery.toLocaleLowerCase()}|${page}|${pageSize}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;
    if (!this.apiKey) throw new Error("USDA API key is not configured. Add EXPO_PUBLIC_USDA_API_KEY to .env.local.");

    const url = new URL(`${USDA_BASE_URL}/foods/search`);
    url.searchParams.set("api_key", this.apiKey);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: trimmedQuery, pageNumber: page, pageSize }),
      signal: options.signal,
    });
    if (!response.ok) {
      if (response.status === 429) throw new Error("USDA search limit reached. Please wait and try again.");
      throw new Error(`Food search is unavailable (${response.status}). Please try again.`);
    }

    const payload = (await response.json()) as UsdaSearchResponse;
    const foods = (payload.foods ?? []).map((item) => this.remember(item));
    const total = typeof payload.totalHits === "number" ? payload.totalHits : null;
    const hasMore = typeof payload.totalPages === "number" ? page < payload.totalPages : foods.length === pageSize;
    const result = { foods, page, pageSize, total, hasMore };
    this.searchCache.set(cacheKey, result);
    return result;
  }

  async getFoodById(id: string, options: Pick<FoodSearchOptions, "signal"> = {}): Promise<Food | null> {
    const cached = this.foodsById.get(id);
    if (cached) return cached;
    const fdcId = id.startsWith("usda-") ? id.slice(5) : "";
    if (!fdcId || !this.apiKey) return null;
    const url = new URL(`${USDA_BASE_URL}/food/${encodeURIComponent(fdcId)}`);
    url.searchParams.set("api_key", this.apiKey);
    const response = await fetch(url.toString(), { signal: options.signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Food details are unavailable (${response.status}). Please try again.`);
    return this.remember((await response.json()) as UsdaFood);
  }

  private remember(food: UsdaFood): Food {
    const mapped = mapUsdaFood(food);
    this.foodsById.set(mapped.id, mapped);
    return mapped;
  }
}

// EXPO_PUBLIC values are embedded in the client bundle. This is for development only.
export const usdaFoodProvider = new USDAFoodProvider(process.env.EXPO_PUBLIC_USDA_API_KEY ?? "");
