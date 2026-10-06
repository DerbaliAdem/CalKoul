import { useState } from "react";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme, type ThemeMode } from "../../context/PreferencesContext";
import { LANGUAGE_LABELS, type Language, type TranslationKey } from "../../i18n/translations";
import { useProfile } from "../../features/profile/ProfileContext";
import { saveProfilePhoto, removeStoredProfilePhoto } from "../../features/profile/profilePhotoStorage";
import { useActivity } from "../../features/activity/ActivityContext";
import { useMeals } from "../../features/meals/MealContext";
import { AnimatedPressable, Entrance } from "../../components/ui/Motion";

type PickerKind = "theme" | "language" | null;

export default function ProfileScreen() {
  const { profile, storageError, saveProfile } = useProfile();
  const { stepGoal } = useActivity();
  const { clearHistory: clearMealHistory } = useMeals();
  const { clearHistory: clearActivityHistory } = useActivity();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, isRTL, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [picker, setPicker] = useState<PickerKind>(null);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [photoError, setPhotoError] = useState<"cameraPermission" | "galleryPermission" | "unavailable" | "storage" | null>(null);
  const styles = createStyles(colors);
  const displayName = profile.name.trim() || t("common.notSet");
  const initial = profile.name.trim().charAt(0).toLocaleUpperCase(language) || "?";
  const themeOptions: { value: ThemeMode; label: TranslationKey }[] = [{ value: "system", label: "settings.system" }, { value: "light", label: "settings.light" }, { value: "dark", label: "settings.dark" }];
  const languageOptions = Object.keys(LANGUAGE_LABELS) as Language[];
  const pickerTitle = picker === "theme" ? t("settings.chooseAppearance") : t("settings.chooseLanguage");
  const themeLabel = t(themeOptions.find((item) => item.value === themeMode)?.label ?? "settings.system");

  const selectPhoto = async (source: "camera" | "gallery") => {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        let permission = await ImagePicker.getCameraPermissionsAsync();
        if (!permission.granted) permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setPhotoError("cameraPermission"); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.75, base64: Platform.OS === "web" });
      } else {
        let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!permission.granted) permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setPhotoError("galleryPermission"); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.75, base64: Platform.OS === "web" });
      }
      const asset = result.canceled ? null : result.assets?.[0];
      if (!asset) return;
      const previousUri = profile.profilePhotoUri;
      const photoUri = await saveProfilePhoto(asset.uri, asset.base64);
      const saved = await saveProfile({ ...profile, profilePhotoUri: photoUri });
      if (!saved) {
        removeStoredProfilePhoto(photoUri);
        setPhotoError("storage");
        return;
      }
      if (previousUri) removeStoredProfilePhoto(previousUri);
      setPhotoMenu(false);
    } catch {
      setPhotoError("unavailable");
    } finally {
      setPhotoBusy(false);
    }
  };

  const clearPhoto = async () => {
    const previousUri = profile.profilePhotoUri;
    const saved = await saveProfile({ ...profile, profilePhotoUri: "" });
    if (!saved) { setPhotoError("storage"); return; }
    if (previousUri) removeStoredProfilePhoto(previousUri);
    setPhotoMenu(false);
    setPhotoError(null);
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>{t("profile.eyebrow")}</Text><Text style={styles.title}>{t("profile.title")}</Text>
    <Entrance><View style={styles.profileCard}><AnimatedPressable accessibilityRole="button" accessibilityLabel={t("profile.photoChange")} onPress={() => { setPhotoError(null); setPhotoMenu(true); }} style={styles.avatar}>{profile.profilePhotoUri ? <Animated.Image key={profile.profilePhotoUri} entering={reduceMotion ? undefined : FadeIn.duration(220)} source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}</AnimatedPressable><Text style={styles.name}>{displayName}</Text><Text style={styles.subtitle}>{t("profile.subtitle")}</Text><AnimatedPressable accessibilityRole="button" onPress={() => { setPhotoError(null); setPhotoMenu(true); }} style={styles.photoLink}><Text style={styles.photoLinkText}>{t(profile.profilePhotoUri ? "profile.photoChange" : "profile.photoAdd")}</Text></AnimatedPressable></View></Entrance>
    <View style={styles.infoCard}>
      <ProfileRow label={t("profile.age")} value={profile.age ? `${profile.age} ${t("profile.years")}` : t("common.notSet")} colors={colors} />
      <ProfileRow label={t("profile.height")} value={profile.height ? `${profile.height} ${t("profile.cm")}` : t("common.notSet")} colors={colors} />
      <ProfileRow label={t("profile.weight")} value={profile.weight ? `${profile.weight} ${t("profile.kg")}` : t("common.notSet")} colors={colors} />
      <ProfileRow label={t("profile.activity")} value={profile.activity ? t(activityTranslation[profile.activity]) : t("common.notSet")} colors={colors} />
      <ProfileRow label={t("profile.goal")} value={profile.goal ? t(goalTranslation[profile.goal]) : t("common.notSet")} colors={colors} />
      <ProfileRow label={t("activity.goal")} value={`${stepGoal.toLocaleString(language)} ${t("activity.steps")}`} colors={colors} />
      <ProfileRow label={t("profile.energyEquation")} value={profile.energyEquation ? t(profile.energyEquation === "female" ? "edit.energyEquationFemale" : "edit.energyEquationMale") : t("common.notSet")} colors={colors} last />
    </View>
    <Link href="/profile/edit" style={styles.editButton}><Ionicons name="create-outline" size={19} color={colors.white} /><Text style={styles.editText}>{t("profile.edit")}</Text></Link>
    <Text style={styles.disclaimer}>{t("profile.disclaimer")}</Text>
    {storageError ? <Text accessibilityRole="alert" style={styles.storageError}>{t("profile.saveError")}</Text> : null}
    <Text style={styles.settingsTitle}>{t("settings.title")}</Text>
    <AnimatedPressable onPress={() => setPicker("theme")} style={styles.settingRow}><View><Text style={styles.settingLabel}>{t("settings.appearance")}</Text><Text style={styles.settingValue}>{themeLabel}</Text></View><Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={21} color={colors.textSecondary} /></AnimatedPressable>
    <AnimatedPressable onPress={() => setPicker("language")} style={styles.settingRow}><View><Text style={styles.settingLabel}>{t("settings.language")}</Text><Text style={styles.settingValue}>{LANGUAGE_LABELS[language]}</Text></View><Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={21} color={colors.textSecondary} /></AnimatedPressable>
    <Pressable accessibilityRole="button" onPress={() => { setResetError(false); setResetOpen(true); }} style={styles.settingRow}><View><Text style={styles.settingLabel}>{t("settings.resetProgress")}</Text><Text style={styles.settingValue}>{t("settings.resetDescription")}</Text></View><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
    <Modal transparent visible={resetOpen} animationType="fade" onRequestClose={() => setResetOpen(false)}><Pressable style={styles.modalBackdrop} onPress={() => setResetOpen(false)}><View style={styles.sheet} onStartShouldSetResponder={() => true}><Text style={styles.sheetTitle}>{t("settings.resetConfirmTitle")}</Text><Text style={styles.settingValue}>{t("settings.resetConfirmBody")}</Text>{resetError && <Text accessibilityRole="alert" style={styles.photoError}>{t("settings.resetError")}</Text>}<View style={styles.resetActions}><Pressable accessibilityRole="button" onPress={() => setResetOpen(false)} style={styles.resetButton}><Text style={styles.optionText}>{t("common.cancel")}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { void (async () => { const meals = await clearMealHistory(); const activity = await clearActivityHistory(); if (meals && activity) setResetOpen(false); else setResetError(true); })(); }} style={[styles.resetButton, styles.resetDanger]}><Text style={styles.resetDangerText}>{t("settings.resetProgress")}</Text></Pressable></View></View></Pressable></Modal>
    <Modal transparent visible={picker !== null} animationType="fade" onRequestClose={() => setPicker(null)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}><View style={styles.sheet} onStartShouldSetResponder={() => true}>
        <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{pickerTitle}</Text><Pressable accessibilityLabel={t("common.close")} onPress={() => setPicker(null)} style={styles.closeButton}><Ionicons name="close" size={21} color={colors.textSecondary} /></Pressable></View>
        {(picker === "theme" ? themeOptions : languageOptions.map((value) => ({ value, label: LANGUAGE_LABELS[value] }))).map((option) => {
          const selected = picker === "theme" ? option.value === themeMode : option.value === language;
          const label = picker === "theme" ? t(option.label as TranslationKey) : option.label;
          return <Pressable key={option.value} onPress={() => { if (picker === "theme") setThemeMode(option.value as ThemeMode); else setLanguage(option.value as Language); setPicker(null); }} style={[styles.option, selected && styles.optionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>{selected && <Ionicons name="checkmark-circle" size={21} color={colors.primary} />}</Pressable>;
        })}
      </View></Pressable>
    </Modal>
    <Modal transparent visible={photoMenu} animationType="fade" onRequestClose={() => setPhotoMenu(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => !photoBusy && setPhotoMenu(false)}><View style={styles.sheet} onStartShouldSetResponder={() => true}>
        <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{t("profile.photoTitle")}</Text><Pressable accessibilityLabel={t("common.close")} onPress={() => setPhotoMenu(false)} style={styles.closeButton}><Ionicons name="close" size={21} color={colors.textSecondary} /></Pressable></View>
        {photoBusy ? <ActivityIndicator color={colors.primary} /> : <>
          <Pressable accessibilityRole="button" onPress={() => void selectPhoto("camera")} style={styles.photoOption}><Ionicons name="camera-outline" size={20} color={colors.primaryDark} /><Text style={styles.optionText}>{t("profile.photoTake")}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void selectPhoto("gallery")} style={styles.photoOption}><Ionicons name="images-outline" size={20} color={colors.primaryDark} /><Text style={styles.optionText}>{t("profile.photoGallery")}</Text></Pressable>
          {profile.profilePhotoUri ? <Pressable accessibilityRole="button" onPress={() => void clearPhoto()} style={styles.photoOption}><Ionicons name="trash-outline" size={20} color={colors.danger} /><Text style={styles.deleteOptionText}>{t("profile.photoRemove")}</Text></Pressable> : null}
          {photoError ? <Text accessibilityRole="alert" style={styles.photoError}>{t(photoError === "cameraPermission" ? "profile.photoCameraDenied" : photoError === "galleryPermission" ? "profile.photoGalleryDenied" : photoError === "storage" ? "profile.saveError" : "profile.photoError")}</Text> : null}
        </>}
      </View></Pressable>
    </Modal>
  </ScrollView>;
}

function ProfileRow({ label, value, colors, last = false }: { label: string; value: string; colors: ColorPalette; last?: boolean }) { const styles = createStyles(colors); return <View style={[styles.row, last && styles.lastRow]}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }

const activityTranslation: Record<Exclude<ReturnType<typeof useProfile>["profile"]["activity"], "">, TranslationKey> = { "Sedentary": "edit.sedentary", "Lightly active": "edit.lightlyActive", "Moderately active": "edit.moderatelyActive", "Very active": "edit.veryActive" };
const goalTranslation: Record<Exclude<ReturnType<typeof useProfile>["profile"]["goal"], "">, TranslationKey> = { "Maintain my nutrition": "edit.maintain", "Improve my eating habits": "edit.habits", "Gain weight": "edit.gain", "Lose weight": "edit.lose" };

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: SPACING.lg, paddingTop: 24, paddingBottom: 36 }, eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 5 },
  profileCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.xl, alignItems: "center", padding: SPACING.xl, marginTop: SPACING.lg, borderWidth: 1, borderColor: colors.border }, avatar: { width: 76, height: 76, borderRadius: RADIUS.full, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" }, avatarText: { fontSize: 28, fontWeight: "800", color: colors.primaryDark }, photoLink: { minHeight: 42, justifyContent: "center", paddingHorizontal: SPACING.sm }, photoLinkText: { color: colors.primaryDark, fontSize: 13, fontWeight: "700" }, name: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: SPACING.md }, subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21, marginTop: 6 },
  infoCard: { ...SHADOWS.card, backgroundColor: colors.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }, lastRow: { borderBottomWidth: 0 }, rowLabel: { flex: 0.8, fontSize: 14, color: colors.textSecondary, fontWeight: "600" }, rowValue: { flex: 1.2, textAlign: "right", fontSize: 14, color: colors.text, fontWeight: "600" },
  editButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: colors.primary, borderRadius: RADIUS.lg, marginTop: SPACING.lg }, editText: { color: colors.white, fontSize: 15, fontWeight: "700" }, disclaimer: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: SPACING.lg }, storageError: { color: colors.danger, fontSize: 13, textAlign: "center", marginTop: SPACING.sm }, settingsTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: SPACING.xl, marginBottom: SPACING.sm }, settingRow: { ...SHADOWS.card, minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.sm }, settingLabel: { color: colors.text, fontSize: 15, fontWeight: "700" }, settingValue: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  resetActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }, resetButton: { minHeight: 46, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: colors.surfaceSecondary }, resetDanger: { backgroundColor: colors.danger }, resetDangerText: { color: colors.white, fontWeight: "700" }, modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.background, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl }, sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }, sheetTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, option: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, marginTop: SPACING.sm }, photoOption: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingHorizontal: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, marginTop: SPACING.sm }, deleteOptionText: { color: colors.danger, fontSize: 15, fontWeight: "600" }, photoError: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: SPACING.md }, optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, optionText: { color: colors.text, fontSize: 15, fontWeight: "600" }, optionTextSelected: { color: colors.primaryDark },
}); }
