import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { useMeals } from "../../features/meals/MealContext";
import { useActivity } from "../../features/activity/ActivityContext";
import { useProfile } from "../../features/profile/ProfileContext";
import { foodName } from "../../i18n/foods";
import type { Language, TranslationKey } from "../../i18n/translations";
import type { MealType } from "../../types/meal";
import type { DailyHistory, HistoryPeriod, ProgressMetric, ProgressPoint } from "../../features/history/historyTypes";
import { selectDailyHistory, selectPeriodSummaries, selectTrailingProgress, selectedYearOptions } from "../../features/history/historySelectors";
import { selectProgressOverview } from "../../features/history/historyAnalytics";
import { formatPeriodRange, formatShortDate, parseLocalDate } from "../../features/history/historyUtils";
import { AnimatedPressable, Entrance } from "../../components/ui/Motion";

const mealLabels: Record<MealType, TranslationKey> = { Breakfast: "meal.breakfast", Lunch: "meal.lunch", Dinner: "meal.dinner", Snack: "meal.snack" };
const periodOptions: { value: HistoryPeriod; label: TranslationKey }[] = [{ value: "day", label: "history.daily" }, { value: "week", label: "history.weekly" }, { value: "month", label: "history.monthly" }, { value: "year", label: "history.yearly" }];
const metricOptions: { value: ProgressMetric; label: TranslationKey }[] = [{ value: "steps", label: "history.metricSteps" }, { value: "calories", label: "history.metricCalories" }, { value: "activeCalories", label: "history.metricActiveCalories" }, { value: "protein", label: "history.metricProtein" }, { value: "goalAdherence", label: "history.metricGoalAdherence" }];
const rangeOptions: { count: number; label: TranslationKey }[] = [{ count: 7, label: "history.range7" }, { count: 30, label: "history.range30" }, { count: 90, label: "history.range90" }, { count: 180, label: "history.range180" }, { count: 365, label: "history.range365" }];
const goalTranslation: Record<string, TranslationKey> = { "Maintain my nutrition": "edit.maintain", "Improve my eating habits": "edit.habits", "Gain weight": "edit.gain", "Lose weight": "edit.lose" };
const todayKey = () => {
  const date = new Date();
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
};

