/**
 * Onboarding Step 2 — Personal Details (Height, Age, Sex)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';

export default function PersonalDetailsScreen() {
  const params = useLocalSearchParams<{ currentWeight: string; targetWeight: string }>();
  const [height, setHeight] = useState('170');
  const [age, setAge] = useState('25');
  const [sex, setSex] = useState<'male' | 'female'>('male');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepText}>STEP 2 OF 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Tell us about{'\n'}yourself</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your nutrition targets.
        </Text>

        {/* Sex selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SEX</Text>
          <View style={styles.sexRow}>
            {(['male', 'female'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sexOption, sex === s && styles.sexOptionActive]}
                onPress={() => setSex(s)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s === 'male' ? 'male' : 'female'}
                  size={22}
                  color={sex === s ? Colors.onPrimary : Colors.textMuted}
                />
                <Text style={[styles.sexText, sex === s && styles.sexTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Height */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>HEIGHT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.valueInput}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.unitText}>cm</Text>
          </View>
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>AGE</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.valueInput}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.unitText}>years</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          router.push({
            pathname: '/(onboarding)/activity-level',
            params: {
              ...params,
              height,
              age,
              sex,
            },
          });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 8,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 12,
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotDone: {
    backgroundColor: Colors.primaryDim,
  },
  stepText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sexOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sexOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sexText: {
    fontFamily: FontFamily.heading,
    fontSize: 15,
    color: Colors.textMuted,
  },
  sexTextActive: {
    color: Colors.onPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueInput: {
    fontFamily: FontFamily.extraBold,
    fontSize: 42,
    color: Colors.textPrimary,
    minWidth: 100,
  },
  unitText: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    color: Colors.onPrimary,
  },
});
