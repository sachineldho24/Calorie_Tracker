/**
 * FoodCard — Individual food entry in the diary
 * Features macro chips, calorie display, and meal icon
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';
import { FoodEntry } from '../lib/nutrition';
import MacroChip from './MacroChip';

interface FoodCardProps {
  entry: FoodEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export default function FoodCard({ entry, onPress, onDelete }: FoodCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={MEAL_ICONS[entry.mealType] || 'restaurant-outline'}
          size={20}
          color={Colors.primary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.calories}>{entry.calories} kcal</Text>
        </View>

        <Text style={styles.serving}>{entry.servingDescription}</Text>

        <View style={styles.macroRow}>
          <MacroChip label="P" value={entry.proteinG} color="protein" />
          <MacroChip label="C" value={entry.carbsG} color="carb" />
          <MacroChip label="F" value={entry.fatG} color="fat" />
        </View>

        {entry.confidence && entry.confidence !== 'high' && (
          <View style={styles.confidenceRow}>
            <Ionicons name="information-circle-outline" size={12} color={Colors.statusWarning} />
            <Text style={styles.confidenceText}>
              AI estimate · {entry.confidence} confidence
            </Text>
          </View>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.macroCaloriesBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: FontFamily.heading,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  calories: {
    fontFamily: FontFamily.heading,
    fontSize: 14,
    color: Colors.primary,
  },
  serving: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  confidenceText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.statusWarning,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
