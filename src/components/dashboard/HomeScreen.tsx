import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { useMeals } from "../../features/meals/MealContext";
import type { ColorPalette } from "../../constants/colors";
import type { TranslationKey } from "../../i18n/translations";
import { foodName } from "../../i18n/foods";
import { useProfile } from "../../features/profile/ProfileContext";
import { calculateNutritionTargets } from "../../services/nutrition/nutritionCalculator";
import { sumNutrition } from "../../services/nutrition/nutritionMath";
import { useActivity } from "../../features/activity/ActivityContext";
import CalkoulLogo from "../branding/CalkoulLogo";
import { AnimatedPressable, Entrance } from "../ui/Motion";
import ProgressBar from "../ui/ProgressBar";

const mealKeys: { meal: "Breakfast" | "Lunch" | "Dinner" | "Snack"; label: TranslationKey; icon: "sunny-outline" | "restaurant-outline" | "moon-outline" | "nutrition-outline" }[] = [
  { meal: "Breakfast", label: "meal.breakfast", icon: "sunny-outline" }, { meal: "Lunch", label: "meal.lunch", icon: "restaurant-outline" },
  { meal: "Dinner", label: "meal.dinner", icon: "moon-outline" }, { meal: "Snack", label: "meal.snack", icon: "nutrition-outline" },
];

