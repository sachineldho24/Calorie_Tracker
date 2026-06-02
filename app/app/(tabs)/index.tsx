/**
 * Home Dashboard — Macro rings + daily summary
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { useApp } from '../../context/AppContext';
import MacroRings from '../../components/MacroRings';
import WeekStrip from '../../components/WeekStrip';
import MacroBar from '../../components/MacroBar';
import * as Location from 'expo-location';
import AssistantCard from '../../components/AssistantCard';
import {
  getMealSuggestion,
  mealSlotForHour,
  MealSuggestion,
  MealSlot,
} from '../../lib/meal-assistant';
import { getCachedSuggestion, saveCachedSuggestion, getUseLocation } from '../../lib/storage';
import { getToday } from '../../lib/nutrition';
import {
  loadMemory,
  getNextQuestion,
  incrementSession,
  AssistantMemory,
  ONBOARDING_QUESTIONS,
} from '../../lib/assistant-memory';

/** Approximate region string from coarse location, only when the user opted in. */
async function resolveRegion(): Promise<string | null> {
  try {
    if (!(await getUseLocation())) return null;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const places = await Location.reverseGeocodeAsync(pos.coords);
    const p = places[0];
    return p ? [p.region, p.country].filter(Boolean).join(', ') || null : null;
  } catch {
    return null; // location is best-effort; never block the suggestion
  }
}

export default function HomeScreen() {
  const { targets, summary, profile, selectedDate, setSelectedDate, streak, waterGlasses, drinkWater } = useApp();
  const remaining = Math.max(0, targets.calories - summary.totalCalories);

  // === AI meal assistant ===
  const slot: MealSlot = mealSlotForHour(new Date().getHours());
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // === Assistant memory + engagement question ===
  const [memory, setMemory] = useState<AssistantMemory | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<typeof ONBOARDING_QUESTIONS[number] | null>(null);

  useEffect(() => {
    (async () => {
      let mem = await loadMemory();
      // Increment session count once per mount; show one question per session
      mem = await incrementSession(mem);
      setMemory(mem);
      // Only show a question on the first 6 sessions (one per session)
      if (mem.sessionCount <= 6) setPendingQuestion(getNextQuestion(mem));
    })();
  }, []);

  const loadSuggestion = useCallback(async (force = false) => {
    const today = getToday();
    if (!force) {
      const cached = await getCachedSuggestion<MealSuggestion>(today, slot);
      if (cached) { setSuggestion(cached); return; }
    }
    setSuggestionLoading(true);
    try {
      const region = await resolveRegion();
      const result = await getMealSuggestion({
        slot,
        remaining: {
          calories: Math.max(0, targets.calories - summary.totalCalories),
          proteinG: Math.max(0, targets.proteinG - summary.totalProtein),
          carbsG: Math.max(0, targets.carbsG - summary.totalCarbs),
          fatG: Math.max(0, targets.fatG - summary.totalFat),
        },
        goalType: profile?.goalType,
        region,
      });
      setSuggestion(result);
      if (!result.isFallback) await saveCachedSuggestion(today, slot, result);
    } finally {
      setSuggestionLoading(false);
    }
  }, [slot, targets, summary, profile]);

  useEffect(() => { loadSuggestion(); }, [slot]);

  const handleLogSuggestion = (s: MealSuggestion) => {
    router.push({
      pathname: '/review-edit',
      params: {
        scanData: JSON.stringify({
          confidence: 'medium',
          items: [{
            name: s.title,
            servingDescription: '1 serving',
            calories: s.estCalories,
            proteinG: s.estProteinG,
            carbsG: s.estCarbsG,
            fatG: s.estFatG,
          }],
          total: { calories: s.estCalories, proteinG: s.estProteinG, carbsG: s.estCarbsG, fatG: s.estFatG },
          notes: `AI suggestion — ${s.reason}`,
        }),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Kcal.AI</Text>
            <Text style={styles.date}>
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={Colors.macroCarb} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        {/* Week Strip */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {/* Macro Rings */}
        <View style={styles.ringsSection}>
          <MacroRings
            caloriesConsumed={summary.totalCalories}
            caloriesTarget={targets.calories}
            proteinConsumed={summary.totalProtein}
            proteinTarget={targets.proteinG}
            carbsConsumed={summary.totalCarbs}
            carbsTarget={targets.carbsG}
            fatConsumed={summary.totalFat}
            fatTarget={targets.fatG}
            size={220}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.totalCalories}</Text>
            <Text style={styles.statLabel}>EATEN</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{remaining}</Text>
            <Text style={styles.statLabel}>REMAINING</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{targets.calories}</Text>
            <Text style={styles.statLabel}>BUDGET</Text>
          </View>
        </View>

        {/* AI Meal Assistant */}
        <View style={styles.section}>
          <AssistantCard
            suggestion={suggestion}
            slot={slot}
            loading={suggestionLoading}
            onRefresh={() => loadSuggestion(true)}
            onLog={handleLogSuggestion}
            pendingQuestion={pendingQuestion}
            memory={memory}
            onQuestionAnswered={(updated) => {
              setMemory(updated);
              setPendingQuestion(getNextQuestion(updated));
              // Refresh suggestion with new memory context
              loadSuggestion(true);
            }}
          />
        </View>

        {/* Macro Bars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MACROS</Text>
          <View style={styles.macroCards}>
            <MacroBar label="Protein" consumed={summary.totalProtein} target={targets.proteinG} color={Colors.macroProtein} />
            <MacroBar label="Carbs" consumed={summary.totalCarbs} target={targets.carbsG} color={Colors.macroCarb} />
            <MacroBar label="Fat" consumed={summary.totalFat} target={targets.fatG} color={Colors.macroFat} />
          </View>
        </View>

        {/* Water */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WATER INTAKE</Text>
          <View style={styles.waterCard}>
            <View style={styles.waterGlasses}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < waterGlasses ? 'water' : 'water-outline'}
                  size={24}
                  color={i < waterGlasses ? Colors.macroProtein : Colors.surfaceContainerHigh}
                />
              ))}
            </View>
            <Text style={styles.waterText}>{waterGlasses} / 8 glasses</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  greeting: { fontFamily: FontFamily.extraBold, fontSize: 24, color: Colors.primary },
  date: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.macroCarbBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.macroCarb },
  ringsSection: { alignItems: 'center', paddingVertical: 24 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: Colors.surfaceCard, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: Colors.border },
  statCardAccent: { borderColor: Colors.primary + '40' },
  statValue: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary },
  statLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 24, gap: 16 },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.textMuted, letterSpacing: 2 },
  macroCards: { gap: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  waterCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  waterGlasses: { flexDirection: 'row', justifyContent: 'space-between' },
  waterText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
