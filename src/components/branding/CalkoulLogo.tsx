import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../context/PreferencesContext";

type Props = { size?: "small" | "medium" | "large"; iconOnly?: boolean };

const sizes = { small: { mark: 34, icon: 19, word: 18 }, medium: { mark: 42, icon: 23, word: 22 }, large: { mark: 54, icon: 30, word: 28 } };

export default function CalkoulLogo({ size = "medium", iconOnly = false }: Props) {
  const { colors } = useTheme();
  const metrics = sizes[size];
  return <View accessible accessibilityRole="image" accessibilityLabel="Calkoul" style={styles.container}>
    <View style={[styles.mark, { width: metrics.mark, height: metrics.mark, borderRadius: RADIUS.md, backgroundColor: colors.primaryLight }]}>
      <Ionicons name="leaf" size={metrics.icon} color={colors.primaryDark} />
    </View>
    {!iconOnly && <Text style={[styles.wordmark, { color: colors.text, fontSize: metrics.word }]}>Calkoul</Text>}
  </View>;
}

const styles = StyleSheet.create({ container: { flexDirection: "row", alignItems: "center", gap: SPACING.sm }, mark: { alignItems: "center", justifyContent: "center" }, wordmark: { fontWeight: "800", letterSpacing: -0.6 } });
