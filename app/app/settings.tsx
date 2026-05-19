/**
 * App Settings
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';
import { clearAllData } from '../lib/storage';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [metric, setMetric] = useState(true);

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will delete all your food logs, profile, and settings. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => {
        await clearAllData();
        router.replace('/');
      }},
    ]);
  };

  const sections = [
    {
      title: 'PREFERENCES',
      items: [
        { icon: 'notifications-outline', label: 'Meal Reminders', toggle: true, value: notifications, onToggle: setNotifications },
        { icon: 'phone-portrait-outline', label: 'Haptic Feedback', toggle: true, value: haptics, onToggle: setHaptics },
        { icon: 'scale-outline', label: 'Use Metric Units', toggle: true, value: metric, onToggle: setMetric },
      ],
    },
    {
      title: 'APP',
      items: [
        { icon: 'information-circle-outline', label: 'About Kcal.AI', value: 'v1.0.0' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
        { icon: 'document-text-outline', label: 'Terms of Service' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, ii) => (
                <View key={ii} style={[styles.row, ii < section.items.length - 1 && styles.rowBorder]}>
                  <View style={styles.rowLeft}>
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                    <Text style={styles.rowLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary + '60' }}
                      thumbColor={item.value ? Colors.primary : Colors.textMuted}
                    />
                  ) : item.value ? (
                    <Text style={styles.rowValue}>{item.value}</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Kcal.AI v1.0.0 · Made for 8x Engineer Contest</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: 20, gap: 8 },
  section: { marginTop: 16, gap: 12 },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  sectionCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FontFamily.body, fontSize: 15, color: Colors.textPrimary },
  rowValue: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,107,138,0.1)', padding: 16, borderRadius: 16 },
  dangerText: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.error },
  footer: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 32 },
});
