/**
 * User Profile
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';
import { useApp } from '../../context/AppContext';

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary', light: 'Lightly Active', moderate: 'Moderate',
  active: 'Very Active', very_active: 'Extremely Active',
};

export default function ProfileScreen() {
  const { profile, targets } = useApp();

  const items = [
    { icon: 'body-outline', label: 'Weight', value: `${profile?.weightKg || '--'} kg` },
    { icon: 'flag-outline', label: 'Target', value: `${profile?.targetWeightKg || '--'} kg` },
    { icon: 'resize-outline', label: 'Height', value: `${profile?.heightCm || '--'} cm` },
    { icon: 'calendar-outline', label: 'Age', value: `${profile?.age || '--'} years` },
    { icon: 'fitness-outline', label: 'Activity', value: ACTIVITY_LABELS[profile?.activityLevel || ''] || '--' },
    { icon: 'flame-outline', label: 'Daily Calories', value: `${targets.calories} kcal` },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.name}>Kcal.AI User</Text>
        <Text style={styles.goal}>
          Goal: {profile?.goalType === 'lose' ? 'Lose Weight' : profile?.goalType === 'gain' ? 'Build Muscle' : 'Maintain'}
        </Text>

        {/* Macro Targets */}
        <View style={styles.targetCard}>
          <Text style={styles.targetTitle}>DAILY TARGETS</Text>
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: Colors.primary }]}>{targets.calories}</Text>
              <Text style={styles.targetLabel}>Calories</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: Colors.macroProtein }]}>{targets.proteinG}g</Text>
              <Text style={styles.targetLabel}>Protein</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: Colors.macroCarb }]}>{targets.carbsG}g</Text>
              <Text style={styles.targetLabel}>Carbs</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: Colors.macroFat }]}>{targets.fatG}g</Text>
              <Text style={styles.targetLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Info List */}
        <View style={styles.infoList}>
          {items.map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.settingsBtnText}>App Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  title: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary, alignSelf: 'flex-start', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.macroCaloriesBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
  name: { fontFamily: FontFamily.heading, fontSize: 20, color: Colors.textPrimary, marginTop: 12 },
  goal: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  targetCard: { width: '100%', backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, marginTop: 24, borderWidth: 1, borderColor: Colors.border },
  targetTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  targetRow: { flexDirection: 'row', justifyContent: 'space-around' },
  targetItem: { alignItems: 'center', gap: 4 },
  targetValue: { fontFamily: FontFamily.extraBold, fontSize: 20 },
  targetLabel: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted },
  infoList: { width: '100%', marginTop: 24, backgroundColor: Colors.surfaceCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textMuted },
  infoValue: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.textPrimary },
  settingsBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  settingsBtnText: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.textPrimary, flex: 1 },
});
