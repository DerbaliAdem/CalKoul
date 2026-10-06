import { useEffect, useState } from "react";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { foods } from "../../data/foods";
import { foodProvider } from "../../services/food/foodProvider";
import { nutritionForQuantity } from "../../services/nutrition/nutritionMath";
import type { Food } from "../../types/food";
import { categoryKey, foodDescription, foodName, servingLabel } from "../../i18n/foods";
import { customFoodService } from "../../features/customFoods/customFoodService";

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { language, isRTL, t } = useLanguage();
  const styles = createStyles(colors);
  const [remoteFood, setRemoteFood] = useState<Food | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    if (!id?.startsWith("usda-") && !id?.startsWith("custom-")) return;
    const controller = new AbortController();
    foodProvider.getFoodById(id, { signal: controller.signal })
      .then((food) => { if (!controller.signal.aborted) setRemoteFood(food); })
      .catch(() => { if (!controller.signal.aborted) setRemoteFood(null); })
      .finally(() => { if (!controller.signal.aborted) setLookupComplete(true); });
    return () => controller.abort();
  }, [id]);

  const food = foods.find((item) => item.id === id) ?? remoteFood;
  if (!food && (id?.startsWith("usda-") || id?.startsWith("custom-")) && !lookupComplete) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!food) return <View style={styles.page}><Text style={styles.heading}>{t("foodDetails.notFound")}</Text><Link href="/(tabs)/foods" style={styles.backLink}>{t("foodDetails.back")}</Link></View>;

  const name = foodName(food.id, language, food.name);
  const nutrition = nutritionForQuantity(food, quantity);
  const macros = [
    { key: "home.protein" as const, amount: nutrition.protein, color: colors.proteinTint },
    { key: "home.carbs" as const, amount: nutrition.carbs, color: colors.carbsTint },
    { key: "home.fat" as const, amount: nutrition.fat, color: colors.fatTint },
  ];

  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Stack.Screen options={{ title: name, headerShown: false }} />
    <Link href="/(tabs)/foods" style={styles.back}><Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={21} color={colors.text} /><Text style={styles.backText}>{t("foodDetails.back")}</Text></Link>
    <View style={styles.hero}><Text style={styles.emoji}>{food.emoji}</Text><Text style={styles.category}>{t(categoryKey(food.category))}{food.brand ? ` · ${food.brand}` : ""}</Text><Text style={styles.heading}>{name}</Text><Text style={styles.description}>{food.source === "custom" ? food.description : foodDescription(name, language)}</Text><Text style={styles.source}>{t(food.source === "external" || food.source === "usda" ? "foodDetails.sourceUsda" : food.source === "custom" ? "customFoods.source" : "foodDetails.sourceCalkoul")}</Text></View>
    <View style={styles.calorieCard}><Text style={styles.calorieLabel}>{t("foodDetails.energy")}</Text><Text style={styles.calories}>{nutrition.calories === null ? "—" : Math.round(nutrition.calories).toLocaleString(language)} <Text style={styles.kcal}>{t("common.kcal")}</Text></Text><Text style={styles.serving}>{quantity} × {servingLabel(food, language)}</Text></View>
    <Text style={styles.sectionTitle}>{t("foodDetails.nutrition")}</Text><View style={styles.macros}>{macros.map((macro) => <View key={macro.key} style={[styles.macroCard, { backgroundColor: macro.color }]}><Text style={styles.macroLabel}>{t(macro.key)}</Text><Text style={styles.macroValue}>{formatGrams(macro.amount, language, t("common.grams"))}</Text></View>)}</View>
    <View style={styles.optionalNutrition}>{([
      ["foodDetails.fiber", nutrition.fiber], ["foodDetails.sugar", nutrition.sugar], ["foodDetails.sodium", nutrition.sodium],
    ] as const).map(([label, amount]) => <View key={label} style={styles.optionalRow}><Text style={styles.optionalLabel}>{t(label)}</Text><Text style={styles.optionalValue}>{formatGrams(amount, language, label === "foodDetails.sodium" ? t("foodDetails.milligrams") : t("common.grams"))}</Text></View>)}</View>
    <Text style={styles.sectionTitle}>{t("foodDetails.serving")}</Text><View style={styles.quantityRow}><View style={styles.servingText}><Text style={styles.quantityTitle}>{t("foodDetails.portions")}</Text><Text style={styles.quantitySubtitle}>{servingLabel(food, language)} {t("foodDetails.each")}</Text></View><View style={styles.stepper}><Pressable accessibilityRole="button" accessibilityLabel={t("foodDetails.decrease")} onPress={() => setQuantity((value) => Math.max(0.5, value - 0.5))} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable accessibilityRole="button" accessibilityLabel={t("foodDetails.increase")} onPress={() => setQuantity((value) => value + 0.5)} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable></View></View>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={19} color={colors.primaryDark} /><Text style={styles.noticeText}>{t("foodDetails.warning")}</Text></View>
    {food.source === "custom" && <View style={styles.customActions}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/food/create", params: { id: food.id } })} style={styles.secondaryButton}><Text style={styles.secondaryText}>{t("customFoods.edit")}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { setDeleteError(false); setConfirmDelete(true); }} style={styles.deleteButton}><Text style={styles.deleteText}>{t("customFoods.delete")}</Text></Pressable></View>}
    {deleteError && <Text accessibilityRole="alert" style={styles.deleteError}>{t("customFoods.storageError")}</Text>}
    <Pressable style={styles.primaryButton} onPress={() => router.push({ pathname: "/meal/add", params: { foodId: food.id, quantity: String(quantity) } })}><Text style={styles.primaryButtonText}>{t("foodDetails.add")}</Text><Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={18} color={colors.white} /></Pressable>
    <Modal transparent visible={confirmDelete} animationType="fade" onRequestClose={() => setConfirmDelete(false)}><View style={styles.modalBackdrop}><View style={styles.confirmCard}><Text style={styles.confirmText}>{t("customFoods.deleteConfirm")}</Text><View style={styles.confirmActions}><Pressable accessibilityRole="button" onPress={() => setConfirmDelete(false)} style={styles.secondaryButton}><Text style={styles.secondaryText}>{t("common.cancel")}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { void customFoodService.delete(food.id).then(() => router.replace("/(tabs)/foods")).catch(() => { setConfirmDelete(false); setDeleteError(true); }); }} style={styles.deleteButton}><Text style={styles.deleteText}>{t("customFoods.delete")}</Text></Pressable></View></View></View></Modal>
  </ScrollView>;
}

