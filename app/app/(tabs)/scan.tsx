/**
 * AI Meal Scan — Camera viewfinder with scan overlay, recent meals, voice logging
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { FontFamily, Shadows, Radius } from '../../constants/Theme';
import ScanFrame from '../../components/ScanFrame';
import { scanFoodPhoto } from '../../lib/ai-scan';
import { getRecentUniqueEntries } from '../../lib/storage';
import { useApp } from '../../context/AppContext';
import { FoodEntry } from '../../lib/nutrition';

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<FoodEntry[]>([]);
  const [reloggedId, setReloggedId] = useState<string | null>(null);
  const { addEntry } = useApp();

  useEffect(() => {
    getRecentUniqueEntries(8).then(setRecentMeals);
  }, []);

  const handleCapture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processImage = async (uri: string, base64?: string | null) => {
    setImageUri(uri);
    setIsScanning(true);
    try {
      const scanResult = await scanFoodPhoto(uri, base64);
      setIsScanning(false);
      setImageUri(null);
      router.push({
        pathname: '/review-edit',
        params: { scanData: JSON.stringify(scanResult), imageUri: uri },
      });
    } catch (e) {
      setIsScanning(false);
      Alert.alert('Scan Failed', 'Could not analyze the image. Try again.');
    }
  };

  const handleRelog = async (entry: FoodEntry) => {
    setReloggedId(entry.id);
    await addEntry({
      name: entry.name,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      servingDescription: entry.servingDescription,
      mealType: entry.mealType,
      confidence: entry.confidence,
      notes: entry.notes,
    });
    // Brief flash, then reset
    setTimeout(() => setReloggedId(null), 1200);
    // Refresh recents so the tapped item bubbles to top
    getRecentUniqueEntries(8).then(setRecentMeals);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Meal</Text>
        <Text style={styles.subtitle}>Point camera at your food</Text>
      </View>

      <View style={styles.viewfinder}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={64} color={Colors.surfaceContainerHigh} />
          </View>
        )}
        <View style={styles.frameOverlay}>
          <ScanFrame isScanning={isScanning} />
        </View>
        {isScanning && (
          <View style={styles.scanLabel}>
            <View style={styles.scanDot} />
            <Text style={styles.scanText}>Analyzing food...</Text>
          </View>
        )}
      </View>

      {/* Recent meals re-log */}
      {recentMeals.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>RECENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
            {recentMeals.map(meal => {
              const done = reloggedId === meal.id;
              return (
                <TouchableOpacity
                  key={meal.id}
                  style={[styles.recentChip, done && styles.recentChipDone]}
                  onPress={() => handleRelog(meal)}
                  disabled={!!reloggedId}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'add-circle-outline'}
                    size={14}
                    color={done ? Colors.onPrimary : Colors.primary}
                  />
                  <Text style={[styles.recentName, done && { color: Colors.onPrimary }]} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <Text style={[styles.recentCal, done && { color: Colors.onPrimary }]}>
                    {meal.calories} kcal
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleGallery} disabled={isScanning}>
          <Ionicons name="images-outline" size={22} color={Colors.textPrimary} />
          <Text style={styles.secondaryText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/voice-record' as any)}
          disabled={isScanning}
        >
          <Ionicons name="mic-outline" size={22} color={Colors.textPrimary} />
          <Text style={styles.secondaryText}>Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureBtn, Shadows.fabGlow]}
          onPress={handleCapture}
          disabled={isScanning}
          activeOpacity={0.8}
        >
          <View style={styles.captureInner}>
            <Ionicons name="camera" size={28} color={Colors.onPrimary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push({ pathname: '/review-edit', params: { manual: 'true' } })}
          disabled={isScanning}
        >
          <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
          <Text style={styles.secondaryText}>Manual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push({ pathname: '/review-edit', params: { manual: 'true' } })}
          disabled={isScanning}
        >
          <Ionicons name="barcode-outline" size={22} color={Colors.textMuted} />
          <Text style={[styles.secondaryText, { color: Colors.textMuted }]}>Barcode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tips}>
        <Ionicons name="bulb-outline" size={14} color={Colors.statusWarning} />
        <Text style={styles.tipText}>Tip: Include all items in frame for best results</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 8, gap: 4 },
  title: { fontFamily: FontFamily.extraBold, fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  viewfinder: { flex: 1, margin: 20, marginBottom: 8, borderRadius: 24, backgroundColor: Colors.surfaceCard, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  preview: { ...StyleSheet.absoluteFillObject },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  frameOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scanLabel: { position: 'absolute', bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  scanText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.primary },

  recentSection: { paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  recentTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  recentScroll: { gap: 8, paddingVertical: 2 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceCard, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 160 },
  recentChipDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  recentName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.textPrimary, flex: 1 },
  recentCal: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted },

  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  captureBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.onPrimary, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { alignItems: 'center', gap: 4 },
  secondaryText: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.textMuted },
  tips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 12 },
  tipText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
});
