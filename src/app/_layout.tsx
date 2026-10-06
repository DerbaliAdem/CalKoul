import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MealProvider } from "../features/meals/MealContext";
import { ProfileProvider } from "../features/profile/ProfileContext";
import { ActivityProvider } from "../features/activity/ActivityContext";
import { PreferencesProvider, useTheme } from "../context/PreferencesContext";

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <ThemedNavigation />
    </PreferencesProvider>
  );
}

function ThemedNavigation() {
  const { resolvedTheme } = useTheme();
  return <ProfileProvider><ActivityProvider><MealProvider>
    <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
  </MealProvider></ActivityProvider></ProfileProvider>;
}
