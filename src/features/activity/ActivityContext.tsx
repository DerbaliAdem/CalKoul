import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import type { UserProfile } from "../../types/user";
import { useProfile } from "../profile/ProfileContext";
import { calculateActivityEstimates, DEFAULT_STEP_GOAL, localActivityDateKey, validateStepGoal } from "./activityUtils";
import { loadActivityData, persistActivityData, type ActivityStorageData } from "./activityStorage";
import { getPedometerAccess, getTodaySensorSteps, requestPedometerAccess, watchPedometer } from "./activityService";
import type { ActivityDay, ActivityPermissionState } from "./activityTypes";

type ActivityContextValue = {
  days: ActivityDay[];
  today: ActivityDay | null;
  stepGoal: number;
  permission: ActivityPermissionState;
  permissionCanAskAgain: boolean;
  ready: boolean;
  saving: boolean;
  storageError: boolean;
  requestPermission: () => Promise<void>;
  setStepGoal: (goal: number) => Promise<boolean>;
  getDay: (date: string) => ActivityDay | null;
  setManualSteps: (date: string, steps: number) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [data, setData] = useState<ActivityStorageData>({ stepGoal: DEFAULT_STEP_GOAL, days: [] });
  const [permission, setPermission] = useState<ActivityPermissionState>("loading");
  const [permissionCanAskAgain, setPermissionCanAskAgain] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const dataRef = useRef(data);
  const profileRef = useRef<UserProfile>(profile);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const writeQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const sessionBaseRef = useRef<{ date: string; steps: number } | null>(null);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  const commit = useCallback((next: ActivityStorageData) => {
    dataRef.current = next;
    setData(next);
    setSaving(true);
    const write = writeQueue.current.then(() => persistActivityData(next)).then(() => {
      setStorageError(false);
      return true;
    }).catch(() => {
      setStorageError(true);
      return false;
    }).finally(() => {
      setSaving(false);
    });
    writeQueue.current = write;
    return write;
  }, []);

  const recordSteps = useCallback((date: string, steps: number) => {
    if (dataRef.current.days.some((day) => day.date === date && day.source === "manual")) return;
    const safeSteps = Math.max(0, Math.round(steps));
    const estimates = calculateActivityEstimates(safeSteps, profileRef.current);
    const day: ActivityDay = {
      date, steps: safeSteps, stepGoal: dataRef.current.stepGoal,
      distanceMeters: estimates.distanceMeters ?? 0,
      activeCalories: estimates.activeCalories,
      updatedAt: new Date().toISOString(),
      source: "sensor",
    };
    const days = [day, ...dataRef.current.days.filter((existing) => existing.date !== date)].sort((left, right) => right.date.localeCompare(left.date));
    commit({ ...dataRef.current, days });
  }, [commit]);

  useEffect(() => {
    let mounted = true;
    void loadActivityData().then((loaded) => {
      if (!mounted) return;
      dataRef.current = loaded;
      setData(loaded);
      setStorageError(false);
    }).catch(() => {
      if (mounted) setStorageError(true);
    }).finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    void getPedometerAccess().then((access) => {
      if (!mounted) return;
      setPermission(access.permission);
      setPermissionCanAskAgain(access.canAskAgain);
    }).catch(() => {
      if (mounted) setPermission("error");
    });
    return () => { mounted = false; };
  }, [ready]);

  useEffect(() => {
    if (!ready || permission !== "granted") return;
    let mounted = true;
    const date = localActivityDateKey();
    const storedSteps = dataRef.current.days.find((day) => day.date === date)?.steps ?? 0;
    sessionBaseRef.current = { date, steps: storedSteps };

    void getTodaySensorSteps().then((sensorSteps) => {
      if (!mounted) return;
      if (sensorSteps !== null) {
        sessionBaseRef.current = { date, steps: sensorSteps };
        recordSteps(date, sensorSteps);
      }
      subscriptionRef.current?.remove();
      subscriptionRef.current = watchPedometer((sessionSteps) => {
        const session = sessionBaseRef.current;
        if (!session) return;
        if (Platform.OS === "ios") {
          void getTodaySensorSteps().then((todaySteps) => {
            if (mounted && todaySteps !== null) recordSteps(session.date, todaySteps);
          }).catch(() => { if (mounted) setPermission("error"); });
        } else {
          recordSteps(session.date, session.steps + sessionSteps);
        }
      });
    }).catch(() => {
      if (mounted) setPermission("error");
    });

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [ready, permission, recordSteps]);

  const requestPermission = useCallback(async () => {
    setPermission("loading");
    try {
      const access = await requestPedometerAccess();
      setPermission(access.permission);
      setPermissionCanAskAgain(access.canAskAgain);
    } catch {
      setPermission("error");
    }
  }, []);

  const setStepGoal = useCallback(async (goal: number) => {
    if (!validateStepGoal(goal)) return false;
    const date = localActivityDateKey();
    const days = dataRef.current.days.map((day) => day.date === date ? { ...day, stepGoal: goal, updatedAt: new Date().toISOString() } : day);
    return commit({ stepGoal: goal, days });
  }, [commit]);

  const setManualSteps = useCallback(async (dayDate: string, steps: number) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayDate) || !Number.isInteger(steps) || steps < 0 || steps > 100000) return false;
    const estimates = calculateActivityEstimates(steps, profileRef.current);
    const day: ActivityDay = { date: dayDate, steps, stepGoal: dataRef.current.days.find((item) => item.date === dayDate)?.stepGoal ?? dataRef.current.stepGoal, distanceMeters: estimates.distanceMeters ?? 0, activeCalories: estimates.activeCalories, updatedAt: new Date().toISOString(), source: "manual" };
    const days = [day, ...dataRef.current.days.filter((item) => item.date !== dayDate)].sort((left, right) => right.date.localeCompare(left.date));
    const saved = await commit({ ...dataRef.current, days });
    if (dayDate === localActivityDateKey()) sessionBaseRef.current = { date: dayDate, steps };
    return saved;
  }, [commit]);

  const clearHistory = useCallback(() => commit({ ...dataRef.current, days: [] }), [commit]);

  const date = localActivityDateKey();
  const today = data.days.find((day) => day.date === date) ?? null;
  const getDay = useCallback((dayDate: string) => data.days.find((day) => day.date === dayDate) ?? null, [data.days]);
  const value = useMemo(() => ({ days: data.days, today, stepGoal: data.stepGoal, permission, permissionCanAskAgain, ready, saving, storageError, requestPermission, setStepGoal, getDay, setManualSteps, clearHistory }), [data.days, today, data.stepGoal, permission, permissionCanAskAgain, ready, saving, storageError, requestPermission, setStepGoal, getDay, setManualSteps, clearHistory]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivity must be used within ActivityProvider");
  return context;
}
