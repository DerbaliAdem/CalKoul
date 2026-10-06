import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { useProfile } from "../../features/profile/ProfileContext";
import { validateProfile } from "../../features/profile/profileUtils";
import type { ActivityLevel, EnergyEquation, NutritionGoal, UserProfile } from "../../types/user";
import type { TranslationKey } from "../../i18n/translations";

const activityOptions: { value: ActivityLevel; label: TranslationKey }[] = [
  { value: "Sedentary", label: "edit.sedentary" }, { value: "Lightly active", label: "edit.lightlyActive" },
  { value: "Moderately active", label: "edit.moderatelyActive" }, { value: "Very active", label: "edit.veryActive" },
];
const goalOptions: { value: NutritionGoal; label: TranslationKey }[] = [
  { value: "Maintain my nutrition", label: "edit.maintain" }, { value: "Improve my eating habits", label: "edit.habits" },
  { value: "Gain weight", label: "edit.gain" }, { value: "Lose weight", label: "edit.lose" },
];
const energyEquationOptions: { value: EnergyEquation; label: TranslationKey }[] = [
  { value: "female", label: "edit.energyEquationFemale" }, { value: "male", label: "edit.energyEquationMale" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile, saving, storageError } = useProfile();
  const { colors } = useTheme();
  const { isRTL, t } = useLanguage();
  const styles = createStyles(colors);
  const [draft, setDraft] = useState<UserProfile>({ ...profile });
  const [error, setError] = useState("");
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => { setDraft((current) => ({ ...current, [key]: value })); setError(""); };
  const save = async () => {
    const issue = validateProfile(draft);
    if (issue) {
      setError(issue.field === "name"
        ? t("edit.nameTooLong", { max: issue.max })
        : t("edit.validation", { field: t(`edit.${issue.field}` as "edit.age" | "edit.height" | "edit.weight"), min: issue.min ?? 0, max: issue.max }));
      return;
    }
    const saved = await saveProfile({ ...draft, name: draft.name.trim() });
    if (saved) router.replace("/(tabs)/profile");
    else setError(t("profile.saveError"));
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Stack.Screen options={{ title: t("edit.title"), headerShown: false }} />
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={21} color={colors.text} /><Text style={styles.backText}>{t("common.back")}</Text></Pressable>
    <Text style={styles.eyebrow}>{t("edit.eyebrow")}</Text><Text style={styles.title}>{t("edit.title")}</Text><Text style={styles.subtitle}>{t("edit.subtitle")}</Text>
    <View style={styles.formCard}>
      <FormField label={t("edit.name")} value={draft.name} onChangeText={(value) => update("name", value)} placeholder={t("edit.yourName")} autoCapitalize="words" colors={colors} isRTL={isRTL} />
      <FormField label={t("edit.age")} value={draft.age} onChangeText={(value) => update("age", value)} placeholder={t("edit.agePlaceholder")} keyboardType="number-pad" suffix={t("profile.years")} colors={colors} isRTL={isRTL} />
      <FormField label={t("edit.height")} value={draft.height} onChangeText={(value) => update("height", value)} placeholder={t("edit.heightPlaceholder")} keyboardType="decimal-pad" suffix={t("profile.cm")} colors={colors} isRTL={isRTL} />
      <FormField label={t("edit.weight")} value={draft.weight} onChangeText={(value) => update("weight", value)} placeholder={t("edit.weightPlaceholder")} keyboardType="decimal-pad" suffix={t("profile.kg")} colors={colors} isRTL={isRTL} last />
    </View>
    <OptionGroup title={t("edit.activity")} options={activityOptions} selected={draft.activity} onSelect={(value) => update("activity", value)} colors={colors} t={t} />
    <OptionGroup title={t("edit.goal")} options={goalOptions} selected={draft.goal} onSelect={(value) => update("goal", value)} colors={colors} t={t} />
    <OptionGroup title={t("edit.energyEquation")} options={energyEquationOptions} selected={draft.energyEquation} onSelect={(value) => update("energyEquation", value)} colors={colors} t={t} />
    <Text style={styles.note}>{t("edit.energyEquationNote")}</Text>
    {(error || storageError) ? <Text accessibilityRole="alert" style={styles.error}>{error || t("profile.saveError")}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && { opacity: 0.7 }]}><Text style={styles.saveButtonText}>{saving ? t("common.saving") : t("edit.save")}</Text><Ionicons name="checkmark" size={20} color={colors.white} /></Pressable>
    <Text style={styles.note}>{t("edit.note")}</Text>
  </ScrollView>;
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, suffix, autoCapitalize, last = false, colors, isRTL }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "number-pad" | "decimal-pad"; suffix?: string; autoCapitalize?: "words"; last?: boolean; colors: ColorPalette; isRTL: boolean }) {
  const styles = createStyles(colors);
  return <View style={[styles.field, last && styles.lastField]}><Text style={styles.label}>{label}</Text><View style={styles.inputRow}><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textSecondary} keyboardType={keyboardType ?? "default"} autoCapitalize={autoCapitalize ?? "none"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]} accessibilityLabel={label} />{suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}</View></View>;
}

function OptionGroup<T extends string>({ title, options, selected, onSelect, colors, t }: { title: string; options: readonly { value: T; label: TranslationKey }[]; selected: T | ""; onSelect: (value: T) => void; colors: ColorPalette; t: (key: TranslationKey) => string }) {
  const styles = createStyles(colors);
  return <View style={styles.optionSection}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.options}>{options.map((option) => {
    const active = selected === option.value;
    return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => onSelect(option.value)} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{t(option.label)}</Text>{active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}</Pressable>;
  })}</View></View>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: SPACING.lg, paddingTop: 22, paddingBottom: 40 }, back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.lg }, backText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { color: colors.text, fontSize: 29, fontWeight: "800", marginTop: 5 }, subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6 }, formCard: { backgroundColor: colors.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, marginTop: SPACING.lg, borderWidth: 1, borderColor: colors.border }, field: { paddingTop: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, lastField: { borderBottomWidth: 0 }, label: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 4 }, inputRow: { flexDirection: "row", alignItems: "center" }, input: { flex: 1, minHeight: 42, color: colors.text, fontSize: 15, paddingVertical: 7 }, suffix: { color: colors.textSecondary, fontSize: 13, paddingLeft: SPACING.sm },
  optionSection: { marginTop: SPACING.lg }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: SPACING.sm }, options: { gap: SPACING.sm }, option: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border }, optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, optionText: { flex: 1, color: colors.textSecondary, fontSize: 14, fontWeight: "600" }, optionTextActive: { color: colors.primaryDark }, error: { color: colors.danger, fontSize: 13, marginTop: SPACING.md }, saveButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: colors.primary, borderRadius: RADIUS.lg, marginTop: SPACING.lg }, saveButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" }, note: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: SPACING.md },
}); }
