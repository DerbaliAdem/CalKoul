import { Pedometer } from "expo-sensors";
import { Platform } from "react-native";
import type { EventSubscription } from "expo-modules-core";
import { startOfLocalDay } from "./activityUtils";
import type { ActivityPermissionState } from "./activityTypes";

export type PedometerAccess = { available: boolean; permission: ActivityPermissionState; canAskAgain: boolean };

export async function getPedometerAccess(): Promise<PedometerAccess> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return { available: false, permission: "unavailable", canAskAgain: false };
  }

  const available = await Pedometer.isAvailableAsync();
  if (!available) return { available: false, permission: "unavailable", canAskAgain: false };
  const permission = await Pedometer.getPermissionsAsync();
  return {
    available: true,
    permission: permission.granted ? "granted" : permission.status === "undetermined" ? "notRequested" : "denied",
    canAskAgain: permission.canAskAgain,
  };
}

export async function requestPedometerAccess(): Promise<PedometerAccess> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return { available: false, permission: "unavailable", canAskAgain: false };
  }

  const available = await Pedometer.isAvailableAsync();
  if (!available) return { available: false, permission: "unavailable", canAskAgain: false };
  const permission = await Pedometer.requestPermissionsAsync();
  return {
    available: true,
    permission: permission.granted ? "granted" : "denied",
    canAskAgain: permission.canAskAgain,
  };
}

export async function getTodaySensorSteps(): Promise<number | null> {
  if (Platform.OS !== "ios") return null;
  const result = await Pedometer.getStepCountAsync(startOfLocalDay(), new Date());
  return result ? result.steps : null;
}

export function watchPedometer(onSteps: (steps: number) => void): EventSubscription {
  return Pedometer.watchStepCount(({ steps }) => onSteps(steps));
}