export default function HomeScreen() {
  const { todaysEntries: entries, removeFood, persistenceError } = useMeals();
  const { profile } = useProfile();
  const { today: activityToday, stepGoal, permission, permissionCanAskAgain, requestPermission, setStepGoal } = useActivity();
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const styles = createStyles(colors);
  const totals = sumNutrition(entries.map((entry) => entry.nutrition));
  const targets = calculateNutritionTargets(profile);
  const target = targets.available ? targets.dailyCalories : null;
  const targetReason = targets.available ? null : targets.reason;
  const hour = new Date().getHours();
  const greetingKey: TranslationKey = hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening";
  const calories = totals.calories;
  const targetNotice = targetReason === "adultOnly" ? "home.targetAdultsOnly" : targetReason === "belowSafeFloor" ? "home.targetBelowFloor" : "home.targetUnavailable";
  const [editingStepGoal, setEditingStepGoal] = useState(false);
  const [stepGoalDraft, setStepGoalDraft] = useState(String(stepGoal));
  const [stepGoalError, setStepGoalError] = useState(false);
  const currentSteps = activityToday?.steps ?? 0;
  const distanceKm = activityToday ? activityToday.distanceMeters / 1000 : 0;
  const saveStepGoal = async () => {
    const saved = await setStepGoal(Number(stepGoalDraft));
    if (saved) { setEditingStepGoal(false); setStepGoalError(false); }
    else setStepGoalError(true);
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Entrance><View style={styles.header}><View style={styles.brandGroup}><CalkoulLogo size="small" /><Text style={styles.greeting}>{t(greetingKey)}{profile.name.trim() ? `, ${profile.name.trim()}` : ""}</Text></View><View style={styles.headerActions}><Link href="/(tabs)/assistant" accessibilityLabel={t("assistant.title")} style={styles.assistantButton}><Ionicons name="sparkles-outline" size={21} color={colors.primaryDark} /></Link><Link href="/(tabs)/profile" accessibilityLabel={t("tabs.profile")} style={styles.avatar}>{profile.profilePhotoUri ? <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{profile.name.trim().charAt(0).toLocaleUpperCase(language) || "?"}</Text>}</Link></View></View></Entrance>
    <Entrance delay={45}><View style={styles.calorieCard}><Text style={styles.cardLabel}>{t("home.todayCalories")}</Text><Text style={styles.calories}>{calories === null ? "—" : Math.round(calories).toLocaleString(language)} <Text style={styles.goal}>kcal</Text></Text>{target !== null && calories !== null ? <><Text style={styles.goal}>{t("home.target", { target: target.toLocaleString(language) })}</Text><View accessibilityRole="progressbar" accessibilityLabel={t("home.target", { target: target.toLocaleString(language) })} accessibilityValue={{ min: 0, max: target, now: Math.min(calories, target) }}><ProgressBar progress={Math.min(calories / target * 100, 100)} trackColor="rgba(255,255,255,0.25)" fillColor={colors.white} /></View><Text style={styles.remaining}>{t("home.remaining", { amount: Math.max(Math.round(target - calories), 0).toLocaleString(language) })}</Text></> : <Text style={styles.targetUnavailable}>{targetReason ? t(targetNotice) : t("home.nutritionIncomplete")}</Text>}</View></Entrance>
    <Entrance delay={95}><View style={styles.activityCard}>
      <View style={styles.activityHeader}><View><Text style={styles.activityEyebrow}>{t("activity.section")}</Text><Text style={styles.activityTitle}>{t("activity.title")}</Text></View><Ionicons name="walk-outline" size={25} color={colors.primary} /></View>
      {permission === "loading" ? <View style={styles.activityStatus}><ActivityIndicator color={colors.primary} /><Text style={styles.activityCopy}>{t("activity.loading")}</Text></View> : permission === "notRequested" ? <><Text style={styles.activityCopy}>{t("activity.permissionPrompt")}</Text><AnimatedPressable accessibilityRole="button" onPress={() => void requestPermission()} style={styles.activityButton}><Text style={styles.activityButtonText}>{t("activity.enable")}</Text></AnimatedPressable></> : permission === "denied" ? <><Text style={styles.activityCopy}>{t("activity.permissionDenied")}</Text><AnimatedPressable accessibilityRole="button" onPress={() => permissionCanAskAgain ? void requestPermission() : void Linking.openSettings().catch(() => undefined)} style={styles.activityButton}><Text style={styles.activityButtonText}>{t(permissionCanAskAgain ? "activity.enable" : "activity.openSettings")}</Text></AnimatedPressable></> : permission === "unavailable" ? <Text style={styles.activityCopy}>{t("activity.sensorUnavailable")}</Text> : permission === "error" ? <><Text accessibilityRole="alert" style={styles.activityCopy}>{t("activity.error")}</Text><AnimatedPressable accessibilityRole="button" onPress={() => void requestPermission()} style={styles.activityButton}><Text style={styles.activityButtonText}>{t("common.tryAgain")}</Text></AnimatedPressable></> : <>
        <View style={styles.stepsRow}><Text accessibilityLabel={t("activity.stepsToday", { count: currentSteps.toLocaleString(language) })} style={styles.stepsValue}>{currentSteps.toLocaleString(language)}</Text><Text style={styles.stepsLabel}>{t("activity.steps")}</Text></View>
        <View style={styles.goalRow}><Text style={styles.goalCaption}>{t("activity.goal")}</Text><Text style={styles.goalValue}>{stepGoal.toLocaleString(language)} {t("activity.steps")}</Text></View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: stepGoal, now: Math.min(currentSteps, stepGoal) }} accessibilityLabel={t("activity.goalProgress", { percent: Math.min(Math.round(currentSteps / stepGoal * 100), 100) })}><ProgressBar progress={Math.min(currentSteps / stepGoal * 100, 100)} /></View>
        <View style={styles.activityStats}><View style={styles.activityStat}><Text style={styles.activityStatValue}>{distanceKm.toLocaleString(language, { maximumFractionDigits: 1 })} km</Text><Text style={styles.activityStatLabel}>{t("activity.distanceEstimated")}</Text></View><View style={styles.activityStat}><Text style={styles.activityStatValue}>{activityToday?.activeCalories === null || !activityToday ? "—" : `~${activityToday.activeCalories.toLocaleString(language)}`}</Text><Text style={styles.activityStatLabel}>{t("activity.activeCaloriesEstimated")}</Text></View></View>
        {activityToday?.activeCalories === null && <Text style={styles.activityFootnote}>{t("activity.weightNeeded")}</Text>}
        {editingStepGoal ? <View style={styles.goalEditor}><TextInput accessibilityLabel={t("activity.goal")} value={stepGoalDraft} onChangeText={setStepGoalDraft} keyboardType="number-pad" maxLength={5} style={styles.goalInput} /><AnimatedPressable accessibilityRole="button" onPress={() => void saveStepGoal()} style={styles.activityButton}><Text style={styles.activityButtonText}>{t("common.save")}</Text></AnimatedPressable><AnimatedPressable accessibilityRole="button" onPress={() => { setEditingStepGoal(false); setStepGoalError(false); }} style={styles.cancelGoalButton}><Text style={styles.activityCopy}>{t("common.cancel")}</Text></AnimatedPressable></View> : <AnimatedPressable accessibilityRole="button" onPress={() => { setStepGoalDraft(String(stepGoal)); setEditingStepGoal(true); }} style={styles.editGoalButton}><Text style={styles.editGoalText}>{t("activity.editGoal")}</Text></AnimatedPressable>}
        {stepGoalError && <Text accessibilityRole="alert" style={styles.activityError}>{t("activity.goalValidation")}</Text>}
      </>}
    </View></Entrance>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{t("home.meals")}</Text><Link href="/(tabs)/foods" style={styles.seeAll}>{t("home.addFood")}</Link></View>
    {mealKeys.map(({ meal, label, icon }) => {
      const items = entries.filter((entry) => entry.meal === meal);
      const mealCalories = sumNutrition(items.map((entry) => entry.nutrition)).calories;
      const count = items.length;
      const detail = count ? `${mealCalories === null ? "—" : Math.round(mealCalories).toLocaleString(language)} kcal · ${t(count === 1 ? "home.foodCountOne" : "home.foodCount", { count })}` : t("home.noFood");
      return <Entrance key={meal} delay={Math.min(145 + mealKeys.findIndex((item) => item.meal === meal) * 35, 250)} style={styles.mealGroup}>
        <Link href="/(tabs)/foods" style={styles.mealCard}><View style={styles.mealIcon}><Ionicons name={icon} size={22} color={colors.primaryDark} /></View><View style={styles.mealInfo}><Text style={styles.mealTitle}>{t(label)}</Text><Text style={styles.mealCalories}>{detail}</Text></View><Ionicons name="add-circle-outline" size={25} color={colors.primary} /></Link>
        {items.map((entry) => <View key={entry.id} style={styles.loggedItem}><View style={styles.loggedInfo}><Text numberOfLines={1} style={styles.loggedName}>{foodName(entry.food.id, language, entry.food.name)}</Text><Text style={styles.loggedMeta}>{entry.quantity} × {entry.food.servingLabel ?? `${entry.food.servingSize} ${entry.food.servingUnit}`}</Text></View><Text style={styles.loggedCalories}>{entry.nutrition.calories === null ? "—" : Math.round(entry.nutrition.calories)} kcal</Text><Pressable accessibilityRole="button" accessibilityLabel={t("meal.removeFood", { food: entry.food.name })} onPress={() => removeFood(entry.id)} style={styles.removeButton}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable></View>)}
      </Entrance>;
    })}
    {persistenceError ? <Text accessibilityRole="alert" style={styles.persistenceError}>{t("meal.storageError")}</Text> : null}
    <Text style={styles.sectionTitle}>{t("home.nutrition")}</Text><View style={styles.nutritionRow}>
      <NutritionCard title={t("home.protein")} intake={totals.protein} target={targets.available ? targets.proteinGrams : null} colors={colors} t={t} />
      <NutritionCard title={t("home.carbs")} intake={totals.carbs} target={targets.available ? targets.carbsGrams : null} colors={colors} t={t} />
      <NutritionCard title={t("home.fat")} intake={totals.fat} target={targets.available ? targets.fatGrams : null} colors={colors} t={t} />
    </View>
    <Text style={styles.disclaimer}>{t("home.disclaimer")}</Text>
  </ScrollView>;
}

