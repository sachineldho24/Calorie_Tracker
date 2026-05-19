/**
 * MacroRings — Animated concentric circular progress bars
 * The visual centerpiece of the dashboard
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { Typography, FontFamily } from '../constants/Theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingConfig {
  progress: number; // 0-1
  color: string;
  radius: number;
  strokeWidth: number;
}

interface MacroRingsProps {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  size?: number;
}

function ProgressRing({
  progress,
  color,
  radius,
  strokeWidth,
  size,
}: RingConfig & { size: number }) {
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 1), {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <>
      {/* Background ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeOpacity={0.15}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress ring */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        animatedProps={animatedProps}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </>
  );
}

export default function MacroRings({
  caloriesConsumed,
  caloriesTarget,
  proteinConsumed,
  proteinTarget,
  carbsConsumed,
  carbsTarget,
  fatConsumed,
  fatTarget,
  size = 200,
}: MacroRingsProps) {
  const remaining = Math.max(0, caloriesTarget - caloriesConsumed);
  const strokeWidth = 10;
  const gap = 14;

  const rings: RingConfig[] = [
    {
      progress: caloriesTarget > 0 ? caloriesConsumed / caloriesTarget : 0,
      color: Colors.macroCalories,
      radius: (size / 2) - strokeWidth,
      strokeWidth: strokeWidth + 2,
    },
    {
      progress: proteinTarget > 0 ? proteinConsumed / proteinTarget : 0,
      color: Colors.macroProtein,
      radius: (size / 2) - strokeWidth - gap,
      strokeWidth,
    },
    {
      progress: carbsTarget > 0 ? carbsConsumed / carbsTarget : 0,
      color: Colors.macroCarb,
      radius: (size / 2) - strokeWidth - gap * 2,
      strokeWidth,
    },
    {
      progress: fatTarget > 0 ? fatConsumed / fatTarget : 0,
      color: Colors.macroFat,
      radius: (size / 2) - strokeWidth - gap * 3,
      strokeWidth: strokeWidth - 2,
    },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {rings.map((ring, i) => (
          <ProgressRing key={i} {...ring} size={size} />
        ))}
      </Svg>
      <View style={styles.centerText}>
        <Text style={styles.remainingNumber}>{remaining}</Text>
        <Text style={styles.remainingLabel}>REMAINING</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  remainingNumber: {
    fontFamily: FontFamily.extraBold,
    fontSize: 36,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  remainingLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
});
