import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { foods } from "../../data/foods";
import { foodProvider } from "../../services/food/foodProvider";
import type { Food } from "../../types/food";
import { foodName, servingLabel } from "../../i18n/foods";
import { useMeals } from "../../features/meals/MealContext";
import type { MealType } from "../../types/meal";
import type { TranslationKey } from "../../i18n/translations";
import { nutritionForQuantity } from "../../services/nutrition/nutritionMath";

const mealTypes: { name: MealType; label: TranslationKey; icon: "sunny-outline" | "partly-sunny-outline" | "moon-outline" | "cafe-outline" }[] = [
  { name: "Breakfast", label: "meal.breakfast", icon: "sunny-outline" }, { name: "Lunch", label: "meal.lunch", icon: "partly-sunny-outline" },
  { name: "Dinner", label: "meal.dinner", icon: "moon-outline" }, { name: "Snack", label: "meal.snack", icon: "cafe-outline" },
];

export default function AddMealScreen() {
  const { foodId, quantity: quantityParam } = useLocalSearchParams<{ foodId: string; quantity?: string }>();
  const router = useRouter();
  const { addFood } = useMeals();
  const { colors } = useTheme();
  const { language, isRTL, t } = useLanguage();
  const styles = createStyles(colors);
  const [remoteFoodResult, setRemoteFoodResult] = useState<{ id: string; food: Food | null } | null>(null);
  useEffect(() => {
    if (!foodId?.startsWith("usda-") && !foodId?.startsWith("custom-")) return;
    const controller = new AbortController();
    foodProvider.getFoodById(foodId, { signal: controller.signal }).then((food) => { if (!controller.signal.aborted) setRemoteFoodResult({ id: foodId, food }); }).catch(() => { if (!controller.signal.aborted) setRemoteFoodResult({ id: foodId, food: null }); });
    return () => controller.abort();
  }, [foodId]);
  const needsRemoteLookup = Boolean(foodId?.startsWith("usda-") || foodId?.startsWith("custom-"));
  const food = foods.find((item) => item.id === foodId) ?? (remoteFoodResult?.id === foodId ? remoteFoodResult.food : null);
  const quantity = Math.max(Number(quantityParam) || 1, 0.5);
  const [meal, setMeal] = useState<MealType>("Breakfast");
  if (!food && needsRemoteLookup && remoteFoodResult?.id !== foodId) return <View style={[styles.page, styles.loading]}><ActivityIndicator color={colors.primary} /></View>;
  if (!food) return <View style={styles.page}><Text style={styles.title}>{t("meal.missing")}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>{t("common.back")}</Text></Pressable></View>;
  const name = foodName(food.id, language, food.name);
  const nutrition = nutritionForQuantity(food, quantity);

  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Stack.Screen options={{ title: t("foodDetails.add"), headerShown: false }} />
    <Pressable onPress={() => router.back()} style={styles.backRow}><Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={21} color={colors.text} /><Text style={styles.backLabel}>{t("meal.backDetails")}</Text></Pressable>
    <Text style={styles.eyebrow}>{t("meal.eyebrow")}</Text><Text style={styles.title}>{t("meal.choose")}</Text><Text style={styles.subtitle}>{t("meal.select")}</Text>
    <View style={styles.foodCard}><Text style={styles.foodEmoji}>{food.emoji}</Text><View style={styles.foodText}><Text style={styles.foodName}>{name}</Text><Text style={styles.foodMeta}>{quantity} × {servingLabel(food, language)}</Text></View><Text style={styles.foodCalories}>{nutrition.calories === null ? "—" : Math.round(nutrition.calories).toLocaleString(language)} kcal</Text></View>
    <View style={styles.meals}>{mealTypes.map((item) => <Pressable key={item.name} onPress={() => setMeal(item.name)} accessibilityRole="radio" accessibilityState={{ checked: meal === item.name }} style={[styles.mealOption, meal === item.name && styles.mealSelected]}><View style={[styles.mealIconBox, meal === item.name && styles.mealIconSelected]}><Ionicons name={item.icon} size={21} color={meal === item.name ? colors.white : colors.primaryDark} /></View><Text style={[styles.mealName, meal === item.name && styles.mealNameSelected]}>{t(item.label)}</Text><View style={[styles.radio, meal === item.name && styles.radioSelected]}>{meal === item.name && <View style={styles.radioDot} />}</View></Pressable>)}</View>
    <View style={styles.summary}><Text style={styles.summaryTitle}>{t("meal.summary")}</Text><View style={styles.summaryLine}><Text style={styles.summaryLabel}>{t("meal.calories")}</Text><Text style={styles.summaryValue}>{nutrition.calories === null ? "—" : `${Math.round(nutrition.calories).toLocaleString(language)} kcal`}</Text></View><View style={styles.summaryLine}><Text style={styles.summaryLabel}>{t("meal.macros")}</Text><Text style={styles.summaryValue}>{nutrition.protein === null ? "—" : Math.round(nutrition.protein)} · {nutrition.carbs === null ? "—" : Math.round(nutrition.carbs)} · {nutrition.fat === null ? "—" : Math.round(nutrition.fat)} g</Text></View></View>
    <Pressable accessibilityRole="button" onPress={() => { addFood(food, quantity, meal); router.replace("/(tabs)" as Href); }} style={styles.confirm}><Text style={styles.confirmText}>{t("meal.confirm", { meal: t(mealTypes.find((item) => item.name === meal)!.label).toLocaleLowerCase(language) })}</Text><Ionicons name={isRTL ? "checkmark" : "checkmark"} size={20} color={colors.white} /></Pressable>
  </ScrollView>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, loading: { alignItems: "center", justifyContent: "center" }, content: { padding: SPACING.lg, paddingTop: 22, paddingBottom: 40 }, backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.lg }, backLabel: { fontSize: 15, color: colors.text, fontWeight: "600" }, eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { color: colors.text, fontSize: 29, fontWeight: "800", marginTop: 5 }, subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 6 }, foodCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg, borderWidth: 1, borderColor: colors.border }, foodEmoji: { fontSize: 34 }, foodText: { flex: 1 }, foodName: { color: colors.text, fontSize: 15, fontWeight: "700" }, foodMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 }, foodCalories: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 }, meals: { gap: SPACING.sm, marginTop: SPACING.lg }, mealOption: { flexDirection: "row", alignItems: "center", gap: SPACING.md, minHeight: 66, paddingHorizontal: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border }, mealSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, mealIconBox: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primaryLight }, mealIconSelected: { backgroundColor: colors.primary }, mealName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "600" }, mealNameSelected: { color: colors.primaryDark }, radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, radioSelected: { borderColor: colors.primary }, radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary }, summary: { backgroundColor: colors.surface, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, marginTop: SPACING.lg }, summaryTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: SPACING.sm }, summaryLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }, summaryLabel: { color: colors.textSecondary, fontSize: 13 }, summaryValue: { color: colors.text, fontSize: 13, fontWeight: "700" }, confirm: { backgroundColor: colors.primary, minHeight: 54, borderRadius: RADIUS.lg, marginTop: SPACING.lg, flexDirection: "row", gap: 10, justifyContent: "center", alignItems: "center" }, confirmText: { color: colors.white, fontSize: 16, fontWeight: "700" }, back: { color: colors.primaryDark, marginTop: SPACING.md } }); }
