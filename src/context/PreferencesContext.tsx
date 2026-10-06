import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Appearance, I18nManager, Platform, StyleSheet, View, useColorScheme } from "react-native";
import { DARK_COLORS, LIGHT_COLORS, type ColorPalette } from "../constants/colors";
import { COLORS } from "../constants/theme";
import { translate, type Language, type TranslationKey } from "../i18n/translations";

export type ThemeMode = "system" | "light" | "dark";
type ThemeContextValue = { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void; colors: ColorPalette; resolvedTheme: "light" | "dark" };
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; isRTL: boolean; t: (key: TranslationKey, values?: Record<string, string | number>) => string };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LanguageContext = createContext<LanguageContextValue | null>(null);
const THEME_KEY = "calkoul.preference.theme";
const LANGUAGE_KEY = "calkoul.preference.language";

function isThemeMode(value: string | null): value is ThemeMode { return value === "system" || value === "light" || value === "dark"; }
function isLanguage(value: string | null): value is Language { return value === "en" || value === "fr" || value === "ar" || value === "de"; }

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [language, setLanguageState] = useState<Language>("en");
  const [ready, setReady] = useState(false);
  const resolvedTheme = themeMode === "system" ? (systemColorScheme === "dark" ? "dark" : "light") : themeMode;
  const colors = resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const isRTL = language === "ar";

  useEffect(() => {
    let mounted = true;
    void Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(LANGUAGE_KEY)])
      .then(([storedTheme, storedLanguage]) => {
        if (!mounted) return;
        if (isThemeMode(storedTheme)) setThemeModeState(storedTheme);
        if (isLanguage(storedLanguage)) setLanguageState(storedLanguage);
      })
      .catch(() => undefined)
      .finally(() => { if (mounted) setReady(true); });
    I18nManager.allowRTL(true);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // react-native-web exposes getColorScheme/addChangeListener, but not
    // setColorScheme. The app applies its own palette on every platform.
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(themeMode === "system" ? "unspecified" : resolvedTheme);
    }
  }, [resolvedTheme, themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(THEME_KEY, mode).catch(() => undefined);
  };
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    void AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage).catch(() => undefined);
  };

  const themeValue = useMemo(() => ({ themeMode, setThemeMode, colors, resolvedTheme }), [themeMode, colors, resolvedTheme]);
  const languageValue = useMemo(() => ({ language, setLanguage, isRTL, t: (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values) }), [language, isRTL]);

  if (!ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return <ThemeContext.Provider value={themeValue}><LanguageContext.Provider value={languageValue}><View style={[styles.app, { backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }]}>{children}</View></LanguageContext.Provider></ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within PreferencesProvider");
  return value;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within PreferencesProvider");
  return value;
}

const styles = StyleSheet.create({ app: { flex: 1 }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background } });
