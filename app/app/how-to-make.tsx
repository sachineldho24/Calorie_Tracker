/**
 * How To Make — AI-generated recipe steps, infographic style.
 *
 * Receives: params.title, params.items (JSON string array), params.slot
 * Calls getRecipeGuide() which uses the configured provider (Groq/Gemini).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily, Spacing, Radius } from '../constants/Theme';
import MealImage from '../components/MealImage';
import { getRecipeGuide, RecipeGuide, MealSlot } from '../lib/meal-assistant';

const STEP_COLORS = [Colors.primary, Colors.macroProtein, Colors.macroCarb, Colors.macroFat, Colors.primary, Colors.macroProtein];

export default function HowToMakeScreen() {
  const params = useLocalSearchParams<{ title: string; items: string; slot: string }>();
  const title = params.title || 'Meal';
  const slot = (params.slot || 'lunch') as MealSlot;
  const items: string[] = (() => { try { return JSON.parse(params.items || '[]'); } catch { return []; } })();

  const [guide, setGuide] = useState<RecipeGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipeGuide(title, items).then(g => { setGuide(g); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero image */}
        <MealImage title={title} slot={slot} width={undefined as any} height={200} borderRadius={16} />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generating recipe…</Text>
          </View>
        ) : guide ? (
          <>
            {/* Meta row */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>Prep {guide.prepTime}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="alarm-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>Total {guide.totalTime}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{guide.servings} serving</Text>
              </View>
            </View>

            {/* Macro note pill */}
            {!!guide.macroNote && (
              <View style={styles.macroPill}>
                <Ionicons name="barbell-outline" size={14} color={Colors.primary} />
                <Text style={styles.macroPillText}>{guide.macroNote}</Text>
              </View>
            )}

            {/* Ingredients */}
            <Text style={styles.sectionTitle}>INGREDIENTS</Text>
            <View style={styles.card}>
              {guide.ingredients.map((ing, i) => (
                <View key={i} style={[styles.ingRow, i < guide.ingredients.length - 1 && styles.ingBorder]}>
                  <View style={[styles.ingDot, { backgroundColor: STEP_COLORS[i % STEP_COLORS.length] }]} />
                  <Text style={styles.ingText}>{ing}</Text>
                </View>
              ))}
            </View>

            {/* Steps — infographic style */}
            <Text style={styles.sectionTitle}>STEPS</Text>
            {guide.steps.map((step, i) => {
              const accent = STEP_COLORS[i % STEP_COLORS.length];
              return (
                <View key={i} style={styles.stepCard}>
                  {/* Step number badge */}
                  <View style={[styles.stepBadge, { backgroundColor: accent + '20', borderColor: accent + '60' }]}>
                    <Text style={[styles.stepNum, { color: accent }]}>{step.step}</Text>
                  </View>

                  <View style={styles.stepBody}>
                    <View style={styles.stepTop}>
                      <Text style={styles.stepAction}>{step.action}</Text>
                      {!!step.duration && (
                        <View style={styles.durationChip}>
                          <Ionicons name="timer-outline" size={11} color={Colors.textMuted} />
                          <Text style={styles.durationText}>{step.duration}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepDetail}>{step.detail}</Text>
                    {!!step.tip && (
                      <View style={styles.tipRow}>
                        <Ionicons name="bulb-outline" size={13} color={Colors.statusWarning} />
                        <Text style={styles.tipText}>{step.tip}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {guide.isFallback && (
              <Text style={styles.fallbackNote}>
                ⚠ AI unavailable — showing a default recipe.
              </Text>
            )}
          </>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.pagePadding, paddingVertical: 12,
  },
  headerTitle: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: { paddingHorizontal: Spacing.pagePadding, gap: 16 },
  loadingBox: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textMuted },

  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceCard, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  metaText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.textMuted },

  macroPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.macroCaloriesBg, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  macroPillText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.primary },

  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },

  card: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  ingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  ingDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  ingText: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textPrimary, flex: 1 },

  stepCard: { flexDirection: 'row', gap: 14, backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  stepBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { fontFamily: FontFamily.extraBold, fontSize: 15 },
  stepBody: { flex: 1, gap: 6 },
  stepTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepAction: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  durationChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.textMuted },
  stepDetail: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary, opacity: 0.85, lineHeight: 19 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(255,221,87,0.08)', borderRadius: Radius.sm, padding: 8 },
  tipText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.statusWarning, flex: 1, lineHeight: 17 },

  fallbackNote: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, textAlign: 'center', opacity: 0.7 },
});
