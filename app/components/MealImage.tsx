/**
 * MealImage — free, keyless meal photo via Pollinations.ai.
 *
 * Usage: <MealImage title="Grilled chicken bowl" slot="lunch" style={...} />
 *
 * Pollinations format:
 *   https://image.pollinations.ai/prompt/<encoded-text>?width=W&height=H&nologo=true
 * No API key, no cost, works directly as an <Image> source URI in React Native.
 */
import React, { useState } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { mealImageUrl } from '../lib/ai-providers';
import { MealSlot } from '../lib/meal-assistant';

interface MealImageProps {
  title: string;
  slot: MealSlot;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export default function MealImage({ title, slot, width = 320, height = 180, borderRadius = 12 }: MealImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const uri = mealImageUrl(title, slot);

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      {loading && !error && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { borderRadius }]}>
          <ActivityIndicator size="small" color={Colors.macroProtein} />
        </View>
      )}
      {error ? (
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { borderRadius }]}>
          <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
