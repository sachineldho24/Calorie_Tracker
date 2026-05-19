/**
 * Kinetic Noir — Design Token Color System
 * All colors from the DESIGN.md with Inter font override
 */

const Colors = {
  // === Base Canvas ===
  background: '#0C0C14',
  surface: '#13131b',
  surfaceDim: '#13131b',
  surfaceBright: '#393842',
  surfaceCard: '#1A1A28',

  // === Surface Containers ===
  surfaceContainerLowest: '#0d0d15',
  surfaceContainerLow: '#1b1b23',
  surfaceContainer: '#1f1f27',
  surfaceContainerHigh: '#292932',
  surfaceContainerHighest: '#34343d',

  // === On Surface ===
  onSurface: '#e4e1ed',
  onSurfaceVariant: '#c0cab5',
  inverseSurface: '#e4e1ed',
  inverseOnSurface: '#302f39',

  // === Primary (Electric Lime) ===
  primary: '#A8FF78',
  primaryDim: '#87db59',
  primaryContainer: '#a2f872',
  onPrimary: '#133800',
  onPrimaryContainer: '#2e7300',
  inversePrimary: '#2b6c00',

  // === Secondary ===
  secondary: '#c7c5d4',
  secondaryContainer: '#464552',
  onSecondary: '#302f3b',
  onSecondaryContainer: '#b6b3c3',

  // === Tertiary ===
  tertiary: '#ffffff',
  tertiaryContainer: '#e2e0fb',
  onTertiary: '#2f2f43',
  onTertiaryContainer: '#636279',

  // === Error ===
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // === Functional Outline ===
  outline: '#8a9481',
  outlineVariant: '#404a39',
  surfaceTint: '#87db59',
  border: '#2A2A3E',

  // === Typography Colors ===
  textPrimary: '#EEEEF8',
  textMuted: '#6B6B90',
  textWhite: '#FFFFFF',

  // === Macro Colors ===
  macroProtein: '#64B5FF',
  macroCarb: '#FFB347',
  macroFat: '#FF6B8A',
  macroCalories: '#A8FF78',

  // === Status ===
  statusWarning: '#FFDD57',
  statusSuccess: '#A8FF78',
  statusError: '#FF6B8A',

  // === Transparent Macro Backgrounds (15% opacity) ===
  macroProteinBg: 'rgba(100, 181, 255, 0.15)',
  macroCarbBg: 'rgba(255, 179, 71, 0.15)',
  macroFatBg: 'rgba(255, 107, 138, 0.15)',
  macroCaloriesBg: 'rgba(168, 255, 120, 0.15)',

  // === FAB Glow ===
  fabGlow: 'rgba(168, 255, 120, 0.35)',
};

export default Colors;
