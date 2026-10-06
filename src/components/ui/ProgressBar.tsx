import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../context/PreferencesContext";
import { useProgressMotion } from "./Motion";

export default function ProgressBar({ progress, height = 9, trackColor, fillColor, style }: { progress: number; height?: number; trackColor?: string; fillColor?: string; style?: ViewStyle }) {
  const { colors } = useTheme();
  const fillStyle = useProgressMotion(progress);
  return <View style={[styles.track, { height, backgroundColor: trackColor ?? colors.surfaceSecondary, marginTop: SPACING.sm }, style]}><Animated.View style={[styles.fill, { backgroundColor: fillColor ?? colors.primary }, fillStyle]} /></View>;
}
const styles = StyleSheet.create({ track: { width: "100%", overflow: "hidden", borderRadius: RADIUS.full }, fill: { height: "100%", borderRadius: RADIUS.full } });
