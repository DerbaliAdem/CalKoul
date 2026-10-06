import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { RADIUS, SPACING } from "../../constants/theme";
import type { ColorPalette } from "../../constants/colors";
import { useLanguage, useTheme } from "../../context/PreferencesContext";
import { useProfile } from "../../features/profile/ProfileContext";
import { useMeals } from "../../features/meals/MealContext";
import { buildNutritionContext } from "../../services/ai/nutritionContext";
import { askNutritionAssistant } from "../../services/ai/aiService";
import type { AssistantMessage } from "../../services/ai/aiTypes";
import type { TranslationKey } from "../../i18n/translations";

const suggestions: TranslationKey[] = ["assistant.promptToday", "assistant.promptFoods", "assistant.promptProtein", "assistant.promptNextMeal"];

export default function AssistantScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, isRTL, t } = useLanguage();
  const { profile } = useProfile();
  const { entries } = useMeals();
  const styles = createStyles(colors);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<"notConfigured" | "request" | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, isSending]);

  const sendQuestion = async (question: string, addUserMessage = true) => {
    const cleanQuestion = question.trim().slice(0, 1000);
    if (!cleanQuestion || isSending) return;
    if (addUserMessage) setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: cleanQuestion }]);
    setDraft("");
    setIsSending(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const context = buildNutritionContext(profile, entries, language);
      const answer = await askNutritionAssistant({ question: cleanQuestion, context, signal: controller.signal });
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content: answer }]);
      setFailedQuestion(null);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setFailedQuestion(cleanQuestion);
      setError(failure instanceof Error && failure.message === "not-configured" ? "notConfigured" : "request");
    } finally {
      if (!controller.signal.aborted) setIsSending(false);
    }
  };

  const clearConversation = () => { controllerRef.current?.abort(); setIsSending(false); setMessages([]); setError(null); setFailedQuestion(null); };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Stack.Screen options={{ title: t("assistant.title"), headerShown: false }} />
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} style={styles.iconButton}><Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={21} color={colors.text} /></Pressable><View style={styles.headerTitle}><Text style={styles.title}>{t("assistant.title")}</Text><Text style={styles.subtitle}>{t("assistant.subtitle")}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={t("assistant.clear")} onPress={clearConversation} disabled={!messages.length} style={styles.iconButton}><Ionicons name="trash-outline" size={19} color={messages.length ? colors.textSecondary : colors.border} /></Pressable></View>
    <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
      {!messages.length && <View style={styles.welcome}><View style={styles.assistantMark}><Ionicons name="sparkles" size={25} color={colors.primaryDark} /></View><Text style={styles.welcomeTitle}>{t("assistant.welcome")}</Text><Text style={styles.welcomeText}>{t("assistant.contextNote")}</Text><View style={styles.suggestions}>{suggestions.map((key) => <Pressable key={key} accessibilityRole="button" onPress={() => void sendQuestion(t(key))} style={styles.suggestion}><Text style={styles.suggestionText}>{t(key)}</Text><Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={16} color={colors.primaryDark} /></Pressable>)}</View></View>}
      {messages.map((message) => <View key={message.id} style={[styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage]}><Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>{message.content}</Text></View>)}
      {isSending && <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>{t("assistant.thinking")}</Text></View>}
    </ScrollView>
    {error && <View style={styles.errorBox}><Text style={styles.errorText}>{t(error === "notConfigured" ? "assistant.notConfigured" : "assistant.requestError")}</Text>{error === "request" && failedQuestion && <Pressable accessibilityRole="button" onPress={() => void sendQuestion(failedQuestion, false)}><Text style={styles.retry}>{t("common.tryAgain")}</Text></Pressable>}</View>}
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder={t("assistant.placeholder")} placeholderTextColor={colors.textSecondary} multiline maxLength={1000} accessibilityLabel={t("assistant.placeholder")} style={[styles.input, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]} /><Pressable accessibilityRole="button" accessibilityLabel={t("assistant.send")} disabled={!draft.trim() || isSending} onPress={() => void sendQuestion(draft)} style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendDisabled]}>{isSending ? <ActivityIndicator color={colors.white} /> : <Ionicons name="send" size={19} color={colors.white} />}</Pressable></View>
    <Text style={styles.disclaimer}>{t("assistant.disclaimer")}</Text>
  </KeyboardAvoidingView>;
}

function createStyles(colors: ColorPalette) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: SPACING.md }, header: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }, iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.full, backgroundColor: colors.surface }, headerTitle: { flex: 1 }, title: { color: colors.text, fontSize: 19, fontWeight: "800" }, subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 }, messages: { flex: 1 }, messageContent: { padding: SPACING.md, paddingBottom: SPACING.lg, flexGrow: 1 }, welcome: { flex: 1, justifyContent: "center", paddingVertical: SPACING.xl }, assistantMark: { alignSelf: "center", width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }, welcomeTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center", marginTop: SPACING.md }, welcomeText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: SPACING.sm, marginBottom: SPACING.lg }, suggestions: { gap: SPACING.sm }, suggestion: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, paddingHorizontal: SPACING.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md }, suggestionText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" }, message: { maxWidth: "88%", padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm }, userMessage: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 5 }, assistantMessage: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 }, messageText: { color: colors.text, fontSize: 14, lineHeight: 21 }, userMessageText: { color: colors.white }, loading: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: SPACING.sm, padding: SPACING.md }, loadingText: { color: colors.textSecondary, fontSize: 13 }, errorBox: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md, backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border }, errorText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 }, retry: { color: colors.primaryDark, fontWeight: "700", marginTop: SPACING.sm }, composer: { flexDirection: "row", alignItems: "flex-end", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }, input: { flex: 1, maxHeight: 120, minHeight: 46, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: colors.text, backgroundColor: colors.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border }, sendButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.full, backgroundColor: colors.primary }, sendDisabled: { opacity: 0.45 }, disclaimer: { color: colors.textSecondary, fontSize: 10, textAlign: "center", paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs },
}); }
