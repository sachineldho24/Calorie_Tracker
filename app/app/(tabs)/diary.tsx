/**
 * Food Diary — Chronological meal log
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { useApp } from '../../context/AppContext';
import WeekStrip from '../../components/WeekStrip';
import FoodCard from '../../components/FoodCard';
import { FoodEntry } from '../../lib/nutrition';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks',
};

export default function DiaryScreen() {
  const { summary, selectedDate, setSelectedDate, targets, removeEntry } = useApp();

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = summary.entries.filter(e => e.mealType === meal);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  const isEmpty = summary.entries.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Diary</Text>
        <View style={styles.calBadge}>
          <Text style={styles.calText}>{summary.totalCalories} kcal</Text>
        </View>
      </View>

      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isEmpty ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.surfaceContainerHigh} />
            <Text style={styles.emptyTitle}>No meals logged</Text>
            <Text style={styles.emptyDesc}>Tap the + button to scan your first meal</Text>
          </View>
        ) : (
          MEAL_ORDER.map(meal => {
            const entries = grouped[meal];
            if (entries.length === 0) return null;
            const mealCal = entries.reduce((s, e) => s + e.calories, 0);

            return (
              <View key={meal} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTitle}>{MEAL_LABELS[meal]}</Text>
                  <Text style={styles.mealCal}>{mealCal} kcal</Text>
                </View>
                <View style={styles.mealEntries}>
                  {entries.map(entry => (
                    <FoodCard key={entry.id} entry={entry} onDelete={() => removeEntry(entry.id)} />
                  ))}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary },
  calBadge: { backgroundColor: Colors.macroCaloriesBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  calText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontFamily: FontFamily.heading, fontSize: 18, color: Colors.textPrimary },
  emptyDesc: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textMuted },
  mealSection: { marginBottom: 24 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealTitle: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  mealCal: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  mealEntries: { gap: 12 },
});
