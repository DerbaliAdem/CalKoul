import { useEffect, type PropsWithChildren } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { MOTION } from "../../constants/theme";

const MotionPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle> };

export function AnimatedPressable({ style, onPressIn, onPressOut, ...props }: AnimatedPressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <MotionPressable {...props}
    onPressIn={(event) => { if (!reduceMotion) {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are designed for event-driven updates.
      scale.value = withTiming(0.975, { duration: MOTION.pressInMs, easing: Easing.out(Easing.quad) });
    } onPressIn?.(event); }}
    onPressOut={(event) => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are designed for event-driven updates.
      scale.value = withTiming(1, { duration: MOTION.pressOutMs, easing: Easing.out(Easing.quad) }); onPressOut?.(event);
    }}
    style={[style, animatedStyle]} />;
}

export function Entrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const reduceMotion = useReducedMotion();
  return <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(MOTION.enterMs).delay(delay)} style={style}>{children}</Animated.View>;
}

export function useProgressMotion(progress: number) {
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(0);
  useEffect(() => { width.value = reduceMotion ? progress : withTiming(progress, { duration: MOTION.progressMs, easing: Easing.out(Easing.cubic) }); }, [progress, reduceMotion, width]);
  return useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(width.value, 100))}%` }));
}
