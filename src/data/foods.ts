import type { Food, FoodCategory } from "../types/food";
import { foodDescription, localizedFoodNames } from "../i18n/foods";

type FoodSeed = Omit<Food, "description" | "descriptionFr" | "descriptionAr" | "descriptionDe" | "nameFr" | "nameAr" | "nameDe" | "ingredients"> & {
  description?: string;
  descriptionFr?: string;
  descriptionAr?: string;
  descriptionDe?: string;
  nameFr?: string;
  nameAr?: string;
  nameDe?: string;
  ingredients?: string[];
};

const seeds: FoodSeed[] = [
  { id: "couscous", name: "Tunisian couscous", category: "Couscous", servingSize: 350, servingUnit: "g bowl", calories: 520, protein: 28, carbs: 64, fat: 17, emoji: "🍲" },
  { id: "lablabi", name: "Lablabi", category: "Breakfast", servingSize: 400, servingUnit: "g bowl", calories: 480, protein: 22, carbs: 58, fat: 18, emoji: "🥣" },
  { id: "ojja", name: "Ojja", category: "Main dishes", servingSize: 300, servingUnit: "g plate", calories: 390, protein: 23, carbs: 16, fat: 26, emoji: "🍳" },
  { id: "brik", name: "Brik", category: "Street food", servingSize: 130, servingUnit: "piece", calories: 330, protein: 13, carbs: 29, fat: 18, emoji: "🥟" },
  { id: "kafteji", name: "Kafteji", category: "Street food", servingSize: 300, servingUnit: "g plate", calories: 460, protein: 12, carbs: 50, fat: 24, emoji: "🍆" },
  { id: "fricasse", name: "Fricassé", category: "Street food", servingSize: 140, servingUnit: "piece", calories: 390, protein: 13, carbs: 43, fat: 18, emoji: "🥪" },
  { id: "makarouna", name: "Makarouna", nameFr: "Pâtes tunisiennes", nameAr: "مقرونة", category: "Main dishes", servingSize: 350, servingUnit: "g plate", calories: 560, protein: 25, carbs: 72, fat: 19, emoji: "🍝" },
  { id: "chorba", name: "Chorba", category: "Main dishes", servingSize: 300, servingUnit: "ml bowl", calories: 210, protein: 13, carbs: 25, fat: 7, emoji: "🍜" },
  { id: "loubia", name: "Loubia", category: "Main dishes", servingSize: 300, servingUnit: "g bowl", calories: 350, protein: 19, carbs: 48, fat: 9, emoji: "🫘" },
  { id: "mechouia", name: "Mechouia salad", category: "Salads", servingSize: 180, servingUnit: "g serving", calories: 160, protein: 6, carbs: 18, fat: 8, emoji: "🥗" },
  { id: "shakshouka", name: "Shakshouka", category: "Breakfast", servingSize: 280, servingUnit: "g serving", calories: 280, protein: 17, carbs: 15, fat: 18, emoji: "🍅" },
  { id: "kamounia", name: "Kamounia", category: "Main dishes", servingSize: 300, servingUnit: "g plate", calories: 430, protein: 34, carbs: 20, fat: 24, emoji: "🍛" },
  { id: "bread", name: "Tunisian bread", nameFr: "Pain tunisien", nameAr: "خبز تونسي", category: "Ingredients", servingSize: 60, servingUnit: "g piece", calories: 160, protein: 5, carbs: 31, fat: 2, emoji: "🥖" },
  { id: "bambalouni", name: "Bambalouni", category: "Desserts", servingSize: 100, servingUnit: "g piece", calories: 390, protein: 6, carbs: 52, fat: 17, emoji: "🍩" },
  { id: "makroudh", name: "Makroudh", category: "Desserts", servingSize: 50, servingUnit: "g piece", calories: 190, protein: 3, carbs: 29, fat: 7, emoji: "🍪" },
  { id: "mlawi", name: "Mlawi", category: "Street food", servingSize: 120, servingUnit: "g piece", calories: 330, protein: 8, carbs: 43, fat: 13, emoji: "🫓" },
  { id: "chapati", name: "Chapati Tunisien", category: "Street food", servingSize: 250, servingUnit: "g sandwich", calories: 560, protein: 25, carbs: 57, fat: 25, emoji: "🌯" },
  { id: "harissa", name: "Harissa", category: "Ingredients", servingSize: 15, servingUnit: "g tbsp", calories: 20, protein: 1, carbs: 3, fat: 1, emoji: "🌶️" },
  { id: "tuna-sandwich", name: "Tuna sandwich", category: "Street food", servingSize: 220, servingUnit: "g sandwich", calories: 430, protein: 24, carbs: 48, fat: 15, emoji: "🥪" },
  { id: "tunisian-salad", name: "Tunisian salad", category: "Salads", servingSize: 200, servingUnit: "g bowl", calories: 180, protein: 7, carbs: 17, fat: 10, emoji: "🥗" },
  { id: "rice-vegetables", name: "Rice with vegetables", category: "Main dishes", servingSize: 300, servingUnit: "g serving", calories: 360, protein: 9, carbs: 65, fat: 8, emoji: "🍚" },
  { id: "grilled-chicken", name: "Grilled chicken", category: "Main dishes", servingSize: 150, servingUnit: "g serving", calories: 250, protein: 38, carbs: 0, fat: 9, emoji: "🍗" },
  { id: "grilled-fish", name: "Grilled fish", category: "Main dishes", servingSize: 150, servingUnit: "g serving", calories: 220, protein: 34, carbs: 0, fat: 8, emoji: "🐟" },
  { id: "eggs", name: "Eggs", category: "Breakfast", servingSize: 2, servingUnit: "large eggs", calories: 144, protein: 13, carbs: 1, fat: 10, emoji: "🥚" },
  { id: "yogurt", name: "Yogurt", nameFr: "Yaourt nature", nameAr: "ياغورت طبيعي", category: "Breakfast", servingSize: 125, servingUnit: "g cup", calories: 80, protein: 5, carbs: 8, fat: 3, emoji: "🥛" },
  { id: "dates", name: "Dates", nameAr: "تمر", category: "Ingredients", servingSize: 40, servingUnit: "g serving", calories: 110, protein: 1, carbs: 30, fat: 0, emoji: "🌴" },
  { id: "orange", name: "Orange", nameFr: "Orange", nameAr: "برتقال", category: "Ingredients", servingSize: 130, servingUnit: "g fruit", calories: 62, protein: 1, carbs: 15, fat: 0, emoji: "🍊" },
  { id: "banana", name: "Banana", nameFr: "Banane", nameAr: "موز", category: "Ingredients", servingSize: 120, servingUnit: "g fruit", calories: 105, protein: 1, carbs: 27, fat: 0, emoji: "🍌" },
  { id: "apple", name: "Apple", nameFr: "Pomme", nameAr: "تفاح", category: "Ingredients", servingSize: 180, servingUnit: "g fruit", calories: 95, protein: 1, carbs: 25, fat: 0, emoji: "🍎" },
];

export const foods: Food[] = seeds.map((food) => ({
  ...food,
  source: "calkoul",
  sourceId: food.id,
  isLocal: true,
  nameFr: localizedFoodNames[food.id]?.fr ?? food.nameFr ?? food.name,
  nameAr: localizedFoodNames[food.id]?.ar ?? food.nameAr ?? food.name,
  nameDe: localizedFoodNames[food.id]?.de ?? food.nameDe ?? food.name,
  description: foodDescription(localizedFoodNames[food.id]?.en ?? food.name, "en"),
  descriptionFr: foodDescription(localizedFoodNames[food.id]?.fr ?? food.name, "fr"),
  descriptionAr: foodDescription(localizedFoodNames[food.id]?.ar ?? food.name, "ar"),
  descriptionDe: foodDescription(localizedFoodNames[food.id]?.de ?? food.name, "de"),
  ingredients: food.ingredients ?? [],
}));

export const foodCategories: ("All" | FoodCategory)[] = ["All", "Breakfast", "Main dishes", "Couscous", "Street food", "Salads", "Desserts", "Drinks", "Ingredients"];
