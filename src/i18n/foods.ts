import type { Language, TranslationKey } from "./translations";
import type { Food } from "../types/food";

export const localizedFoodNames: Record<string, Record<Language, string>> = {
  couscous: { en: "Tunisian couscous", fr: "Couscous tunisien", ar: "كسكسي تونسي", de: "Tunesischer Couscous" },
  lablabi: { en: "Lablabi", fr: "Lablabi", ar: "لبلابي", de: "Lablabi" },
  ojja: { en: "Ojja", fr: "Ojja", ar: "عجة", de: "Ojja" },
  brik: { en: "Brik", fr: "Brik", ar: "بريك", de: "Brik" },
  kafteji: { en: "Kafteji", fr: "Kafteji", ar: "كفتاجي", de: "Kafteji" },
  fricasse: { en: "Fricassé", fr: "Fricassé tunisien", ar: "فريكاسي", de: "Tunesisches Fricassé" },
  makarouna: { en: "Makarouna", fr: "Pâtes tunisiennes", ar: "مقرونة تونسية", de: "Tunesische Makarouna" },
  chorba: { en: "Chorba", fr: "Chorba", ar: "شوربة", de: "Chorba" },
  loubia: { en: "Loubia", fr: "Loubia", ar: "لوبيا", de: "Loubia" },
  mechouia: { en: "Mechouia salad", fr: "Salade méchouia", ar: "سلطة مشوية", de: "Mechouia-Salat" },
  shakshouka: { en: "Shakshouka", fr: "Shakshouka", ar: "شكشوكة", de: "Shakshouka" },
  kamounia: { en: "Kamounia", fr: "Kamounia", ar: "كمونية", de: "Kamounia" },
  bread: { en: "Tunisian bread", fr: "Pain tunisien", ar: "خبز تونسي", de: "Tunesisches Brot" },
  bambalouni: { en: "Bambalouni", fr: "Bambalouni", ar: "بمبالوني", de: "Bambalouni" },
  makroudh: { en: "Makroudh", fr: "Makroudh", ar: "مقروض", de: "Makroudh" },
  mlawi: { en: "Mlawi", fr: "Mlawi", ar: "ملاوي", de: "Mlawi" },
  chapati: { en: "Chapati Tunisien", fr: "Chapati tunisien", ar: "شاباتي تونسي", de: "Tunesisches Chapati" },
  harissa: { en: "Harissa", fr: "Harissa", ar: "هريسة", de: "Harissa" },
  "tuna-sandwich": { en: "Tuna sandwich", fr: "Sandwich au thon", ar: "ساندويتش بالتونة", de: "Thunfischsandwich" },
  "tunisian-salad": { en: "Tunisian salad", fr: "Salade tunisienne", ar: "سلطة تونسية", de: "Tunesischer Salat" },
  "rice-vegetables": { en: "Rice with vegetables", fr: "Riz aux légumes", ar: "أرز بالخضار", de: "Reis mit Gemüse" },
  "grilled-chicken": { en: "Grilled chicken", fr: "Poulet grillé", ar: "دجاج مشوي", de: "Gegrilltes Hähnchen" },
  "grilled-fish": { en: "Grilled fish", fr: "Poisson grillé", ar: "سمك مشوي", de: "Gegrillter Fisch" },
  eggs: { en: "Eggs", fr: "Œufs", ar: "بيض", de: "Eier" },
  yogurt: { en: "Yogurt", fr: "Yaourt nature", ar: "زبادي طبيعي", de: "Naturjoghurt" },
  dates: { en: "Dates", fr: "Dattes", ar: "تمر", de: "Datteln" },
  orange: { en: "Orange", fr: "Orange", ar: "برتقال", de: "Orange" },
  banana: { en: "Banana", fr: "Banane", ar: "موز", de: "Banane" },
  apple: { en: "Apple", fr: "Pomme", ar: "تفاح", de: "Apfel" },
};

export function foodName(id: string, language: Language, fallback: string) {
  return localizedFoodNames[id]?.[language] ?? fallback;
}

export function foodDescription(name: string, language: Language) {
  const descriptions: Record<Language, string> = {
    en: `A typical serving of ${name}. Nutrition varies with ingredients, preparation, and portion size.`,
    fr: `Une portion habituelle de ${name}. Les valeurs varient selon les ingrédients, la préparation et la portion.`,
    ar: `حصة معتادة من ${name}. تختلف القيم حسب المكونات وطريقة التحضير والكمية.`,
    de: `Eine übliche Portion ${name}. Nährwerte variieren je nach Zutaten, Zubereitung und Portionsgröße.`,
  };
  return descriptions[language];
}

export function servingLabel(food: Food, language: Language) {
  if (food.servingLabel) return food.servingLabel;
  const units: Record<string, Record<Language, string>> = {
    "g bowl": { en: "g bowl", fr: "g bol", ar: "غ وعاء", de: "g Schüssel" },
    "g plate": { en: "g plate", fr: "g assiette", ar: "غ طبق", de: "g Teller" },
    piece: { en: "piece", fr: "pièce", ar: "قطعة", de: "Stück" },
    "ml bowl": { en: "ml bowl", fr: "ml bol", ar: "مل وعاء", de: "ml Schüssel" },
    "g serving": { en: "g serving", fr: "g portion", ar: "غ حصة", de: "g Portion" },
    "g piece": { en: "g piece", fr: "g pièce", ar: "غ قطعة", de: "g Stück" },
    "g tbsp": { en: "g tbsp", fr: "g c. à soupe", ar: "غ ملعقة كبيرة", de: "g EL" },
    "g sandwich": { en: "g sandwich", fr: "g sandwich", ar: "غ شطيرة", de: "g Sandwich" },
    "large eggs": { en: "large eggs", fr: "gros œufs", ar: "بيضات كبيرة", de: "große Eier" },
    "g cup": { en: "g cup", fr: "g pot", ar: "غ كوب", de: "g Becher" },
    "g fruit": { en: "g fruit", fr: "g fruit", ar: "غ ثمرة", de: "g Frucht" },
  };
  return `${food.servingSize} ${units[food.servingUnit]?.[language] ?? food.servingUnit}`;
}

export function categoryKey(category: string): TranslationKey {
  const keys: Record<string, TranslationKey> = {
    "Breakfast": "category.breakfast", "Main dishes": "category.main", Couscous: "category.couscous",
    "Street food": "category.street", Salads: "category.salads", Desserts: "category.desserts",
    Drinks: "category.drinks", Ingredients: "category.ingredients",
  };
  return keys[category] ?? "category.ingredients";
}
