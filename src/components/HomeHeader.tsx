import { StyleSheet, Text, View } from "react-native";
import { SPACING } from "../constants/theme";
import { useTheme } from "../context/PreferencesContext";

export default function HomeHeader({ greeting = "Welcome back", name = "Calkoul" }: { greeting?: string; name?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container}><Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text><Text style={[styles.name, { color: colors.text }]}>{name}</Text></View>;
}

const styles = StyleSheet.create({ container: { marginBottom: SPACING.lg }, greeting: { fontSize: 14 }, name: { fontSize: 30, fontWeight: "800", marginTop: 3 } });
