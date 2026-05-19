/**
 * Review & Edit — AI scan results editor
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';
import { useApp } from '../context/AppContext';
import { ScanResult } from '../lib/ai-scan';
import MacroChip from '../components/MacroChip';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function ReviewEditScreen() {
  const params = useLocalSearchParams<{ scanData?: string; imageUri?: string; manual?: string }>();
  const { addEntry } = useApp();
  const isManual = params.manual === 'true';

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [items, setItems] = useState<{ name: string; calories: string; protein: string; carbs: string; fat: string; serving: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState<string>('high');

  useEffect(() => {
    if (params.scanData) {
      try {
        const data: ScanResult = JSON.parse(params.scanData);
        setItems(data.items.map(i => ({
          name: i.name, calories: String(i.calories), protein: String(i.proteinG),
          carbs: String(i.carbsG), fat: String(i.fatG), serving: i.servingDescription,
        })));
        setNotes(data.notes || '');
        setConfidence(data.confidence);
      } catch (e) {}
    }
    if (isManual) {
      setItems([{ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '1 serving' }]);
    }
  }, []);

  const updateItem = (idx: number, field: string, value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const totalCal = items.reduce((s, i) => s + (Number(i.calories) || 0), 0);

  const handleSave = async () => {
    for (const item of items) {
      if (!item.name.trim()) continue;
      await addEntry({
        name: item.name, calories: Number(item.calories) || 0,
        proteinG: Number(item.protein) || 0, carbsG: Number(item.carbs) || 0,
        fatG: Number(item.fat) || 0, servingDescription: item.serving,
        mealType, imageUri: params.imageUri,
        confidence: confidence as any, notes,
      });
    }
    router.back();
  };

  const meals: { key: MealType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
    { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { key: 'snack', label: 'Snack', icon: 'cafe-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isManual ? 'Add Food' : 'Review Scan'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Confidence */}
        {!isManual && (
          <View style={styles.confidenceCard}>
            <Ionicons name={confidence === 'high' ? 'checkmark-circle' : 'alert-circle'} size={18}
              color={confidence === 'high' ? Colors.primary : Colors.statusWarning} />
            <Text style={styles.confidenceText}>
              {confidence === 'high' ? 'High confidence' : `${confidence} confidence — review values`}
            </Text>
          </View>
        )}

        {/* Notes */}
        {notes ? (
          <View style={styles.notesCard}>
            <Ionicons name="bulb-outline" size={16} color={Colors.statusWarning} />
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* Meal Type */}
        <View style={styles.mealRow}>
          {meals.map(m => (
            <TouchableOpacity key={m.key} style={[styles.mealBtn, mealType === m.key && styles.mealBtnOn]}
              onPress={() => setMealType(m.key)}>
              <Ionicons name={m.icon} size={16} color={mealType === m.key ? Colors.onPrimary : Colors.textMuted} />
              <Text style={[styles.mealLabel, mealType === m.key && { color: Colors.onPrimary }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Food Items */}
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <TextInput style={styles.nameInput} value={item.name} onChangeText={v => updateItem(idx, 'name', v)}
              placeholder="Food name" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.servingInput} value={item.serving} onChangeText={v => updateItem(idx, 'serving', v)}
              placeholder="Serving size" placeholderTextColor={Colors.textMuted} />
            <View style={styles.macroInputRow}>
              <View style={styles.macroInput}>
                <Text style={[styles.macroInputLabel, { color: Colors.primary }]}>Cal</Text>
                <TextInput style={styles.macroInputValue} value={item.calories}
                  onChangeText={v => updateItem(idx, 'calories', v)} keyboardType="numeric" />
              </View>
              <View style={styles.macroInput}>
                <Text style={[styles.macroInputLabel, { color: Colors.macroProtein }]}>P</Text>
                <TextInput style={styles.macroInputValue} value={item.protein}
                  onChangeText={v => updateItem(idx, 'protein', v)} keyboardType="numeric" />
              </View>
              <View style={styles.macroInput}>
                <Text style={[styles.macroInputLabel, { color: Colors.macroCarb }]}>C</Text>
                <TextInput style={styles.macroInputValue} value={item.carbs}
                  onChangeText={v => updateItem(idx, 'carbs', v)} keyboardType="numeric" />
              </View>
              <View style={styles.macroInput}>
                <Text style={[styles.macroInputLabel, { color: Colors.macroFat }]}>F</Text>
                <TextInput style={styles.macroInputValue} value={item.fat}
                  onChangeText={v => updateItem(idx, 'fat', v)} keyboardType="numeric" />
              </View>
            </View>
          </View>
        ))}

        {/* Add Item */}
        <TouchableOpacity style={styles.addBtn}
          onPress={() => setItems(prev => [...prev, { name: '', calories: '', protein: '', carbs: '', fat: '', serving: '1 serving' }])}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add item</Text>
        </TouchableOpacity>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{totalCal} kcal</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save to Diary</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.textPrimary },
  saveText: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.primary },
  scroll: { paddingHorizontal: 20, gap: 16 },
  confidenceCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceCard, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  confidenceText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  notesCard: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,221,87,0.1)', padding: 12, borderRadius: 12 },
  notesText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.statusWarning, flex: 1 },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  mealBtnOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.textMuted },
  itemCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  nameInput: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
  servingInput: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  macroInputRow: { flexDirection: 'row', gap: 8 },
  macroInput: { flex: 1, alignItems: 'center', gap: 4 },
  macroInputLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11 },
  macroInputValue: { fontFamily: FontFamily.heading, fontSize: 18, color: Colors.textPrimary, textAlign: 'center', backgroundColor: Colors.surfaceContainer, borderRadius: 8, width: '100%', paddingVertical: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  addBtnText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.primary },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.macroCaloriesBg, borderRadius: 16, padding: 20 },
  totalLabel: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.textMuted, letterSpacing: 2 },
  totalValue: { fontFamily: FontFamily.extraBold, fontSize: 24, color: Colors.primary },
  saveBtn: { backgroundColor: Colors.primary, marginHorizontal: 20, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  saveBtnText: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.onPrimary },
});