export default function HistoryScreen() {
  const { entries, persistenceError } = useMeals();
  const { days: activityDays, storageError: activityStorageError, setManualSteps } = useActivity();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);
  const [period, setPeriod] = useState<HistoryPeriod>("day");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [metric, setMetric] = useState<ProgressMetric>("steps");
  const [range, setRange] = useState(7);
  const [chartAvailableWidth, setChartAvailableWidth] = useState(0);
  const [visibleDays, setVisibleDays] = useState(30);
  const [editingActivity, setEditingActivity] = useState(false);
  const [manualSteps, setManualStepsText] = useState("");
  const [manualSaveError, setManualSaveError] = useState(false);
  const today = todayKey();

  const days = useMemo(() => selectDailyHistory(entries, activityDays), [entries, activityDays]);
  const weeks = useMemo(() => selectPeriodSummaries(days, "week"), [days]);
  const months = useMemo(() => selectPeriodSummaries(days, "month"), [days]);
  const years = useMemo(() => selectPeriodSummaries(days, "year"), [days]);
  const selectedYearOptionsList = useMemo(() => selectedYearOptions(days, new Date().getFullYear()), [days]);
  const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0] ?? null;
  const periodSummaries = period === "week" ? weeks : period === "month" ? months : [];
  const yearSummary = years.find((summary) => summary.key === String(selectedYear));
  const periodSummary = periodSummaries.find((summary) => summary.key === selectedPeriodKey) ?? periodSummaries[0] ?? null;
  const visibleMonthSummaries = months.filter((summary) => summary.key.startsWith(String(selectedYear)));
  const overview = useMemo(() => selectProgressOverview(days, today), [days, today]);
  const points = useMemo(() => selectTrailingProgress(days, metric, range, today), [days, metric, range, today]);
  const availableMetricValues = points.filter((point) => point.value !== null);
  const chartHasEnoughData = availableMetricValues.length >= 2;

  const setChartWidth = (event: LayoutChangeEvent) => setChartAvailableWidth(event.nativeEvent.layout.width);

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>{t("history.title")}</Text><Text style={styles.subtitle}>{t("history.subtitle")}</Text>
    {(persistenceError || activityStorageError) ? <Text accessibilityRole="alert" style={styles.error}>{t("meal.storageError")}</Text> : null}
    <ProgressCard overview={overview} goalFocus={t("history.goalFocus") + ": " + (profile.goal ? t(goalTranslation[profile.goal]) : t("common.notSet"))} colors={colors} t={t} language={language} />

    <Text style={styles.sectionTitle}>{t("history.progressChart")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{metricOptions.map((option) => <Chip key={option.value} selected={metric === option.value} label={t(option.label)} onPress={() => setMetric(option.value)} colors={colors} />)}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{rangeOptions.map((option) => <Chip key={option.count} selected={range === option.count} label={t(option.label)} onPress={() => setRange(option.count)} colors={colors} />)}</ScrollView>
    {chartHasEnoughData ? <Entrance><View style={styles.chartCard} onLayout={setChartWidth}><HistoryBarChart points={points} metric={metric} width={Math.max(chartAvailableWidth, points.length * 20)} colors={colors} language={language} t={t} /></View></Entrance> : <View style={styles.chartEmpty}><Text style={styles.emptyText}>{t("history.insufficientData")}</Text></View>}

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{periodOptions.map((option) => <Chip key={option.value} selected={period === option.value} label={t(option.label)} onPress={() => { setPeriod(option.value); setSelectedPeriodKey(null); }} colors={colors} />)}</ScrollView>

    {period === "day" ? <>
      {!days.length ? <EmptyHistory colors={colors} t={t} /> : <>
        <Text style={styles.sectionTitle}>{t("history.days")}</Text>
        {days.slice(0, visibleDays).map((day) => <Pressable key={day.date} accessibilityRole="button" accessibilityState={{ selected: selectedDay?.date === day.date }} onPress={() => setSelectedDate(day.date)} style={[styles.dayCard, selectedDay?.date === day.date && styles.daySelected]}>
          <View style={styles.dayInfo}><Text style={styles.dayTitle}>{formatDate(day.date, language)}</Text><Text style={styles.dayMeta}>{(day.calories === null ? "—" : Math.round(day.calories).toLocaleString(language) + " kcal") + " · " + t("history.periodTracked", { count: day.entries.length + (day.activity ? 1 : 0) })}</Text></View>
          <Text style={styles.dayTarget}>{day.activity ? day.activity.steps.toLocaleString(language) + " " + t("activity.steps") : day.targetCalories === null ? t("common.notSet") : day.targetCalories.toLocaleString(language) + " kcal"}</Text>
        </Pressable>)}
        {days.length > visibleDays && <Pressable accessibilityRole="button" onPress={() => setVisibleDays((count) => count + 30)} style={styles.loadMore}><Text style={styles.loadMoreText}>{t("history.loadMore")}</Text></Pressable>}
        {selectedDay && <DailyDetails day={selectedDay} colors={colors} t={t} language={language} onEditActivity={() => { setManualStepsText(String(selectedDay.activity?.steps ?? 0)); setManualSaveError(false); setEditingActivity(true); }} />}
      </>}
    </> : period === "week" || period === "month" ? <>
      <Text style={styles.sectionTitle}>{t(period === "week" ? "history.weeklySummary" : "history.monthlySummary")}</Text>
      {periodSummaries.length ? periodSummaries.map((summary) => <Pressable key={summary.key} accessibilityRole="button" accessibilityState={{ selected: (periodSummary?.key ?? "") === summary.key }} onPress={() => setSelectedPeriodKey(summary.key)} style={[styles.periodCard, (periodSummary?.key ?? "") === summary.key && styles.daySelected]}>
        <Text style={styles.dayTitle}>{period === "week" ? formatPeriodRange(summary.startDate, summary.endDate, language) : formatMonth(summary.key, language)}</Text>
        <Text style={styles.dayMeta}>{t("history.daysTracked", { tracked: summary.daysTracked, total: period === "week" ? 7 : new Date(Number(summary.key.slice(0, 4)), Number(summary.key.slice(5, 7)), 0).getDate() })}</Text>
        <SummaryMetrics summary={summary} colors={colors} t={t} language={language} />
      </Pressable>) : <EmptyHistory colors={colors} t={t} />}
      {periodSummary && <View style={styles.detailCard}><Text style={styles.sectionTitle}>{t(period === "week" ? "history.weeklySummary" : "history.monthlySummary")}</Text><Text style={styles.detailSubtitle}>{formatPeriodRange(periodSummary.startDate, periodSummary.endDate, language)}</Text><SummaryMetrics summary={periodSummary} colors={colors} t={t} language={language} /></View>}
    </> : <>
      <Text style={styles.sectionTitle}>{t("history.yearlySummary")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{selectedYearOptionsList.map((year) => <Chip key={year} selected={selectedYear === year} label={String(year)} onPress={() => { setSelectedYear(year); setSelectedPeriodKey(null); }} colors={colors} />)}</ScrollView>
      {yearSummary ? <View style={styles.detailCard}><Text style={styles.dayTitle}>{String(selectedYear)}</Text><Text style={styles.detailSubtitle}>{t("history.daysTracked", { tracked: yearSummary.daysTracked, total: 365 })}</Text><SummaryMetrics summary={yearSummary} colors={colors} t={t} language={language} /></View> : <EmptyHistory colors={colors} t={t} />}
      {visibleMonthSummaries.map((month) => {
        const monthWeeks = weeks.filter((week) => week.startDate.slice(0, 7) === month.key);
        return <View key={month.key} style={styles.monthGroup}><Text style={styles.monthTitle}>{formatMonth(month.key, language)}</Text><SummaryMetrics summary={month} colors={colors} t={t} language={language} />{monthWeeks.map((week) => <View key={week.key} style={styles.weekRow}><Text style={styles.weekText}>{formatPeriodRange(week.startDate, week.endDate, language)}</Text><Text style={styles.weekText}>{week.totalSteps === null ? "—" : week.totalSteps.toLocaleString(language) + " " + t("activity.steps")}</Text></View>)}</View>;
      })}
    </>}
    <Modal transparent visible={editingActivity} animationType="fade" onRequestClose={() => setEditingActivity(false)}><Pressable style={styles.modalBackdrop} onPress={() => setEditingActivity(false)}><View style={styles.manualSheet} onStartShouldSetResponder={() => true}><Text style={styles.sectionTitle}>{t("activity.manualTitle")}</Text><Text style={styles.dayMeta}>{t("activity.manualHelp")}</Text><TextInput accessibilityLabel={t("activity.manualTitle")} keyboardType="number-pad" value={manualSteps} onChangeText={setManualStepsText} style={styles.manualInput} /><View style={styles.manualActions}><Pressable accessibilityRole="button" style={styles.manualCancel} onPress={() => setEditingActivity(false)}><Text style={styles.cancelText}>{t("common.cancel")}</Text></Pressable><Pressable accessibilityRole="button" style={styles.manualSave} onPress={() => { void setManualSteps(selectedDay?.date ?? "", Number(manualSteps)).then((saved) => { if (saved) setEditingActivity(false); else setManualSaveError(true); }); }}><Text style={styles.saveText}>{t("common.save")}</Text></Pressable></View>{manualSaveError && <Text accessibilityRole="alert" style={styles.error}>{t("activity.manualError")}</Text>}</View></Pressable></Modal>
  </ScrollView>;
}

function ProgressCard({ overview, goalFocus, colors, t, language }: { overview: ReturnType<typeof selectProgressOverview>; goalFocus: string; colors: ColorPalette; t: (key: TranslationKey, values?: Record<string, string | number>) => string; language: string }) {
  const styles = createStyles(colors);
  const value = (amount: number | null) => amount === null ? "—" : amount.toLocaleString(language);
  return <View style={styles.progressCard}><Text style={styles.progressTitle}>{t("history.yourProgress")}</Text><Text style={styles.goalFocus}>{goalFocus}</Text><View style={styles.progressGrid}>
    <Metric label={t("history.trackingStreak")} value={value(overview.trackingStreak)} suffix={t("history.daysShort")} colors={colors} />
    <Metric label={t("history.averageSteps")} value={value(overview.averageSteps)} suffix={t("activity.steps")} colors={colors} />
    <Metric label={t("history.averageCalories")} value={value(overview.averageCalories)} suffix="kcal" colors={colors} />
    <Metric label={t("history.goalAdherence")} value={value(overview.goalAdherence)} suffix="%" colors={colors} />
  </View></View>;
}

function DailyDetails({ day, colors, t, language, onEditActivity }: { day: DailyHistory; colors: ColorPalette; t: (key: TranslationKey, values?: Record<string, string | number>) => string; language: Language; onEditActivity: () => void }) {
  const styles = createStyles(colors);
  const meals = (["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).filter((meal) => day.entries.some((entry) => entry.meal === meal));
  return <View style={styles.detailCard}>
    <Text style={styles.sectionTitle}>{formatDate(day.date, language)}</Text>
    <MetricRow label={t("home.todayCalories")} value={day.calories === null ? "—" : Math.round(day.calories).toLocaleString(language) + " kcal"} colors={colors} />
    <MetricRow label={t("history.target")} value={day.targetCalories === null ? t("common.notSet") : day.targetCalories.toLocaleString(language) + " kcal"} colors={colors} />
    <View style={styles.macroRow}><Metric label={t("home.protein")} value={formatAmount(day.protein, language)} suffix="g" colors={colors} /><Metric label={t("home.carbs")} value={formatAmount(day.carbs, language)} suffix="g" colors={colors} /><Metric label={t("home.fat")} value={formatAmount(day.fat, language)} suffix="g" colors={colors} /></View>
    {day.activity ? <><MetricRow label={t("activity.steps")} value={day.activity.steps.toLocaleString(language) + " / " + day.activity.stepGoal.toLocaleString(language)} colors={colors} /><MetricRow label={t("activity.distanceEstimated")} value={(day.activity.distanceMeters / 1000).toLocaleString(language, { maximumFractionDigits: 1 }) + " km"} colors={colors} /><MetricRow label={t("history.estimatedActiveCalories")} value={day.activity.activeCalories === null ? "—" : "~" + day.activity.activeCalories.toLocaleString(language) + " kcal"} colors={colors} /><Pressable accessibilityRole="button" onPress={onEditActivity} style={styles.manualEdit}><Text style={styles.manualEditText}>{t("activity.manualEdit")}</Text></Pressable></> : <Pressable accessibilityRole="button" onPress={onEditActivity} style={styles.manualEdit}><Text style={styles.manualEditText}>{t("activity.manualAdd")}</Text></Pressable>}
    {meals.map((meal) => <View key={meal} style={styles.mealSection}><Text style={styles.mealTitle}>{t(mealLabels[meal])}</Text>{day.entries.filter((entry) => entry.meal === meal).map((entry) => <View key={entry.id} style={styles.foodRow}><View style={styles.foodInfo}><Text style={styles.foodName}>{foodName(entry.food.id, language, entry.food.name)}</Text><Text style={styles.foodMeta}>{entry.quantity + " × " + (entry.food.servingLabel ?? entry.food.servingSize + " " + entry.food.servingUnit)}</Text></View><Text style={styles.foodCalories}>{entry.nutrition.calories === null ? "—" : Math.round(entry.nutrition.calories).toLocaleString(language) + " kcal"}</Text></View>)}</View>)}
  </View>;
}

function SummaryMetrics({ summary, colors, t, language }: { summary: ReturnType<typeof selectPeriodSummaries>[number]; colors: ColorPalette; t: (key: TranslationKey, values?: Record<string, string | number>) => string; language: Language }) {
  const steps = summary.averageSteps === null ? "—" : Math.round(summary.averageSteps).toLocaleString(language);
  const calories = summary.averageCalories === null ? "—" : Math.round(summary.averageCalories).toLocaleString(language);
  const protein = summary.averageProtein === null ? "—" : Math.round(summary.averageProtein).toLocaleString(language);
  const totalSteps = summary.totalSteps === null ? "—" : Math.round(summary.totalSteps).toLocaleString(language);
  const activeCalories = summary.estimatedActiveCalories === null ? "—" : Math.round(summary.estimatedActiveCalories).toLocaleString(language);
  const adherence = summary.goalAdherence === null ? "—" : summary.goalAdherence.toLocaleString(language) + "%";
  return <View style={createStyles(colors).summaryGrid}>
    <Metric label={t("history.averageSteps")} value={steps} suffix={t("activity.steps") + "/day"} colors={colors} />
    <Metric label={t("history.totalSteps")} value={totalSteps} suffix={t("activity.steps")} colors={colors} />
    <Metric label={t("history.averageCalories")} value={calories} suffix="kcal/day" colors={colors} />
    <Metric label={t("history.averageProtein")} value={protein} suffix="g/day" colors={colors} />
    <Metric label={t("history.estimatedActiveCalories")} value={activeCalories} suffix="kcal" colors={colors} />
    <Metric label={t("history.goalAdherence")} value={adherence} suffix="" colors={colors} />
  </View>;
}

function HistoryBarChart({ points, metric, width, colors, language, t }: { points: ProgressPoint[]; metric: ProgressMetric; width: number; colors: ColorPalette; language: Language; t: (key: TranslationKey) => string }) {
  const styles = createStyles(colors);
  const values = points.map((point) => point.value).filter((value): value is number => value !== null);
  const maxValue = Math.max(...values, 1);
  const gap = points.length > 90 ? 2 : 5;
  const barWidth = Math.max(4, Math.min(14, (width - points.length * gap) / points.length));
  const labelEvery = points.length <= 7 ? 1 : points.length <= 30 ? 5 : points.length <= 90 ? 15 : 60;
  const metricLabel = t(metricOptions.find((option) => option.value === metric)!.label);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ width, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: SPACING.sm }}>
    {points.map((point, index) => {
      const value = point.value;
      const height = value === null ? 3 : Math.max(4, Math.round((value / maxValue) * 98));
      const shown = value === null ? "—" : Math.round(value).toLocaleString(language) + (metric === "goalAdherence" ? "%" : "");
      const accessibilityLabel = formatShortDate(point.date, language) + ", " + metricLabel + ": " + shown;
      return <View key={point.date} accessible accessibilityLabel={accessibilityLabel} style={{ width: barWidth, alignItems: "center", marginRight: gap }}>
        <View style={{ height: 104, width: "100%", justifyContent: "flex-end" }}><View style={{ height, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: value === null ? colors.surfaceSecondary : colors.primary }} /></View>
        <Text style={styles.chartLabel}>{index % labelEvery === 0 ? formatShortDate(point.date, language) : ""}</Text>
      </View>;
    })}
  </View></ScrollView>;
}

function Metric({ label, value, suffix, colors }: { label: string; value: string; suffix: string; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}{suffix ? <Text style={styles.metricSuffix}> {suffix}</Text> : null}</Text></View>;
}
function MetricRow({ label, value, colors }: { label: string; value: string; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return <View style={styles.totalRow}><Text style={styles.totalLabel}>{label}</Text><Text style={styles.totalValue}>{value}</Text></View>;
}
function Chip({ selected, label, onPress, colors }: { selected: boolean; label: string; onPress: () => void; colors: ColorPalette }) {
  const styles = createStyles(colors);
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></AnimatedPressable>;
}
function EmptyHistory({ colors, t }: { colors: ColorPalette; t: (key: TranslationKey) => string }) {
  const styles = createStyles(colors);
  return <View style={styles.emptyCard}><View style={styles.emptyMark}><Ionicons name="stats-chart-outline" size={24} color={colors.primaryDark} /></View><Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text><Text style={styles.emptyText}>{t("history.emptyText")}</Text></View>;
}
function formatDate(date: string, language: Language) {
  return parseLocalDate(date).toLocaleDateString(language, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}
function formatMonth(key: string, language: Language) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(language, { month: "long", year: "numeric" });
}
function formatAmount(value: number | null, language: string): string {
  return value === null ? "—" : Math.round(value).toLocaleString(language);
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: SPACING.lg, paddingTop: 24, paddingBottom: 42 }, title: { fontSize: 30, fontWeight: "800", color: colors.text }, subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, marginBottom: SPACING.lg }, sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: SPACING.lg, marginBottom: SPACING.sm }, error: { color: colors.danger, fontSize: 13, marginBottom: SPACING.md }, modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "center", padding: SPACING.lg }, manualSheet: { backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: SPACING.lg }, manualInput: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, color: colors.text, paddingHorizontal: SPACING.md, marginTop: SPACING.md }, manualActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }, manualCancel: { minHeight: 44, flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary, borderRadius: RADIUS.md }, manualSave: { minHeight: 44, flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderRadius: RADIUS.md }, cancelText: { color: colors.text, fontWeight: "700" }, saveText: { color: colors.white, fontWeight: "700" }, manualEdit: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: SPACING.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: RADIUS.md }, manualEditText: { color: colors.primaryDark, fontWeight: "700" },
  progressCard: { backgroundColor: colors.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.border, padding: SPACING.md }, progressTitle: { color: colors.text, fontSize: 19, fontWeight: "800" }, goalFocus: { color: colors.textSecondary, fontSize: 12, marginTop: 5 }, progressGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.md }, metric: { flexGrow: 1, flexBasis: "40%", backgroundColor: colors.surfaceSecondary, borderRadius: RADIUS.md, padding: SPACING.sm, minHeight: 62 }, metricLabel: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 }, metricValue: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 5 }, metricSuffix: { color: colors.textSecondary, fontSize: 10, fontWeight: "600" }, macroRow: { flexDirection: "row", gap: SPACING.xs, marginTop: SPACING.md },
  chipRow: { flexDirection: "row", gap: SPACING.xs, paddingVertical: SPACING.xs, paddingEnd: SPACING.sm }, chip: { minHeight: 40, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" }, chipTextSelected: { color: colors.white }, chartCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, minHeight: 138, borderWidth: 1, borderColor: colors.border, marginTop: SPACING.sm }, chartLabel: { color: colors.textSecondary, fontSize: 9, marginTop: 5, textAlign: "center", height: 12 }, chartEmpty: { backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, marginTop: SPACING.sm },
  dayCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.sm }, periodCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.sm }, daySelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, dayInfo: { flex: 1 }, dayTitle: { color: colors.text, fontWeight: "800", fontSize: 14 }, dayMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 }, dayTarget: { color: colors.primaryDark, fontSize: 12, fontWeight: "700" }, summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: SPACING.sm }, detailCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: SPACING.md, marginTop: SPACING.lg, borderWidth: 1, borderColor: colors.border }, detailSubtitle: { color: colors.textSecondary, fontSize: 12, marginBottom: SPACING.xs }, totalRow: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, totalLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 }, totalValue: { color: colors.text, fontSize: 13, fontWeight: "700" }, mealSection: { marginTop: SPACING.lg }, mealTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: "800", marginBottom: SPACING.xs }, foodRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, foodInfo: { flex: 1 }, foodName: { color: colors.text, fontSize: 13, fontWeight: "600" }, foodMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 }, foodCalories: { color: colors.textSecondary, fontSize: 12 }, monthGroup: { ...SHADOWS.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm }, monthTitle: { color: colors.text, fontSize: 16, fontWeight: "800" }, weekRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: SPACING.sm }, weekText: { color: colors.textSecondary, fontSize: 11, flexShrink: 1 }, loadMore: { minHeight: 46, justifyContent: "center", alignItems: "center" }, loadMoreText: { color: colors.primaryDark, fontSize: 14, fontWeight: "700" }, emptyMark: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, emptyCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: "center", marginTop: SPACING.md, borderWidth: 1, borderColor: colors.border }, icon: { fontSize: 42 }, emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: SPACING.md }, emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginTop: 7 },
}); }
