/**
 * Voice logging — type or paste a meal description, AI parses it,
 * then navigates to review-edit for confirmation before saving.
 *
 * Uses a TextInput instead of live microphone to avoid expo-av (native
 * module issues in Expo Go). Still a powerful Loom demo: user types
 * "bowl of dal rice with yogurt" → AI instantly returns macros.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily, Radius, Spacing } from '../constants/Theme';
import { parseVoiceToMeals } from '../lib/voice-parse';

const EXAMPLES = [
  'A bowl of oatmeal with banana and honey',
  '2 scrambled eggs with whole wheat toast',
  'Grilled chicken breast with brown rice and broccoli',
  'Dal rice with plain yogurt',
  'Protein shake with almond milk',
];

export default function VoiceRecordScreen() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!transcript.trim()) { setError('Please describe what you ate.'); return; }
    setError('');
    setLoading(true);
    const result = await parseVoiceToMeals(transcript);
    setLoading(false);

    if (result.items.length === 0) {
      setError(result.notes || 'Could not parse that — try being more specific.');
      return;
    }

    router.push({
      pathname: '/review-edit',
      params: { scanData: JSON.stringify(result) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Describe your meal</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Input card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Ionicons name="mic-outline" size={18} color={Colors.primary} />
              <Text style={styles.inputLabel}>WHAT DID YOU EAT?</Text>
            </View>
            <TextInput
              style={styles.input}
              value={transcript}
              onChangeText={t => { setTranscript(t); setError(''); }}
              placeholder="e.g. two eggs and a slice of toast with butter"
              placeholderTextColor={Colors.textMuted}
              multiline
              autoCapitalize="sentences"
              autoFocus
            />
            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.statusError} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Parse button */}
          <TouchableOpacity
            style={[styles.parseBtn, (!transcript.trim() || loading) && { opacity: 0.5 }]}
            onPress={handleParse}
            disabled={!transcript.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={Colors.onPrimary} />
                <Text style={styles.parseBtnText}>Parsing with AI…</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={Colors.onPrimary} />
                <Text style={styles.parseBtnText}>Parse with AI</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Examples */}
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>EXAMPLES — tap to fill</Text>
            {EXAMPLES.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleRow}
                onPress={() => { setTranscript(ex); setError(''); }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.exampleText}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.note}>
            The AI will extract each food item and estimate calories + macros. You can review and edit before saving.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.pagePadding, paddingVertical: 12 },
  title: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.pagePadding, gap: 16, paddingBottom: 40 },

  inputCard: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputLabel: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.primary, letterSpacing: 2 },
  input: { fontFamily: FontFamily.body, fontSize: 15, color: Colors.textPrimary, minHeight: 90, textAlignVertical: 'top', lineHeight: 22 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.statusError, flex: 1 },

  parseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16 },
  parseBtnText: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.onPrimary },

  examplesSection: { gap: 8 },
  examplesTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  exampleText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary, flex: 1, lineHeight: 18 },

  note: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
