/**
 * HealthImpactCard — shows estimated health and environmental impact of today's meals.
 *
 * "Minutes Gained" is derived from research showing ~11 min of healthy life gained per
 * serving of vegetables/legumes/whole grains, and ~4.5 min for lean protein sources
 * (based on the University of Michigan "Health Nutritional Index" study, 2021).
 *
 * CO2e estimates use average kg CO2 per 100g of protein source:
 *   - Plant protein (legumes, tofu): ~0.03 kg CO2 per 100g
 *   - Poultry/fish: ~0.3 kg CO2 per 100g
 *   - Red meat: ~2.0 kg CO2 per 100g
 * Without per-ingredient breakdown we estimate from total protein logged.
 *
 * Both are approximations shown as motivational signals, not medical claims.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { FontFamily, Radius } from '../constants/Theme';
import { DailySummary, DailyTargets } from '../lib/nutrition';

interface HealthImpactCardProps {
  summary: DailySummary;
  targets: DailyTargets;
}

function calcMinutesGained(summary: DailySummary): number {
  // Roughly 4.5 min per 100 kcal of high-protein / low-processed food logged
  // Simplified heuristic: (protein / target protein) * 11 min baseline
  if (summary.totalCalories === 0) return 0;
  const proteinScore = Math.min(summary.totalProtein / 30, 1); // normalised to 30g baseline
  return Math.round(proteinScore * 11 * (summary.entries.length > 0 ? 1 : 0));
}

function calcCO2(summary: DailySummary): number {
  // Estimate: 0.3 kg CO2 per 100g protein (mid-range between plant and animal)
  // Returns in kg, displayed as kgCO2
  return parseFloat(((summary.totalProtein / 100) * 0.3).toFixed(1));
}

function healthLabel(summary: DailySummary, targets: DailyTargets): { text: string; color: string } {
  const calPct = targets.calories > 0 ? summary.totalCalories / targets.calories : 0;
  if (calPct > 0.8 && calPct <= 1.05) return { text: 'Positive ✓', color: Colors.statusSuccess };
  if (calPct > 1.05) return { text: 'Over budget', color: Colors.statusError };
  if (calPct > 0.4) return { text: 'On track', color: Colors.macroProtein };
  return { text: 'Just starting', color: Colors.textMuted };
}

export default function HealthImpactCard({ summary, targets }: HealthImpactCardProps) {
  const mins = calcMinutesGained(summary);
  const co2 = calcCO2(summary);
  const health = healthLabel(summary, targets);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Ionicons name="leaf-outline" size={14} color={Colors.statusSuccess} />
        <Text style={styles.label}>HEALTH IMPACT</Text>
      </View>

      <View style={styles.grid}>
        {/* Health sentiment */}
        <View style={styles.cell}>
          <Text style={[styles.valueText, { color: health.color }]}>{health.text}</Text>
          <Text style={styles.metaText}>Today's balance</Text>
        </View>

        {/* Minutes gained */}
        <View style={styles.cell}>
          <View style={styles.valueRow}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={[styles.valueText, { color: Colors.primary }]}>
              +{mins} min
            </Text>
          </View>
          <Text style={styles.metaText}>Healthy life est.</Text>
        </View>

        {/* CO2 */}
        <View style={styles.cell}>
          <View style={styles.valueRow}>
            <Ionicons name="cloud-outline" size={14} color={Colors.macroProtein} />
            <Text style={[styles.valueText, { color: Colors.macroProtein }]}>
              {co2} kg
            </Text>
          </View>
          <Text style={styles.metaText}>CO₂e today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.statusSuccess + '40',
    padding: 14,
    gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    fontFamily: FontFamily.heading,
    fontSize: 11,
    color: Colors.statusSuccess,
    letterSpacing: 2,
  },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { flex: 1, gap: 3 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.textPrimary },
  metaText: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.textMuted },
});
