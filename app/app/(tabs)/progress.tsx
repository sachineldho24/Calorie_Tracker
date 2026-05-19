/**
 * Progress Overview — Weight trends, streaks, weekly averages
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { useApp } from '../../context/AppContext';

export default function ProgressScreen() {
  const { profile, summary, streak, targets } = useApp();

  const weekData = [
    { day: 'Mon', cal: 1850 }, { day: 'Tue', cal: 2100 },
    { day: 'Wed', cal: 1720 }, { day: 'Thu', cal: 1980 },
    { day: 'Fri', cal: summary.totalCalories || 1600 },
    { day: 'Sat', cal: 0 }, { day: 'Sun', cal: 0 },
  ];
  const maxCal = Math.max(...weekData.map(d => d.cal), targets.calories);
  const avgCal = Math.round(weekData.filter(d => d.cal > 0).reduce((s, d) => s + d.cal, 0) / Math.max(1, weekData.filter(d => d.cal > 0).length));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Progress</Text>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={32} color={Colors.macroCarb} />
          <View>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.streakBadge}>
            <Text style={styles.badgeText}>🔥 Keep it up!</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>THIS WEEK</Text>
            <Text style={styles.avgText}>Avg: {avgCal} kcal</Text>
          </View>
          <View style={styles.chart}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    height: `${maxCal > 0 ? (d.cal / maxCal) * 100 : 0}%`,
                    backgroundColor: d.cal > targets.calories ? Colors.macroFat : Colors.primary,
                  }]} />
                </View>
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
            {/* Target line */}
            <View style={[styles.targetLine, { bottom: `${(targets.calories / maxCal) * 70 + 20}%` }]}>
              <View style={styles.targetDash} />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Ionicons name="body-outline" size={20} color={Colors.macroProtein} />
              <Text style={styles.gridValue}>{profile?.weightKg || '--'} kg</Text>
              <Text style={styles.gridLabel}>Current</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="flag-outline" size={20} color={Colors.primary} />
              <Text style={styles.gridValue}>{profile?.targetWeightKg || '--'} kg</Text>
              <Text style={styles.gridLabel}>Target</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="trending-down" size={20} color={Colors.macroCarb} />
              <Text style={styles.gridValue}>{profile ? Math.abs(profile.weightKg - profile.targetWeightKg).toFixed(1) : '--'} kg</Text>
              <Text style={styles.gridLabel}>To Go</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.macroFat} />
              <Text style={styles.gridValue}>{targets.calories}</Text>
              <Text style={styles.gridLabel}>Daily Goal</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary, marginBottom: 20 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  streakNum: { fontFamily: FontFamily.extraBold, fontSize: 32, color: Colors.textPrimary },
  streakLabel: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  streakBadge: { backgroundColor: Colors.macroCarbBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.macroCarb },
  section: { marginTop: 24, gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.textMuted, letterSpacing: 2 },
  avgText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, paddingTop: 32, height: 200, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  barCol: { alignItems: 'center', flex: 1, gap: 8 },
  barTrack: { width: 20, height: 120, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 10, minHeight: 4 },
  barLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: Colors.textMuted },
  targetLine: { position: 'absolute', left: 16, right: 16, height: 1, borderStyle: 'dashed' },
  targetDash: { height: 1, borderTopWidth: 1, borderTopColor: Colors.textMuted, borderStyle: 'dashed' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%', backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border },
  gridValue: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary },
  gridLabel: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
});
