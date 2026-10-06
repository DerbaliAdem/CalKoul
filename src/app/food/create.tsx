import { useEffect, useState } from "react";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { foodCategories } from "../../data/foods";
import { categoryKey } from "../../i18n/foods";
import type { TranslationKey } from "../../i18n/translations";
import { customFoodService, validateCustomFoodDraft } from "../../features/customFoods/customFoodService";
import type { CustomFoodDraft } from "../../features/customFoods/customFoodTypes";
import type { Food, FoodCategory } from "../../types/food";

type FormState = { name: string; category: FoodCategory; servingSize: string; servingUnit: string; calories: string; protein: string; carbs: string; fat: string; fiber: string; sugar: string; sodium: string; notes: string };
const blankForm: FormState = { name: "", category: "Ingredients", servingSize: "100", servingUnit: "g", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "", notes: "" };
const fields: { key: Exclude<keyof FormState, "category">; label: TranslationKey; numeric?: boolean; multiline?: boolean }[] = [
  { key: "name", label: "customFoods.name" }, { key: "servingSize", label: "customFoods.servingSize", numeric: true }, { key: "servingUnit", label: "customFoods.servingUnit" },
  { key: "calories", label: "customFoods.calories", numeric: true }, { key: "protein", label: "customFoods.protein", numeric: true }, { key: "carbs", label: "customFoods.carbs", numeric: true },
  { key: "fat", label: "customFoods.fat", numeric: true }, { key: "fiber", label: "customFoods.fiber", numeric: true }, { key: "sugar", label: "customFoods.sugar", numeric: true },
  { key: "sodium", label: "customFoods.sodium", numeric: true }, { key: "notes", label: "customFoods.notes", multiline: true },
];

export default function CustomFoodFormScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const id = typeof idParam === "string" ? idParam : undefined;
  const router = useRouter();
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const styles = createStyles(colors, isRTL);
  const [form, setForm] = useState<FormState>(blankForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"validation" | "storage" | "missing" | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void customFoodService.getById(id).then((food) => {
      if (!mounted) return;
      if (!food) { setError("missing"); return; }
      setForm(foodToForm(food));
    }).catch(() => { if (mounted) setError("storage"); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    const draft = formToDraft(form);
    if (validateCustomFoodDraft(draft)) { setError("validation"); return; }
    setSaving(true);
    setError(null);
    try {
      const food = await customFoodService.save(draft, id);
      router.replace({ pathname: "/food/[id]", params: { id: food.id } });
    } catch {
      setError("storage");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><Text style={styles.body}>{t("common.loading")}</Text></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: t(id ? "customFoods.editTitle" : "customFoods.createTitle"), headerShown: false }} />
    <Link href="/(tabs)/foods" style={styles.back}>{t("common.back")}</Link>
    <Text style={styles.title}>{t(id ? "customFoods.editTitle" : "customFoods.createTitle")}</Text>
    <Text style={styles.subtitle}>{t("customFoods.validation")}</Text>
    <Text style={styles.label}>{t("customFoods.category")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{foodCategories.filter((item) => item !== "All").map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: form.category === item }} onPress={() => setForm((current) => ({ ...current, category: item }))} style={[styles.category, form.category === item && styles.categorySelected]}><Text style={[styles.categoryText, form.category === item && styles.categoryTextSelected]}>{t(categoryKey(item))}</Text></Pressable>)}</ScrollView>
    {fields.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{t(field.label)}</Text><TextInput accessibilityLabel={t(field.label)} value={form[field.key]} onChangeText={(value) => update(field.key, value)} keyboardType={field.numeric ? "decimal-pad" : "default"} multiline={field.multiline} maxLength={field.key === "name" ? 80 : field.key === "servingUnit" ? 30 : undefined} style={[styles.input, field.multiline && styles.multiline]} /></View>)}
    {error && <Text accessibilityRole="alert" style={styles.error}>{t(error === "storage" ? "customFoods.storageError" : error === "missing" ? "customFoods.notFound" : "customFoods.validation")}</Text>}
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}><Text style={styles.saveText}>{t(saving ? "common.saving" : "customFoods.save")}</Text></Pressable>
  </ScrollView>;
}

function foodToForm(food: Food): FormState {
  return { name: food.name, category: food.category, servingSize: String(food.servingSize), servingUnit: food.servingUnit, calories: food.calories === null ? "" : String(food.calories), protein: food.protein === null ? "" : String(food.protein), carbs: food.carbs === null ? "" : String(food.carbs), fat: food.fat === null ? "" : String(food.fat), fiber: food.fiber === null || food.fiber === undefined ? "" : String(food.fiber), sugar: food.sugar === null || food.sugar === undefined ? "" : String(food.sugar), sodium: food.sodium === null || food.sodium === undefined ? "" : String(food.sodium), notes: food.description };
}

function optionalNumber(value: string): number | null { return value.trim() === "" ? null : Number(value); }
function formToDraft(form: FormState): CustomFoodDraft {
  return { name: form.name, category: form.category, servingSize: Number(form.servingSize), servingUnit: form.servingUnit, calories: Number(form.calories), protein: optionalNumber(form.protein), carbs: optionalNumber(form.carbs), fat: optionalNumber(form.fat), fiber: optionalNumber(form.fiber), sugar: optionalNumber(form.sugar), sodium: optionalNumber(form.sodium), notes: form.notes, image: null };
}

function createStyles(colors: ColorPalette, isRTL: boolean) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }, content: { padding: SPACING.lg, paddingTop: 24, paddingBottom: 40 }, back: { color: colors.primaryDark, fontSize: 14, fontWeight: "700", marginBottom: SPACING.lg, textAlign: isRTL ? "right" : "left" }, title: { color: colors.text, fontSize: 28, fontWeight: "800" }, subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: SPACING.lg }, categories: { gap: SPACING.sm, paddingVertical: SPACING.sm, marginBottom: SPACING.md }, category: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full }, categorySelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, categoryText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" }, categoryTextSelected: { color: colors.primaryDark }, field: { marginBottom: SPACING.md }, label: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: SPACING.xs }, input: { minHeight: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: SPACING.md, color: colors.text, fontSize: 15, textAlign: isRTL ? "right" : "left" }, multiline: { minHeight: 88, paddingTop: SPACING.sm, textAlignVertical: "top" }, error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginBottom: SPACING.md }, saveButton: { minHeight: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderRadius: RADIUS.lg, marginTop: SPACING.md }, disabled: { opacity: 0.6 }, saveText: { color: colors.white, fontSize: 15, fontWeight: "800" }, body: { color: colors.textSecondary },
}); }
