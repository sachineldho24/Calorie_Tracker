/**
 * Kinetic Noir — Typography, Spacing & Shape Tokens
 * Font override: ALL roles use Inter (user requirement)
 */
import { TextStyle } from 'react-native';

// === Typography ===
// User override: Inter replaces Syne (display) + DM Sans (body)
export const FontFamily = {
  display: 'Inter_800ExtraBold',
  heading: 'Inter_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  label: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const Typography: Record<string, TextStyle> = {
  numHero: {
    fontFamily: FontFamily.extraBold,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -1.04,
  },
  numHeroMobile: {
    fontFamily: FontFamily.extraBold,
    fontSize: 42,
    lineHeight: 42,
  },
  heroData: {
    fontFamily: FontFamily.extraBold,
    fontSize: 38,
    lineHeight: 38,
  },
  screenTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    lineHeight: 26.4,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 13,
    lineHeight: 15.6,
    letterSpacing: 1.95,
    textTransform: 'uppercase',
  },
  dataLabel: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    lineHeight: 19.2,
  },
  bodyLg: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 20.8,
  },
  labelXs: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
  },
  buttonText: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    lineHeight: 19.2,
  },
  tabLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
  },
};

// === Spacing ===
export const Spacing = {
  unit: 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pagePadding: 20,
  sectionGap: 24,
  cardGap: 12,
  innerPadding: 16,
  weekStripGap: 6,
  safeTop: 44,
  safeBottom: 90,
  maxContentWidth: 480,
};

// === Roundness ===
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// === Shadows ===
export const Shadows = {
  fabGlow: {
    shadowColor: 'rgba(168, 255, 120, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  cardSubtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};
