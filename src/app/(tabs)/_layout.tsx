import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import type { ComponentProps } from "react";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ColorValue } from "react-native";
import { useLanguage, useTheme } from "../../context/PreferencesContext";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: { height: 58 + insets.bottom, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
  }}>
    <Tabs.Screen name="index" options={{ title: t("tabs.home"), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name={focused ? "home" : "home-outline"} size={size} color={color} focused={focused} /> }} />
    <Tabs.Screen name="foods" options={{ title: t("tabs.foods"), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name={focused ? "restaurant" : "restaurant-outline"} size={size} color={color} focused={focused} /> }} />
    <Tabs.Screen name="scan" options={{ title: t("tabs.scan"), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name={focused ? "camera" : "camera-outline"} size={size} color={color} focused={focused} /> }} />
    <Tabs.Screen name="history" options={{ title: t("tabs.history"), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name={focused ? "stats-chart" : "stats-chart-outline"} size={size} color={color} focused={focused} /> }} />
    <Tabs.Screen name="profile" options={{ title: t("tabs.profile"), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name={focused ? "person" : "person-outline"} size={size} color={color} focused={focused} /> }} />
    <Tabs.Screen name="assistant" options={{ href: null }} />
  </Tabs>;
}

function AnimatedTabIcon({ name, size, color, focused }: { name: ComponentProps<typeof Ionicons>["name"]; size: number; color: ColorValue; focused: boolean }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = reduceMotion ? 1 : withSpring(focused ? 1.08 : 1, { damping: 18, stiffness: 220 }); }, [focused, reduceMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}><Ionicons name={name} size={size} color={color} /></Animated.View>;
}
