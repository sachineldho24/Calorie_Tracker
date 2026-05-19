/**
 * Onboarding Step 1 — Target Weight
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily } from '../../constants/Theme';

export default function TargetWeightScreen() {
  const [currentWeight, setCurrentWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('65');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepText}>STEP 1 OF 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your{'\n'}weight goal?</Text>
        <Text style={styles.subtitle}>
          We'll use this to calculate your daily calorie and macro targets.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CURRENT WEIGHT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={currentWeight}
              onChangeText={setCurrentWeight}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>TARGET WEIGHT</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
        </View>

        {Number(currentWeight) > Number(targetWeight) && (
          <View style={styles.infoCard}>
            <Ionicons name="trending-down" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              A safe rate of weight loss is 0.5–1 kg per week
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          router.push({
            pathname: '/(onboarding)/personal-details',
            params: {
              currentWeight,
              targetWeight,
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
  stepText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
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
    gap: 8,
  },
  inputLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
    fontFamily: FontFamily.extraBold,
    fontSize: 48,
    color: Colors.textPrimary,
    minWidth: 120,
  },
  unitText: {
    fontFamily: FontFamily.body,
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.macroCaloriesBg,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.primary,
    flex: 1,
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