function formatGrams(value: number | null, language: string, unit: string) {
  return value === null ? "—" : `${Math.round(value).toLocaleString(language)} ${unit}`;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }, content: { padding: SPACING.lg, paddingTop: 22, paddingBottom: 40 }, back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.lg }, backText: { color: colors.text, fontSize: 15, fontWeight: "600" }, hero: { alignItems: "center", paddingVertical: SPACING.lg }, emoji: { fontSize: 78 }, category: { color: colors.primaryDark, fontSize: 12, fontWeight: "700", marginTop: SPACING.md, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }, heading: { color: colors.text, fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 5 }, description: { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }, source: { color: colors.textSecondary, fontSize: 11, marginTop: 7 }, calorieCard: { backgroundColor: colors.primary, padding: SPACING.lg, borderRadius: RADIUS.xl, alignItems: "center", marginBottom: SPACING.xl }, calorieLabel: { color: colors.white, opacity: 0.9, fontSize: 14 }, calories: { color: colors.white, fontWeight: "800", fontSize: 42, marginTop: 5 }, kcal: { fontWeight: "600", fontSize: 18 }, serving: { color: colors.white, opacity: 0.9, fontSize: 13, marginTop: 2 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: SPACING.sm }, macros: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm }, macroCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md }, macroLabel: { color: colors.textSecondary, fontSize: 12 }, macroValue: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 4 }, optionalNutrition: { backgroundColor: colors.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1, borderColor: colors.border }, optionalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, optionalLabel: { color: colors.textSecondary, fontSize: 13 }, optionalValue: { color: colors.text, fontSize: 13, fontWeight: "700" }, quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }, servingText: { flex: 1 }, quantityTitle: { color: colors.text, fontSize: 15, fontWeight: "700" }, quantitySubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 }, stepper: { flexDirection: "row", alignItems: "center", gap: SPACING.sm }, stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, stepText: { fontSize: 22, fontWeight: "700", color: colors.primaryDark }, quantity: { minWidth: 26, textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" }, notice: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: SPACING.lg }, noticeText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 }, customActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }, secondaryButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md }, secondaryText: { color: colors.text, fontSize: 14, fontWeight: "700" }, deleteButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: colors.danger }, deleteText: { color: colors.white, fontSize: 14, fontWeight: "700" }, deleteError: { color: colors.danger, fontSize: 13, marginTop: SPACING.sm }, modalBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: SPACING.lg }, confirmCard: { width: "100%", backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: SPACING.lg }, confirmText: { color: colors.text, fontSize: 15, lineHeight: 22 }, confirmActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }, primaryButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: colors.primary, borderRadius: RADIUS.lg, minHeight: 54, marginTop: SPACING.lg }, primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" }, backLink: { color: colors.primaryDark, marginTop: SPACING.md },
}); }
