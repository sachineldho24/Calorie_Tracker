/**
 * MacroChip — Small pill-shaped macro tag
 * 15% opacity background with full color text
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';

interface MacroChipProps {
  label: string; // P, C, F
  value: number;
  color: 'protein' | 'carb' | 'fat' | 'calories';
  unit?: string;
}

const COLOR_MAP = {
  protein: { text: Colors.macroProtein, bg: Colors.macroProteinBg },
  carb: { text: Colors.macroCarb, bg: Colors.macroCarbBg },
  fat: { text: Colors.macroFat, bg: Colors.macroFatBg },
  calories: { text: Colors.macroCalories, bg: Colors.macroCaloriesBg },
};

export default function MacroChip({ label, value, color, unit = 'g' }: MacroChipProps) {
  const colors = COLOR_MAP[color];

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {label} {Math.round(value)}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
