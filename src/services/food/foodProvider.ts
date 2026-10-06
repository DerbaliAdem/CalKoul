import { foods as localFoods } from "../../data/foods";
import { localizedFoodNames } from "../../i18n/foods";
import type { Food } from "../../types/food";
import type { FoodProvider, FoodSearchOptions, FoodSearchResult } from "./foodTypes";
import { usdaFoodProvider } from "./foodApi";
import { customFoodService } from "../../features/customFoods/customFoodService";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export class LocalFoodProvider implements FoodProvider {
  async searchFoods(query: string, options: FoodSearchOptions = {}): Promise<FoodSearchResult> {
    const term = normalize(query.trim());
    const matches = localFoods.filter((food) => {
      const names = [food.name, food.nameFr, food.nameAr, localizedFoodNames[food.id]?.en, localizedFoodNames[food.id]?.fr, localizedFoodNames[food.id]?.ar, localizedFoodNames[food.id]?.de];
      return !term || names.some((name) => name && normalize(name).includes(term));
    });
    return { foods: matches, page: options.page ?? 1, pageSize: options.pageSize ?? matches.length, total: matches.length, hasMore: false };
  }

  async getFoodById(id: string): Promise<Food | null> {
    return localFoods.find((food) => food.id === id) ?? null;
  }
}

export class CustomFoodProvider implements FoodProvider {
  async searchFoods(query: string, options: FoodSearchOptions = {}): Promise<FoodSearchResult> {
    const matches = await customFoodService.list(query);
    return { foods: matches, page: options.page ?? 1, pageSize: options.pageSize ?? matches.length, total: matches.length, hasMore: false };
  }

  async getFoodById(id: string): Promise<Food | null> {
    return customFoodService.getById(id);
  }
}

export class CompositeFoodProvider implements FoodProvider {
  constructor(private readonly local: FoodProvider, private readonly remote: FoodProvider, private readonly custom: FoodProvider) {}

  async searchFoods(query: string, options: FoodSearchOptions = {}): Promise<FoodSearchResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const local = await this.local.searchFoods(query, { page: 1, pageSize: Number.MAX_SAFE_INTEGER });
    const custom = await this.custom.searchFoods(query, { page: 1, pageSize: Number.MAX_SAFE_INTEGER });
    const preferredFoods = [...local.foods, ...custom.foods.filter((food) => !local.foods.some((localFood) => normalize(localFood.name) === normalize(food.name)))];
    if (query.trim().length < 2) return { ...local, foods: preferredFoods, total: preferredFoods.length, page, pageSize, hasMore: false };

    try {
      const remote = await this.remote.searchFoods(query, { ...options, page, pageSize });
      const preferredNames = new Set(preferredFoods.map((food) => normalize(food.name)));
      const uniqueRemote = remote.foods.filter((food) => !preferredNames.has(normalize(food.name)));
      const merged = page === 1 ? [...preferredFoods, ...uniqueRemote] : uniqueRemote;
      return { foods: merged, page, pageSize, total: remote.total === null ? null : remote.total + preferredFoods.length, hasMore: remote.hasMore };
    } catch (error) {
      return { ...local, foods: preferredFoods, total: preferredFoods.length, page, pageSize, hasMore: false, remoteStatus: error instanceof Error && error.message.includes("API key is not configured") ? "notConfigured" : "unavailable" };
    }
  }

  async getFoodById(id: string, options: Pick<FoodSearchOptions, "signal"> = {}): Promise<Food | null> {
    return await this.local.getFoodById(id, options) ?? await this.custom.getFoodById(id, options) ?? this.remote.getFoodById(id, options);
  }
}

export const localFoodProvider = new LocalFoodProvider();
export const customFoodsProvider = new CustomFoodProvider();
export const foodProvider = new CompositeFoodProvider(localFoodProvider, usdaFoodProvider, customFoodsProvider);
