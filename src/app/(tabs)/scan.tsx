import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { foodVisionService } from "../../services/foodVision/foodVisionService";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<"notConfigured" | "error" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [cameraError, setCameraError] = useState<"preview" | "capture" | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const retake = () => { setPhotoUri(null); setAnalysisMessage(null); setCameraError(null); setIsCameraReady(false); };
  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing || !isCameraReady) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) { setPhotoUri(photo.uri); setAnalysisMessage(null); }
    } catch { setCameraError("capture"); }
    finally { setIsCapturing(false); }
  };
  const analyzePhoto = async () => {
    if (!photoUri || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisMessage(null);
    try {
      const result = await foodVisionService.analyzeFoodImage({ imageUri: photoUri });
      if (result.status === "notConfigured") setAnalysisMessage("notConfigured");
      else router.push({ pathname: "/food/[id]", params: { id: result.foodId } });
    } catch {
      setAnalysisMessage("error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!permission) return <View style={[styles.permissionScreen, { paddingTop: insets.top + SPACING.xl }]}><Text style={styles.title}>{t("scan.prepare")}</Text></View>;
  if (!permission.granted) return <View style={[styles.permissionScreen, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl }]}>
    <View style={styles.permissionIcon}><Ionicons name="camera-outline" size={36} color={colors.primaryDark} /></View>
    <Text style={styles.title}>{t("scan.title")}</Text><Text style={styles.subtitle}>{t("scan.permission")}</Text>
    {permission.canAskAgain ? <Pressable onPress={() => void requestPermission()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t("scan.allow")}</Text></Pressable> : <Text style={styles.permissionDenied}>{t("scan.denied")}</Text>}
  </View>;

  return <View style={[styles.screen, { paddingTop: insets.top + SPACING.md, paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
    <View style={styles.header}><Text style={styles.eyebrow}>{t("scan.eyebrow")}</Text><Text style={styles.title}>{t("scan.title")}</Text><Text style={styles.subtitle}>{t("scan.subtitle")}</Text></View>
    <View style={styles.preview}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" /> : isFocused ? <CameraView key={cameraAttempt} ref={cameraRef} style={styles.camera} facing="back" onCameraReady={() => setIsCameraReady(true)} onMountError={() => setCameraError("preview")} /> : <View style={styles.cameraPaused}><Ionicons name="camera-outline" size={36} color={colors.white} /><Text style={styles.cameraPausedText}>{t("scan.paused")}</Text></View>}
      {!photoUri && !cameraError && <View pointerEvents="none" style={styles.frame}><View style={styles.cornerTopLeft} /><View style={styles.cornerTopRight} /><View style={styles.cornerBottomLeft} /><View style={styles.cornerBottomRight} /></View>}
      {cameraError && <View style={styles.cameraError}><Ionicons name="alert-circle-outline" size={28} color={colors.white} /><Text style={styles.cameraErrorText}>{t(cameraError === "capture" ? "scan.captureError" : "scan.previewError")}</Text></View>}
      {analysisMessage && <View style={styles.analysisNotice}><Ionicons name={analysisMessage === "error" ? "alert-circle-outline" : "information-circle-outline"} size={20} color={analysisMessage === "error" ? colors.danger : colors.primaryDark} /><Text style={styles.analysisNoticeText}>{t(analysisMessage === "error" ? "scan.analysisError" : "scan.notConfigured")}</Text></View>}
      {cameraError && <Pressable accessibilityRole="button" onPress={() => { setCameraError(null); setCameraAttempt((value) => value + 1); }} style={styles.cameraRetry}><Text style={styles.cameraRetryText}>{t("scan.retryCamera")}</Text></Pressable>}
    </View>
    <Text style={styles.estimateNote}>{t("scan.photoEstimate")}</Text>
    {photoUri ? <View style={styles.actions}><Pressable accessibilityRole="button" onPress={retake} style={styles.secondaryButton}><Ionicons name="refresh-outline" size={19} color={colors.primaryDark} /><Text style={styles.secondaryButtonText}>{t("scan.retake")}</Text></Pressable><Pressable accessibilityRole="button" disabled={isAnalyzing} onPress={() => void analyzePhoto()} style={[styles.primaryButton, isAnalyzing && styles.captureDisabled]}>{isAnalyzing ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.primaryButtonText}>{t("scan.analyzePhoto")}</Text><Ionicons name="sparkles-outline" size={19} color={colors.white} /></>}</Pressable></View> : <Pressable accessibilityRole="button" accessibilityLabel={t("scan.takePhoto")} disabled={isCapturing || !isCameraReady || !isFocused || Boolean(cameraError)} onPress={() => void capturePhoto()} style={[styles.captureOuter, (isCapturing || !isCameraReady || Boolean(cameraError)) && styles.captureDisabled]}><View style={styles.captureInner}>{isCapturing ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons name="camera" size={25} color={colors.primaryDark} />}</View></Pressable>}
  </View>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  permissionScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.xl, backgroundColor: colors.background }, permissionIcon: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: colors.primaryLight, marginBottom: SPACING.lg }, screen: { flex: 1, paddingHorizontal: SPACING.lg, backgroundColor: colors.background }, header: { marginBottom: SPACING.md }, eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 4 }, subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: SPACING.sm },
  preview: { flex: 1, minHeight: 240, maxHeight: 520, overflow: "hidden", borderRadius: RADIUS.xl, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center" }, camera: StyleSheet.absoluteFill, previewImage: { width: "100%", height: "100%" }, frame: { ...StyleSheet.absoluteFill, margin: 28 },
  cornerTopLeft: { position: "absolute", top: 0, left: 0, width: 34, height: 34, borderTopWidth: 3, borderLeftWidth: 3, borderColor: colors.white, borderTopLeftRadius: 10 }, cornerTopRight: { position: "absolute", top: 0, right: 0, width: 34, height: 34, borderTopWidth: 3, borderRightWidth: 3, borderColor: colors.white, borderTopRightRadius: 10 }, cornerBottomLeft: { position: "absolute", bottom: 0, left: 0, width: 34, height: 34, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: colors.white, borderBottomLeftRadius: 10 }, cornerBottomRight: { position: "absolute", bottom: 0, right: 0, width: 34, height: 34, borderBottomWidth: 3, borderRightWidth: 3, borderColor: colors.white, borderBottomRightRadius: 10 },
  cameraPaused: { flex: 1, alignItems: "center", justifyContent: "center" }, cameraPausedText: { color: colors.white, fontSize: 14, marginTop: SPACING.sm }, cameraError: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: colors.overlay, padding: SPACING.xl }, cameraErrorText: { color: colors.white, textAlign: "center", lineHeight: 21, marginTop: SPACING.sm }, cameraRetry: { position: "absolute", bottom: SPACING.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.surface, borderRadius: RADIUS.md }, cameraRetryText: { color: colors.text, fontWeight: "700" }, analysisNotice: { position: "absolute", left: SPACING.md, right: SPACING.md, bottom: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: colors.surface, padding: SPACING.md, borderRadius: RADIUS.md }, analysisNoticeText: { color: colors.text, fontWeight: "700", fontSize: 14, flex: 1 }, estimateNote: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: SPACING.md },
  captureOuter: { alignSelf: "center", width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: SPACING.md, marginBottom: SPACING.sm, backgroundColor: colors.surface }, captureDisabled: { opacity: 0.55 }, captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, actions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.sm }, primaryButton: { flex: 1, minHeight: 52, borderRadius: RADIUS.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: SPACING.lg, paddingHorizontal: SPACING.md }, primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" }, secondaryButton: { flex: 1, minHeight: 52, borderRadius: RADIUS.lg, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: SPACING.lg, paddingHorizontal: SPACING.md }, secondaryButtonText: { color: colors.primaryDark, fontSize: 15, fontWeight: "700" }, permissionDenied: { color: colors.danger, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: SPACING.lg },
}); }
