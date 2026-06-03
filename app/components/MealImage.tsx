/**
 * MealImage — shows a real food photograph from TheMealDB.
 *
 * TheMealDB provides free, no-key-required real food photography across
 * all world cuisines. The keyword the AI chose as the dish title is
 * used as the lookup query. When no match is found, a styled food-emoji
 * placeholder is shown instead.
 *
 * No AI generation ever — Pollinations.ai now requires payment (HTTP 402),
 * and Unsplash Source (source.unsplash.com) returns 503 errors.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { fetchMealDbImage } from '../lib/ai-providers';
import { MealSlot } from '../lib/meal-assistant';

// Simple emoji map for common meal categories used as fallback
const SLOT_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍲',
  snack: '🍎',
};

interface MealImageProps {
  title: string;
  slot: MealSlot;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export default function MealImage({ title, slot, width, height = 160, borderRadius = 12 }: MealImageProps) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setNotFound(false);
    setUri(null);

    fetchMealDbImage(title).then(thumb => {
      if (!mountedRef.current) return;
      if (thumb) {
        setUri(thumb);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });

    return () => { mountedRef.current = false; };
  }, [title]);

  const containerStyle: any = {
    width: width ?? '100%',
    height,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  };

  return (
    <View style={containerStyle}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <ActivityIndicator size="small" color={Colors.macroProtein} />
        </View>
      )}
      {notFound && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.emoji}>{SLOT_EMOJI[slot] ?? '🍽️'}</Text>
        </View>
      )}
      {uri && !notFound && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          onError={() => { setNotFound(true); setLoading(false); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48 },
});
