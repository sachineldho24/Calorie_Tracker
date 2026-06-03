/**
 * Progress Overview — Weight trend sparkline, streak, weekly chart, progress photos
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import Colors from '../../constants/Colors';
import { FontFamily, Radius } from '../../constants/Theme';
import { useApp } from '../../context/AppContext';

// ─── Weight sparkline ──────────────────────────────────────────────────────────

const SPARK_W = 280;
const SPARK_H = 80;
const SPARK_PAD = 12;

function WeightSparkline() {
  const { weightHistory, profile } = useApp();
  const entries = weightHistory.slice(-30);

  if (entries.length < 2) {
    return (
      <View style={styles.sparkPlaceholder}>
        <Ionicons name="analytics-outline" size={24} color={Colors.textMuted} />
        <Text style={styles.sparkPlaceholderText}>Log your weight daily to see your trend</Text>
      </View>
    );
  }

  const weights = entries.map(e => e.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const toX = (i: number) => SPARK_PAD + (i / (entries.length - 1)) * (SPARK_W - SPARK_PAD * 2);
  const toY = (w: number) => SPARK_PAD + ((maxW - w) / range) * (SPARK_H - SPARK_PAD * 2);

  const points = entries.map((e, i) => `${toX(i)},${toY(e.weightKg)}`).join(' ');
  const lastX = toX(entries.length - 1);
  const lastY = toY(entries[entries.length - 1].weightKg);
  const targetW = profile?.targetWeightKg;
  const targetY = targetW !== undefined ? toY(Math.max(minW, Math.min(maxW, targetW))) : null;

  return (
    <Svg width={SPARK_W} height={SPARK_H}>
      {/* Target line */}
      {targetY !== null && (
        <>
          <Line x1={SPARK_PAD} y1={targetY} x2={SPARK_W - SPARK_PAD} y2={targetY}
            stroke={Colors.primary + '50'} strokeWidth={1} strokeDasharray="4,4" />
          <SvgText x={SPARK_W - SPARK_PAD + 2} y={targetY + 4} fontSize={9} fill={Colors.primary}>
            {targetW}
          </SvgText>
        </>
      )}
      {/* Trend line */}
      <Polyline points={points} fill="none" stroke={Colors.macroProtein} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Today dot */}
      <Circle cx={lastX} cy={lastY} r={4} fill={Colors.primary} />
    </Svg>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { profile, summary, streak, targets, weightHistory, progressPhotos, addProgressPhoto, removeProgressPhoto } = useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const weekData = [
    { day: 'Mon', cal: 1850 }, { day: 'Tue', cal: 2100 },
    { day: 'Wed', cal: 1720 }, { day: 'Thu', cal: 1980 },
    { day: 'Fri', cal: summary.totalCalories || 1600 },
    { day: 'Sat', cal: 0 }, { day: 'Sun', cal: 0 },
  ];
  const maxCal = Math.max(...weekData.map(d => d.cal), targets.calories);
  const avgCal = Math.round(
    weekData.filter(d => d.cal > 0).reduce((s, d) => s + d.cal, 0) /
    Math.max(1, weekData.filter(d => d.cal > 0).length)
  );

  const latestWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weightKg
    : profile?.weightKg;

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      await addProgressPhoto(result.assets[0].uri);
    }
  };

  const handleDeletePhoto = (id: string) => {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeletingId(id);
        await removeProgressPhoto(id);
        setDeletingId(null);
      }},
    ]);
  };

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

        {/* Weight Trend Sparkline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WEIGHT TREND</Text>
            <Text style={styles.avgText}>
              {latestWeight ? `${latestWeight} kg now` : 'Log weight in Profile'}
            </Text>
          </View>
          <View style={styles.sparkCard}>
            <WeightSparkline />
            {weightHistory.length >= 2 && (
              <View style={styles.sparkLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.macroProtein }]} />
                  <Text style={styles.legendText}>Actual</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary + '80', borderStyle: 'dashed' }]} />
                  <Text style={styles.legendText}>Target</Text>
                </View>
              </View>
            )}
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
              <Text style={styles.gridValue}>{latestWeight ?? '--'} kg</Text>
              <Text style={styles.gridLabel}>Current</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="flag-outline" size={20} color={Colors.primary} />
              <Text style={styles.gridValue}>{profile?.targetWeightKg ?? '--'} kg</Text>
              <Text style={styles.gridLabel}>Target</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="trending-down" size={20} color={Colors.macroCarb} />
              <Text style={styles.gridValue}>{profile ? Math.abs((latestWeight ?? profile.weightKg) - profile.targetWeightKg).toFixed(1) : '--'} kg</Text>
              <Text style={styles.gridLabel}>To Go</Text>
            </View>
            <View style={styles.gridItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.macroFat} />
              <Text style={styles.gridValue}>{targets.calories}</Text>
              <Text style={styles.gridLabel}>Daily Goal</Text>
            </View>
          </View>
        </View>

        {/* Progress Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROGRESS PHOTOS</Text>
            <TouchableOpacity onPress={handleAddPhoto} style={styles.addPhotoBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addPhotoBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {progressPhotos.length === 0 ? (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={handleAddPhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Add your first progress photo</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
              {progressPhotos.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
                  <Text style={styles.photoDate}>{photo.date}</Text>
                  <TouchableOpacity
                    style={styles.photoDelete}
                    onPress={() => handleDeletePhoto(photo.id)}
                    disabled={deletingId === photo.id}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.statusError} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
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
  section: { marginTop: 24, gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.textMuted, letterSpacing: 2 },
  avgText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },

  // Sparkline
  sparkCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 },
  sparkPlaceholder: { alignItems: 'center', gap: 8, paddingVertical: 24, backgroundColor: Colors.surfaceCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  sparkPlaceholderText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  sparkLegend: { flexDirection: 'row', gap: 16, alignSelf: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 2, borderRadius: 1 },
  legendText: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted },

  // Weekly chart (unchanged)
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, paddingTop: 32, height: 200, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  barCol: { alignItems: 'center', flex: 1, gap: 8 },
  barTrack: { width: 20, height: 120, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 10, minHeight: 4 },
  barLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: Colors.textMuted },
  targetLine: { position: 'absolute', left: 16, right: 16, height: 1 },
  targetDash: { height: 1, borderTopWidth: 1, borderTopColor: Colors.textMuted, borderStyle: 'dashed' },

  // Stats grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%', backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border },
  gridValue: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary },
  gridLabel: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },

  // Progress photos
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.primary + '60', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  addPhotoBtnText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.primary },
  photoPlaceholder: { alignItems: 'center', gap: 10, paddingVertical: 32, backgroundColor: Colors.surfaceCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  photoPlaceholderText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  photoScroll: { gap: 10, paddingVertical: 2 },
  photoCard: { width: 100, gap: 4 },
  photoImg: { width: 100, height: 140, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh },
  photoDate: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  photoDelete: { position: 'absolute', top: -6, right: -6 },
});
