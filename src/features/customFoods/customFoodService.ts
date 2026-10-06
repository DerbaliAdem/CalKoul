import type { FoodCategory } from "../../types/food";
import type { CustomFood, CustomFoodDraft } from "./customFoodTypes";
import { loadCustomFoods, persistCustomFoods } from "./customFoodStorage";

const categories: FoodCategory[] = ["Breakfast", "Main dishes", "Couscous", "Street food", "Salads", "Desserts", "Drinks", "Ingredients"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function validateCustomFoodDraft(draft: CustomFoodDraft): string | null {
  if (!draft.name.trim() || draft.name.trim().length > 80) return "name";
  if (!categories.includes(draft.category)) return "category";
  if (!Number.isFinite(draft.servingSize) || draft.servingSize <= 0 || draft.servingSize > 10000) return "servingSize";
  if (!draft.servingUnit.trim() || draft.servingUnit.trim().length > 30) return "servingUnit";
  if (!Number.isFinite(draft.calories) || draft.calories < 0 || draft.calories > 10000) return "calories";
  for (const value of [draft.protein, draft.carbs, draft.fat, draft.fiber, draft.sugar, draft.sodium]) {
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10000)) return "nutrition";
  }
  return null;
}

export function createCustomFood(draft: CustomFoodDraft, id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`): CustomFood {
  const name = draft.name.trim();
  const description = draft.notes.trim();
  const food: CustomFood = {
    id, name, nameFr: name, nameAr: name, nameDe: name,
    category: draft.category,
    description, descriptionFr: description, descriptionAr: description, descriptionDe: description,
    servingSize: draft.servingSize,
    servingUnit: draft.servingUnit.trim(),
    servingLabel: `${draft.servingSize} ${draft.servingUnit.trim()}`,
    calories: draft.calories,
    protein: draft.protein,
    carbs: draft.carbs,
    fat: draft.fat,
    fiber: draft.fiber,
    sugar: draft.sugar,
    sodium: draft.sodium,
    image: draft.image,
    source: "custom",
    sourceId: id,
    isLocal: true,
    availableNutrients: {
      calories: true,
      protein: draft.protein !== null,
      carbs: draft.carbs !== null,
      fat: draft.fat !== null,
    },
    ingredients: [],
    emoji: "🍽️",
  };
  return food;
}

class CustomFoodService {
  private foods: CustomFood[] | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<CustomFood[]> {
    if (this.foods === null) this.foods = await loadCustomFoods();
    return this.foods;
  }

  async list(query = ""): Promise<CustomFood[]> {
    const foods = await this.read();
    const term = normalize(query);
    if (!term) return [...foods];
    return foods.filter((food) => normalize(`${food.name} ${food.description}`).includes(term));
  }

  async getById(id: string): Promise<CustomFood | null> {
    return (await this.read()).find((food) => food.id === id) ?? null;
  }

  async save(draft: CustomFoodDraft, id?: string): Promise<CustomFood> {
    const issue = validateCustomFoodDraft(draft);
    if (issue) throw new Error(`Invalid custom food: ${issue}`);
    const food = createCustomFood(draft, id);
    const current = await this.read();
    const next = id ? current.map((item) => item.id === id ? food : item) : [...current, food];
    if (id && !current.some((item) => item.id === id)) throw new Error("Custom food was not found.");
    await this.enqueue(next);
    return food;
  }

  async delete(id: string): Promise<void> {
    const current = await this.read();
    const next = current.filter((food) => food.id !== id);
    if (next.length === current.length) return;
    await this.enqueue(next);
  }

  private async enqueue(next: CustomFood[]): Promise<void> {
    const write = this.queue.then(() => persistCustomFoods(next));
    this.queue = write.catch(() => undefined);
    await write;
    this.foods = next;
  }
}

export const customFoodService = new CustomFoodService();
