/**
 * Onboarding Step 3 — Activity Level
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { ActivityLevel } from '../../lib/nutrition';

const LEVELS: { key: ActivityLevel; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'sedentary', title: 'Sedentary', desc: 'Desk job, little exercise', icon: 'desktop-outline' },
  { key: 'light', title: 'Lightly Active', desc: 'Light exercise 1-3 days/week', icon: 'walk-outline' },
  { key: 'moderate', title: 'Moderate', desc: 'Exercise 3-5 days/week', icon: 'bicycle-outline' },
  { key: 'active', title: 'Very Active', desc: 'Hard exercise 6-7 days/week', icon: 'barbell-outline' },
  { key: 'very_active', title: 'Extremely Active', desc: 'Physical job + hard exercise', icon: 'flame-outline' },
];

export default function ActivityLevelScreen() {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<ActivityLevel>('moderate');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.step}>STEP 3 OF 4</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How active are you?</Text>
        <Text style={styles.sub}>This affects your daily calorie burn.</Text>
        <View style={styles.list}>
          {LEVELS.map((l) => {
            const on = selected === l.key;
            return (
              <TouchableOpacity key={l.key} style={[styles.card, on && styles.cardOn]} onPress={() => setSelected(l.key)}>
                <View style={[styles.icon, on && styles.iconOn]}>
                  <Ionicons name={l.icon} size={22} color={on ? Colors.onPrimary : Colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.cardTitle, on && { color: Colors.onPrimary }]}>{l.title}</Text>
                  <Text style={[styles.cardDesc, on && { color: 'rgba(19,56,0,0.7)' }]}>{l.desc}</Text>
                </View>
                {on && <Ionicons name="checkmark-circle" size={24} color={Colors.onPrimary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/(onboarding)/set-goal', params: { ...params, activityLevel: selected } })}>
        <Text style={styles.btnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
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
  title: { fontFamily: FontFamily.extraBold, fontSize: 32, color: Colors.textPrimary, marginTop: 32 },
  sub: { fontFamily: FontFamily.body, fontSize: 15, color: Colors.textMuted, marginTop: 12 },
  list: { gap: 12, marginTop: 32, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  cardOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.macroCaloriesBg, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: 'rgba(0,0,0,0.15)' },
  cardTitle: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.textPrimary },
  cardDesc: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, marginBottom: 16 },
  btnText: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.onPrimary },
});
