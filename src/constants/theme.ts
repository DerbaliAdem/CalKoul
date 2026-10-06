export { LIGHT_COLORS as COLORS } from "./colors";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  card: { shadowColor: "#14251A", shadowOpacity: 0.055, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  floating: { shadowColor: "#14251A", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
} as const;

export const MOTION = { pressInMs: 120, pressOutMs: 180, enterMs: 320, progressMs: 620 } as const;
export const ICON_SIZE = { sm: 16, md: 20, lg: 24, xl: 30 } as const;

export const TYPOGRAPHY = {
  caption: 12,
  body: 15,
  subtitle: 18,
  heading: 24,
  display: 32,
  screenTitle: 30,
  sectionTitle: 20,
  cardTitle: 16,
  stat: 36,
} as const;
