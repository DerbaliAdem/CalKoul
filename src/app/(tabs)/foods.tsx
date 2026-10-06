import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { foodCategories } from "../../data/foods";
import { categoryKey, foodName, servingLabel } from "../../i18n/foods";
import { foodProvider } from "../../services/food/foodProvider";
import type { Food } from "../../types/food";
import { AnimatedPressable } from "../../components/ui/Motion";

export default function FoodsScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof foodCategories)[number]>("All");
  const [result, setResult] = useState<{ query: string; foods: Food[]; page: number; hasMore: boolean; remoteStatus?: "unavailable" | "notConfigured" } | null>(null);
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(colors);
  const search = query.trim();

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoadingQuery(search);
      foodProvider.searchFoods(search, { page: 1, pageSize: 20, signal: controller.signal })
        .then((next) => setResult({ query: search, foods: next.foods, page: next.page, hasMore: next.hasMore, remoteStatus: next.remoteStatus }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ query: search, foods: [], page: 1, hasMore: false, remoteStatus: error instanceof Error && error.message.includes("API key is not configured") ? "notConfigured" : "unavailable" });
        })
        .finally(() => { if (!controller.signal.aborted) setLoadingQuery(null); });
    }, search.length >= 2 ? 400 : 0);

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [search, retry]);

  const results = (result?.query === search ? result.foods : []).filter((food) => category === "All" || food.category === category);
  const loading = search.length >= 2 && loadingQuery === search;
  const remoteStatus = result?.query === search ? result.remoteStatus : undefined;

  const loadMore = async () => {
    if (!result?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await foodProvider.searchFoods(search, { page: result.page + 1, pageSize: 20 });
      setResult((current) => current?.query === search ? { ...current, foods: [...current.foods, ...next.foods], page: next.page, hasMore: next.hasMore, remoteStatus: next.remoteStatus } : current);
    } catch {
      setResult((current) => current?.query === search ? { ...current, remoteStatus: "unavailable" } : current);
    } finally {
      setLoadingMore(false);
    }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>{t("foods.eyebrow")}</Text><Text style={styles.title}>{t("foods.title")}</Text><Text style={styles.subtitle}>{t("foods.subtitle")}</Text>
    <Link href="/food/create" style={styles.createFood}><Ionicons name="add-circle-outline" size={19} color={colors.primaryDark} /><Text style={styles.createFoodText}>{t("customFoods.addMyFood")}</Text></Link>
    <View style={styles.search}><Ionicons name="search-outline" size={21} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder={t("foods.search")} placeholderTextColor={colors.textSecondary} style={styles.searchInput} returnKeyType="search" accessibilityLabel={t("foods.accessibilitySearch")} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{foodCategories.map((item) => <AnimatedPressable key={item} onPress={() => setCategory(item)} accessibilityRole="button" accessibilityState={{ selected: category === item }} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item === "All" ? t("foods.all") : t(categoryKey(item))}</Text></AnimatedPressable>)}</ScrollView>
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{category === "All" ? t("foods.popular") : t(categoryKey(category))}</Text><Text style={styles.count}>{t("foods.count", { count: results.length })}</Text></View>
    {loading && <View accessibilityRole="progressbar" style={styles.loadingGroup}><View style={styles.status}><ActivityIndicator color={colors.primary} /><Text style={styles.statusText}>{t("foods.loadingRemote")}</Text></View><View style={styles.skeletonCard}><View style={styles.skeletonImage} /><View style={styles.skeletonLines}><View style={styles.skeletonLine} /><View style={[styles.skeletonLine, styles.skeletonShort]} /><View style={[styles.skeletonLine, styles.skeletonMedium]} /></View></View><View style={styles.skeletonCard}><View style={styles.skeletonImage} /><View style={styles.skeletonLines}><View style={styles.skeletonLine} /><View style={[styles.skeletonLine, styles.skeletonShort]} /><View style={[styles.skeletonLine, styles.skeletonMedium]} /></View></View></View>}
    {remoteStatus && <View style={styles.errorBox}><Text style={styles.errorText}>{t(remoteStatus === "notConfigured" ? "foods.apiKeyMissing" : "foods.remoteError")}</Text><Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}><Text style={styles.retry}>{t("foods.retrySearch")}</Text></Pressable></View>}
    {!search && <Text style={styles.hint}>{t("foods.searchHint")}</Text>}
    {results.length ? results.map((food) => <Link key={food.id} href={{ pathname: "/food/[id]", params: { id: food.id } }} style={styles.foodCard}>
      <View style={styles.foodImage}><Text style={styles.foodEmoji}>{food.emoji}</Text></View><View style={styles.foodInfo}><Text style={styles.foodName}>{foodName(food.id, language, food.name)}</Text>{food.brand ? <Text style={styles.foodServing}>{food.brand}</Text> : null}<Text style={styles.foodServing}>{servingLabel(food, language)}</Text><View style={styles.macroLine}><Text style={styles.foodCalories}>{food.availableNutrients?.calories === false || food.calories === null ? "—" : Math.round(food.calories)} kcal</Text><Text style={styles.macro}>P {food.availableNutrients?.protein === false || food.protein === null ? "—" : Math.round(food.protein)}g</Text><Text style={styles.macro}>C {food.availableNutrients?.carbs === false || food.carbs === null ? "—" : Math.round(food.carbs)}g</Text><Text style={styles.macro}>F {food.availableNutrients?.fat === false || food.fat === null ? "—" : Math.round(food.fat)}g</Text></View>{food.source === "external" || food.source === "usda" ? <Text style={styles.source}>{t("foods.sourceUsda")}</Text> : food.source === "custom" ? <Text style={styles.source}>{t("foods.sourceCustom")}</Text> : null}</View><Ionicons name={language === "ar" ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
    </Link>) : !loading && <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.textSecondary} /><Text style={styles.emptyTitle}>{t("foods.noResults")}</Text><Text style={styles.emptyText}>{t("foods.tryAnother")}</Text></View>}
    {result?.query === search && result.hasMore && <Pressable accessibilityRole="button" disabled={loadingMore} onPress={loadMore} style={styles.loadMore}>{loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.retry}>{t("foods.loadMore")}</Text>}</Pressable>}
    <Text style={styles.disclaimer}>{t("foods.disclaimer")}</Text>
  </ScrollView>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: SPACING.lg, paddingTop: 24, paddingBottom: 40 }, eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 5 }, subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6 }, createFood: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.xs, backgroundColor: colors.primaryLight, borderRadius: RADIUS.md, marginTop: SPACING.md }, createFoodText: { color: colors.primaryDark, fontSize: 14, fontWeight: "700" },
  search: { height: 52, backgroundColor: colors.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, marginTop: SPACING.lg }, searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 }, categories: { gap: SPACING.sm, paddingVertical: SPACING.lg }, category: { minHeight: 40, justifyContent: "center", paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, categoryText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" }, categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary }, categoryTextActive: { color: colors.white }, sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }, sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text }, count: { color: colors.textSecondary, fontSize: 12 },
  foodCard: { ...SHADOWS.card, flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.border, gap: SPACING.sm }, foodImage: { width: 58, height: 58, borderRadius: RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, foodEmoji: { fontSize: 30 }, foodInfo: { flex: 1 }, foodName: { fontSize: 15, fontWeight: "700", color: colors.text }, foodServing: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }, macroLine: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }, foodCalories: { fontSize: 12, color: colors.primaryDark, fontWeight: "700" }, macro: { fontSize: 11, color: colors.textSecondary }, source: { color: colors.textSecondary, fontSize: 10, marginTop: 4 }, loadingGroup: { gap: SPACING.sm, marginBottom: SPACING.md }, skeletonCard: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.sm, borderRadius: RADIUS.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, skeletonImage: { width: 58, height: 58, borderRadius: RADIUS.md, backgroundColor: colors.surfaceSecondary }, skeletonLines: { flex: 1, gap: SPACING.sm }, skeletonLine: { width: "78%", height: 11, borderRadius: RADIUS.full, backgroundColor: colors.surfaceSecondary }, skeletonShort: { width: "46%" }, skeletonMedium: { width: "64%" }, status: { flexDirection: "row", gap: 9, alignItems: "center", marginBottom: SPACING.xs }, statusText: { color: colors.textSecondary, fontSize: 13 }, errorBox: { padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.md }, errorText: { color: colors.textSecondary, fontSize: 13 }, retry: { color: colors.primaryDark, fontWeight: "700", marginTop: 8 }, loadMore: { alignItems: "center", padding: SPACING.md }, hint: { color: colors.textSecondary, fontSize: 12, marginBottom: SPACING.md }, empty: { alignItems: "center", padding: SPACING.xl, backgroundColor: colors.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.border }, emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 8 }, emptyText: { color: colors.textSecondary, fontSize: 13, marginTop: 4 }, disclaimer: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: SPACING.lg },
}); }
