import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/PreferencesContext";
import type { Food } from "../../types/food";
import type { LoggedFood, MealType } from "../../types/meal";
import { nutritionForQuantity } from "../../services/nutrition/nutritionMath";
import { loadMeals, localDateKey, persistMeals } from "./mealStorage";
import { useProfile } from "../profile/ProfileContext";
import { calculateNutritionTargets } from "../../services/nutrition/nutritionCalculator";

type MealContextValue = {
  entries: LoggedFood[];
  todaysEntries: LoggedFood[];
  ready: boolean;
  saving: boolean;
  persistenceError: boolean;
  addFood: (food: Food, quantity: number, meal: MealType) => void;
  removeFood: (id: string) => void;
  clearHistory: () => Promise<boolean>;
};

const MealContext = createContext<MealContextValue | null>(null);

export function MealProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<LoggedFood[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const entriesRef = useRef<LoggedFood[]>([]);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    void loadMeals()
      .then((loaded) => {
        if (!mounted) return;
        entriesRef.current = loaded;
        setEntries(loaded);
      })
      .catch(() => { if (mounted) setPersistenceError(true); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  const commit = useCallback((next: LoggedFood[]) => {
    entriesRef.current = next;
    setEntries(next);
    setSaving(true);
    writeQueue.current = writeQueue.current.then(() => persistMeals(next)).then(() => {
      setPersistenceError(false);
    }).catch(() => {
      setPersistenceError(true);
    }).finally(() => {
      setSaving(false);
    });
  }, []);

  const clearHistory = useCallback(async () => {
    entriesRef.current = [];
    setEntries([]);
    setSaving(true);
    try { await persistMeals([]); setPersistenceError(false); return true; }
    catch { setPersistenceError(true); return false; }
    finally { setSaving(false); }
  }, []);

  const addFood = useCallback((food: Food, quantity: number, meal: MealType) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const createdAt = new Date().toISOString();
    const targets = calculateNutritionTargets(profile);
    const entry: LoggedFood = {
      id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      food: { ...food },
      quantity,
      meal,
      date: localDateKey(new Date(createdAt)),
      createdAt,
      nutrition: nutritionForQuantity(food, quantity),
      dailyTargetCalories: targets.available ? targets.dailyCalories : null,
    };
    commit([...entriesRef.current, entry]);
  }, [commit, profile]);

  const removeFood = useCallback((id: string) => {
    const next = entriesRef.current.filter((entry) => entry.id !== id);
    if (next.length !== entriesRef.current.length) commit(next);
  }, [commit]);

  const todaysEntries = useMemo(() => {
    const today = localDateKey();
    return entries.filter((entry) => entry.date === today);
  }, [entries]);
  const value = useMemo(() => ({ entries, todaysEntries, ready, saving, persistenceError, addFood, removeFood, clearHistory }), [entries, todaysEntries, ready, saving, persistenceError, addFood, removeFood, clearHistory]);

  if (!ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  return <MealContext.Provider value={value}>{children}</MealContext.Provider>;
}

export function useMeals() {
  const context = useContext(MealContext);
  if (!context) throw new Error("useMeals must be used within MealProvider");
  return context;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center" } });
