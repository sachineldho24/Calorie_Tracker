/**
 * MacroBar — Horizontal progress bar for individual macros
 * Used in dashboard and diary summaries
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, consumed, target, color, unit = 'g' }: MacroBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(target > 0 ? Math.min(consumed / target, 1) : 0, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [consumed, target]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  const remaining = Math.max(0, target - consumed);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.values}>
          <Text style={{ color: Colors.textPrimary }}>{Math.round(consumed)}</Text>
          <Text style={{ color: Colors.textMuted }}> / {Math.round(target)}{unit}</Text>
        </Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: `${color}22` }]}>
        <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={styles.remaining}>{Math.round(remaining)}{unit} left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: FontFamily.heading,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  values: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  remaining: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