function NutritionCard({ title, intake, target, colors, t }: { title: string; intake: number | null; target: number | null; colors: ColorPalette; t: (key: TranslationKey, values?: Record<string, string | number>) => string }) {
  const styles = createStyles(colors);
  const shownIntake = intake === null ? "—" : Math.round(intake);
  const value = target === null ? `${shownIntake} g` : t("home.macroGoal", { intake: shownIntake, target });
  return <View style={styles.nutritionCard}><Text style={styles.nutritionTitle}>{title}</Text><Text style={styles.nutritionValue}>{value}</Text></View>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: SPACING.lg, paddingTop: 24, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xl }, brandGroup: { gap: SPACING.xs }, headerActions: { flexDirection: "row", alignItems: "center", gap: SPACING.sm }, assistantButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight }, greeting: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 }, avatar: { width: 48, height: 48, borderRadius: RADIUS.full, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { color: colors.primaryDark, fontSize: 18, fontWeight: "700" },
  calorieCard: { ...SHADOWS.card, backgroundColor: colors.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl }, cardLabel: { color: colors.white, fontSize: 15, opacity: 0.9 }, calories: { color: colors.white, fontSize: 48, fontWeight: "800", marginTop: 8 }, goal: { color: colors.white, opacity: 0.85, fontSize: 14 }, targetUnavailable: { color: colors.white, fontSize: 14, lineHeight: 20, marginTop: SPACING.md }, remaining: { color: colors.white, fontSize: 13, marginTop: SPACING.sm, opacity: 0.9 },
  activityCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: colors.border }, activityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }, activityEyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, activityTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 3 }, activityStatus: { flexDirection: "row", alignItems: "center", gap: SPACING.sm }, activityCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, flexShrink: 1 }, activityButton: { minHeight: 44, justifyContent: "center", alignItems: "center", backgroundColor: colors.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginTop: SPACING.sm, alignSelf: "flex-start" }, activityButtonText: { color: colors.white, fontSize: 14, fontWeight: "700" }, stepsRow: { flexDirection: "row", alignItems: "baseline", gap: SPACING.sm, marginTop: 2 }, stepsValue: { color: colors.text, fontSize: 36, fontWeight: "800" }, stepsLabel: { color: colors.textSecondary, fontSize: 14 }, goalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.xs }, goalCaption: { color: colors.textSecondary, fontSize: 13 }, goalValue: { color: colors.text, fontSize: 13, fontWeight: "700" }, activityStats: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }, activityStat: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: RADIUS.md, padding: SPACING.sm }, activityStatValue: { color: colors.text, fontSize: 15, fontWeight: "800" }, activityStatLabel: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 }, activityFootnote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: SPACING.sm }, goalEditor: { marginTop: SPACING.sm }, goalInput: { minHeight: 46, color: colors.text, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: 16 }, cancelGoalButton: { minHeight: 40, justifyContent: "center", alignItems: "center", marginTop: SPACING.xs }, editGoalButton: { minHeight: 44, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, marginTop: SPACING.md }, editGoalText: { color: colors.primaryDark, fontSize: 14, fontWeight: "700" }, activityError: { color: colors.danger, fontSize: 12, marginTop: SPACING.xs },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }, sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: SPACING.md }, seeAll: { color: colors.primaryDark, fontWeight: "700" }, mealGroup: { marginBottom: SPACING.sm }, mealCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xs, flexDirection: "row", alignItems: "center", gap: SPACING.md, borderWidth: 1, borderColor: colors.border }, mealIcon: { width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, mealInfo: { flex: 1 }, mealTitle: { fontSize: 16, fontWeight: "700", color: colors.text }, mealCalories: { fontSize: 13, color: colors.textSecondary, marginTop: 3 }, 
  loggedItem: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginLeft: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }, loggedInfo: { flex: 1 }, loggedName: { color: colors.text, fontSize: 13, fontWeight: "600" }, loggedMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 }, loggedCalories: { color: colors.textSecondary, fontSize: 12 }, removeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, persistenceError: { color: colors.danger, fontSize: 13, marginBottom: SPACING.md }, nutritionRow: { flexDirection: "row", gap: SPACING.sm }, nutritionCard: { ...SHADOWS.card, flex: 1, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border }, nutritionTitle: { fontSize: 12, color: colors.textSecondary }, nutritionValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 5 }, disclaimer: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: SPACING.lg },
}); }
