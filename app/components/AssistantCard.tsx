/**
 * AssistantCard — AI coach home widget.
 *
 * Shows a Gemini/Groq-generated high-protein meal suggestion with:
 * - Pollinations meal image (free, keyless)
 * - "How to make it" as the primary action (launches the recipe screen)
 * - "I ate this" as an explicit secondary (logs to diary)
 * - Feedback widget: "Not feeling this?" → allergy / dislike / mood / loved
 *   reactions that persist to assistant memory for future personalisation.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal,
  Pressable, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily, Radius, Spacing } from '../constants/Theme';
import MacroChip from './MacroChip';
import MealImage from './MealImage';
import { MealSuggestion, MealSlot } from '../lib/meal-assistant';
import {
  recordFeedback,
  answerQuestion,
  motivationForReaction,
  setPantryItems,
  removePantryItem,
  ONBOARDING_QUESTIONS,
  AssistantMemory,
} from '../lib/assistant-memory';
import { getToday } from '../lib/nutrition';

interface AssistantCardProps {
  suggestion: MealSuggestion | null;
  slot: MealSlot;
  loading: boolean;
  onRefresh: () => void;
  onLog?: (s: MealSuggestion) => void;
  pendingQuestion?: typeof ONBOARDING_QUESTIONS[number] | null;
  memory?: AssistantMemory | null;
  onQuestionAnswered?: (mem: AssistantMemory) => void;
  onMemoryUpdated?: (mem: AssistantMemory) => void;
}

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast idea',
  lunch: 'Lunch idea',
  dinner: 'Dinner idea',
  snack: 'Snack idea',
};

type FeedbackKind = 'allergy' | 'dislike' | 'mood' | 'loved';

const FEEDBACK_OPTIONS: { kind: FeedbackKind; icon: keyof typeof Ionicons.glyphMap; label: string; color: string; hint: string }[] = [
  { kind: 'allergy',  icon: 'warning-outline',      label: 'Allergic',    color: Colors.statusError,   hint: "I'm allergic — never suggest this again." },
  { kind: 'dislike',  icon: 'thumbs-down-outline',   label: "Don't like",  color: Colors.macroCarb,     hint: "I dislike this — suggest alternatives." },
  { kind: 'mood',     icon: 'sad-outline',           label: 'Not now',     color: Colors.textMuted,     hint: "Not feeling it today, but usually fine." },
  { kind: 'loved',    icon: 'heart-outline',         label: 'Loved it',    color: Colors.primary,       hint: "Great suggestion — suggest more like this." },
];

export default function AssistantCard({
  suggestion, slot, loading, onRefresh, onLog,
  pendingQuestion, memory, onQuestionAnswered, onMemoryUpdated,
}: AssistantCardProps) {
  const hasMacros = !!suggestion && !suggestion.isFallback && suggestion.estCalories > 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState<FeedbackKind | null>(null);

  // Pantry state
  const pantryItems = memory?.pantryItems ?? [];
  const [pantryOpen, setPantryOpen] = useState(false);
  const [pantryInput, setPantryInput] = useState('');

  const handleSetPantry = async () => {
    if (!pantryInput.trim()) return;
    // Split on comma or newline
    const items = pantryInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    const updated = await setPantryItems([...new Set([...pantryItems, ...items])]);
    setPantryInput('');
    onMemoryUpdated?.(updated);
    onRefresh(); // re-suggest using pantry constraint
  };

  const handleClearPantry = async () => {
    const updated = await setPantryItems([]);
    onMemoryUpdated?.(updated);
    onRefresh();
  };

  const handleRemoveIngredient = async (ingredient: string) => {
    const updated = await removePantryItem(ingredient);
    onMemoryUpdated?.(updated);
    onRefresh(); // re-suggest without that ingredient
  };

  // Question state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [questionDone, setQuestionDone] = useState(false);

  const toggleOption = (val: string) => {
    const isArray = pendingQuestion?.field === 'lifestyle' || pendingQuestion?.field === 'cuisineInterests';
    if (isArray) {
      setSelectedOptions(prev =>
        prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      );
    } else {
      setSelectedOptions([val]); // single-select
    }
  };

  const submitAnswer = async () => {
    if (!pendingQuestion || !memory) return;
    const updated = await answerQuestion(memory, pendingQuestion.field, selectedOptions);
    setQuestionDone(true);
    setSelectedOptions([]);
    onQuestionAnswered?.(updated);
  };

  const handleFeedback = async (kind: FeedbackKind) => {
    if (!suggestion) return;
    await recordFeedback({
      date: getToday(),
      suggestionTitle: suggestion.title,
      reaction: kind,
      detail: motivationForReaction(kind, suggestion.title),
    });
    setFeedbackDone(kind);
    setFeedbackOpen(false);
    if (kind === 'allergy' || kind === 'loved') {
      setTimeout(() => { setFeedbackDone(null); onRefresh(); }, 1400);
    }
  };

  const handleHowToMake = () => {
    if (!suggestion) return;
    router.push({
      pathname: '/how-to-make' as any,
      params: {
        title: suggestion.title,
        items: JSON.stringify(suggestion.items),
        slot,
      },
    });
  };

  const handleIAtethis = () => {
    if (!suggestion || !onLog) return;
    onLog(suggestion);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={14} color={Colors.macroProtein} />
          <Text style={styles.headerLabel}>AI Coach · {SLOT_LABEL[slot]}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={loading} hitSlop={8}>
          <Ionicons
            name="refresh"
            size={16}
            color={loading ? Colors.textMuted : Colors.macroProtein}
          />
        </TouchableOpacity>
      </View>

      {/* Pantry panel */}
      <View style={styles.pantryRow}>
        <TouchableOpacity
          style={styles.pantryToggle}
          onPress={() => setPantryOpen(o => !o)}
          activeOpacity={0.75}
        >
          <Ionicons name="basket-outline" size={14} color={Colors.macroCarb} />
          <Text style={styles.pantryToggleText}>
            {pantryItems.length > 0
              ? `Fridge: ${pantryItems.slice(0, 2).join(', ')}${pantryItems.length > 2 ? ` +${pantryItems.length - 2}` : ''}`
              : "What's in your fridge?"}
          </Text>
          <Ionicons
            name={pantryOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
        {pantryItems.length > 0 && (
          <TouchableOpacity onPress={handleClearPantry} hitSlop={8}>
            <Text style={styles.pantryClear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {pantryOpen && (
        <View style={styles.pantryPanel}>
          {/* Existing pantry chips */}
          {pantryItems.length > 0 && (
            <View style={styles.pantryChips}>
              {pantryItems.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.pantryChip}
                  onPress={() => handleRemoveIngredient(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pantryChipText}>{item}</Text>
                  <Ionicons name="close" size={11} color={Colors.macroCarb} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Input */}
          <View style={styles.pantryInputRow}>
            <TextInput
              style={styles.pantryInput}
              value={pantryInput}
              onChangeText={setPantryInput}
              placeholder="e.g. chicken, eggs, rice, spinach"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              onSubmitEditing={handleSetPantry}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.pantryAddBtn, !pantryInput.trim() && { opacity: 0.4 }]}
              onPress={handleSetPantry}
              disabled={!pantryInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.pantryAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pantryHint}>
            AI will suggest meals using only these ingredients.
          </Text>
        </View>
      )}

      {/* Getting-to-know-you question (one per session) */}
      {pendingQuestion && !questionDone && (
        <View style={styles.questionBlock}>
          <Text style={styles.questionEmoji}>{pendingQuestion.emoji}</Text>
          <Text style={styles.questionText}>{pendingQuestion.prompt}</Text>
          <View style={styles.optionGrid}>
            {pendingQuestion.options.map(opt => {
              const active = selectedOptions.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => toggleOption(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedOptions.length > 0 && (
            <TouchableOpacity style={styles.submitBtn} onPress={submitAnswer} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>Got it ✓</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setQuestionDone(true)}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.macroProtein} />
          <Text style={styles.loadingText}>Thinking of a meal for you…</Text>
        </View>
      ) : suggestion ? (
        <>
          {/* Meal image */}
          {!suggestion.isFallback && (
            <MealImage
              title={suggestion.title}
              slot={slot}
              height={160}
              borderRadius={10}
            />
          )}

          <Text style={styles.title}>{suggestion.title}</Text>
          {!!suggestion.description && <Text style={styles.desc}>{suggestion.description}</Text>}
          {!!suggestion.reason && <Text style={styles.reason}>{suggestion.reason}</Text>}

          {hasMacros && (
            <View style={styles.chips}>
              <MacroChip label="" value={suggestion.estCalories} color="calories" unit=" kcal" />
              <MacroChip label="P" value={suggestion.estProteinG} color="protein" />
              <MacroChip label="C" value={suggestion.estCarbsG} color="carb" />
              <MacroChip label="F" value={suggestion.estFatG} color="fat" />
            </View>
          )}

          {/* Ingredient "don't have this" chips — Option B */}
          {suggestion.items.length > 0 && !suggestion.isFallback && (
            <View style={styles.ingredientSection}>
              <Text style={styles.ingredientLabel}>INGREDIENTS — tap what you don't have</Text>
              <View style={styles.ingredientChips}>
                {suggestion.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.ingredientChip}
                    onPress={() => handleRemoveIngredient(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ingredientChipText}>{item}</Text>
                    <Ionicons name="close-circle-outline" size={13} color={Colors.statusError} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          {!suggestion.isFallback && (
            <View style={styles.actionsRow}>
              {/* Primary: How to make it */}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleHowToMake} activeOpacity={0.8}>
                <Ionicons name="restaurant-outline" size={16} color={Colors.onPrimary} />
                <Text style={styles.primaryBtnText}>How to make it</Text>
              </TouchableOpacity>

              {/* Secondary: I ate this */}
              {onLog && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleIAtethis} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.secondaryBtnText}>I ate this</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Feedback row */}
          {!suggestion.isFallback && (
            <View style={styles.feedbackRow}>
              {feedbackDone ? (
                <Text style={styles.feedbackDoneText}>
                  {suggestion ? motivationForReaction(feedbackDone, suggestion.title) : ''}
                </Text>
              ) : (
                <TouchableOpacity onPress={() => setFeedbackOpen(true)} style={styles.feedbackBtn}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.feedbackBtnText}>Not feeling this?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.reason}>Tap refresh for a meal suggestion.</Text>
      )}

      {/* Feedback modal */}
      <Modal transparent visible={feedbackOpen} animationType="fade" onRequestClose={() => setFeedbackOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setFeedbackOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>What's up with this suggestion?</Text>
            <Text style={styles.sheetSub}>Your answer helps the AI personalise future suggestions.</Text>
            {FEEDBACK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.kind}
                style={styles.feedbackOption}
                onPress={() => handleFeedback(opt.kind)}
                activeOpacity={0.7}
              >
                <View style={[styles.feedbackIconBg, { backgroundColor: opt.color + '20' }]}>
                  <Ionicons name={opt.icon} size={20} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedbackOptLabel}>{opt.label}</Text>
                  <Text style={styles.feedbackOptHint}>{opt.hint}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.macroProteinBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.macroProtein + '40',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.macroProtein, letterSpacing: 0.5, textTransform: 'uppercase' },
  // Getting-to-know-you question card
  questionBlock: { backgroundColor: Colors.surfaceContainer, borderRadius: Radius.md, padding: 14, gap: 10 },
  questionEmoji: { fontSize: 22 },
  questionText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceCard },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: Colors.macroCaloriesBg },
  optionText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.textMuted },
  optionTextActive: { color: Colors.primary },
  submitBtn: { alignSelf: 'flex-start', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 18, paddingVertical: 9 },
  submitBtnText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.onPrimary },
  skipText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, textDecorationLine: 'underline' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  loadingText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  title: { fontFamily: FontFamily.heading, fontSize: 16, color: Colors.textPrimary, marginTop: 2 },
  desc: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary, lineHeight: 18, opacity: 0.9 },
  reason: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.macroProtein, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12,
  },
  primaryBtnText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.onPrimary },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: Radius.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.primary + '60', backgroundColor: Colors.macroCaloriesBg,
  },
  secondaryBtnText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.primary },

  feedbackRow: { alignItems: 'flex-start' },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  feedbackBtnText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
  feedbackDoneText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  // Pantry
  pantryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pantryToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  pantryToggleText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.macroCarb, flex: 1 },
  pantryClear: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted, textDecorationLine: 'underline' },
  pantryPanel: { backgroundColor: Colors.surfaceContainer, borderRadius: Radius.md, padding: 10, gap: 8 },
  pantryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pantryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.macroCarbBg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  pantryChipText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.macroCarb },
  pantryInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pantryInput: { flex: 1, fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.surfaceCard, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 8 },
  pantryAddBtn: { backgroundColor: Colors.macroCarb, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  pantryAddText: { fontFamily: FontFamily.heading, fontSize: 13, color: Colors.background },
  pantryHint: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textMuted },

  // Ingredient don't-have chips
  ingredientSection: { gap: 6 },
  ingredientLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2 },
  ingredientChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceCard, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5 },
  ingredientChipText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textPrimary },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  sheetTitle: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.textPrimary },
  sheetSub: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted, marginTop: -8 },
  feedbackOption: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedbackIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  feedbackOptLabel: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.textPrimary },
  feedbackOptHint: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
});
