/**
 * Onboarding Step 4 — Set Goal (final step, saves profile)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { GoalType, calculateMacroTargets, calculateCalorieTarget } from '../../lib/nutrition';
import { useApp } from '../../context/AppContext';

const GOALS: { key: GoalType; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lose', title: 'Lose Weight', desc: '500 cal deficit per day', icon: 'trending-down' },
  { key: 'maintain', title: 'Maintain', desc: 'Stay at your current weight', icon: 'swap-horizontal' },
  { key: 'gain', title: 'Build Muscle', desc: '300 cal surplus per day', icon: 'trending-up' },
];

export default function SetGoalScreen() {
  const params = useLocalSearchParams<{
    currentWeight: string; targetWeight: string;
    height: string; age: string; sex: string; activityLevel: string;
  }>();
  const { setProfile, completeOnboarding } = useApp();
  const [selected, setSelected] = useState<GoalType>('lose');
  const [saving, setSaving] = useState(false);

  const profile = {
    weightKg: Number(params.currentWeight) || 70,
    targetWeightKg: Number(params.targetWeight) || 65,
    heightCm: Number(params.height) || 170,
    age: Number(params.age) || 25,
    sex: (params.sex as 'male' | 'female') || 'male',
    activityLevel: (params.activityLevel as any) || 'moderate',
    goalType: selected,
  };

  const calories = calculateCalorieTarget(profile);
  const macros = calculateMacroTargets(calories);

  const handleFinish = async () => {
    setSaving(true);
    await setProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
        <Text style={styles.step}>STEP 4 OF 4</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <Text style={styles.title}>What's your goal?</Text>

        <View style={styles.list}>
          {GOALS.map((g) => {
            const on = selected === g.key;
            return (
              <TouchableOpacity key={g.key} style={[styles.card, on && styles.cardOn]} onPress={() => setSelected(g.key)}>
                <Ionicons name={g.icon} size={24} color={on ? Colors.onPrimary : Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, on && { color: Colors.onPrimary }]}>{g.title}</Text>
                  <Text style={[styles.cardDesc, on && { color: 'rgba(19,56,0,0.7)' }]}>{g.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>YOUR DAILY TARGET</Text>
          <Text style={styles.previewCal}>{calories}</Text>
          <Text style={styles.previewUnit}>calories / day</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.macroProtein }]} />
              <Text style={styles.macroValue}>{macros.proteinG}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.macroCarb }]} />
              <Text style={styles.macroValue}>{macros.carbsG}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.macroFat }]} />
              <Text style={styles.macroValue}>{macros.fatG}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleFinish} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Setting up...' : 'Start Tracking'}</Text>
        <Ionicons name="checkmark" size={20} color={Colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  header: { alignItems: 'center', paddingTop: 16, gap: 8 },
  backBtn: { position: 'absolute', left: 0, top: 12, padding: 4 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceContainerHigh },
  dotActive: { backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.primaryDim },
  step: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 32, color: Colors.textPrimary },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  cardOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cardTitle: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.textPrimary },
  cardDesc: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
  preview: { alignItems: 'center', backgroundColor: Colors.surfaceCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  previewLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  previewCal: { fontFamily: FontFamily.extraBold, fontSize: 48, color: Colors.primary, marginTop: 4 },
  previewUnit: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textMuted },
  macroRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
  macroItem: { alignItems: 'center', gap: 4 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroValue: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.textPrimary },
  macroLabel: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, marginBottom: 16 },
  btnText: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.onPrimary },
});
