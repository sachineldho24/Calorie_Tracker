/**
 * Persistent assistant memory — model-agnostic.
 *
 * Lives entirely in AsyncStorage so it survives provider changes, app updates,
 * and model switches. The memory is injected as plain-text context into every
 * AI prompt — no model-specific memory mechanism required.
 *
 * Memory grows in two ways:
 *  1. Passive — feedback reactions (allergy/dislike/loved) on suggestions.
 *  2. Active — the assistant asks the user short "getting to know you" questions
 *     over the first few sessions. Answers are stored as structured fields so
 *     the prompt context stays compact and deterministic.
 *
 * Allergy vs dislike distinction (critical for good UX):
 *  - Allergy → NEVER suggest, no exceptions, no motivation to try it.
 *  - Dislike → avoid, but if the user seems reluctant-not-allergic (mood),
 *    the AI may suggest a swap or offer motivation instead of just refusing.
 */

import { getAssistantMemory, saveAssistantMemory } from './storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DietaryStyle =
  | 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian'
  | 'keto' | 'paleo' | 'halal' | 'kosher' | 'gluten-free' | 'dairy-free';

export type CookingSkill = 'beginner' | 'intermediate' | 'confident';

export type LifestyleTag =
  | 'busy' | 'meal-prep' | 'gym-goer' | 'student' | 'office-worker'
  | 'shift-worker' | 'athlete' | 'parent';

export interface FeedbackEntry {
  date: string;           // YYYY-MM-DD
  suggestionTitle: string;
  reaction: 'allergy' | 'dislike' | 'mood' | 'loved';
  detail: string;
}

export interface AssistantMemory {
  // ── Hard constraints ──────────────────────────────────────────────────────
  /** Ingredients/foods to NEVER suggest under any circumstance. */
  allergies: string[];

  // ── Pantry (what's available right now) ──────────────────────────────────
  /**
   * Ingredients the user has confirmed they currently own.
   * When non-empty the AI suggests meals using ONLY these items.
   * Cleared explicitly by the user (not auto-cleared — pantry items are
   * usually stable across a day).
   */
  pantryItems: string[];

  // ── Soft constraints ──────────────────────────────────────────────────────
  /** Foods the user dislikes — avoid, but AI may offer swaps or motivation. */
  dislikes: string[];

  // ── Positive preferences ──────────────────────────────────────────────────
  /** Foods, cuisines, or flavour profiles the user actively enjoys. */
  preferences: string[];

  // ── Structured profile (populated by the "getting to know you" flow) ──────
  /** Dietary style, e.g. 'vegetarian', 'halal', 'keto'. Blank = not asked yet. */
  dietaryStyle: DietaryStyle | null;
  /** How comfortable they are in the kitchen. */
  cookingSkill: CookingSkill | null;
  /** Lifestyle tags that shape suggestion style: 'busy', 'meal-prep', etc. */
  lifestyle: LifestyleTag[];
  /** Typical budget concern: 'budget', 'moderate', 'flexible'. */
  budget: 'budget' | 'moderate' | 'flexible' | null;
  /** Cuisine regions they enjoy, e.g. ['Indian', 'Mediterranean']. */
  cuisineInterests: string[];

  // ── Engagement state ──────────────────────────────────────────────────────
  /**
   * Index of the next "getting to know you" question to ask.
   * Increments after each question is answered. When >= QUESTIONS.length,
   * no more intro questions are shown (but learning from feedback continues).
   */
  nextQuestionIndex: number;
  /** Total number of sessions. Used to pace questions (one per session max). */
  sessionCount: number;

  // ── Free-form notes ───────────────────────────────────────────────────────
  /** Anything the AI writes that doesn't fit a structured field. */
  notes: string;

  // ── Feedback log ─────────────────────────────────────────────────────────
  feedbackLog: FeedbackEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY: AssistantMemory = {
  allergies: [],
  pantryItems: [],
  dislikes: [],
  preferences: [],
  dietaryStyle: null,
  cookingSkill: null,
  lifestyle: [],
  budget: null,
  cuisineInterests: [],
  nextQuestionIndex: 0,
  sessionCount: 0,
  notes: '',
  feedbackLog: [],
};

/**
 * Progressive "getting to know you" questions shown one per session.
 * Each has a short conversational prompt and a set of quick-reply options
 * (shown as chips in the UI). The field name maps to the AssistantMemory key
 * that gets updated when the user answers.
 */
export const ONBOARDING_QUESTIONS: {
  field: keyof AssistantMemory;
  prompt: string;
  emoji: string;
  options: { label: string; value: string }[];
  freeText?: boolean;
}[] = [
  {
    field: 'dietaryStyle',
    emoji: '🥗',
    prompt: "Quick one — do you follow any particular way of eating?",
    options: [
      { label: 'No restrictions', value: 'omnivore' },
      { label: 'Vegetarian',      value: 'vegetarian' },
      { label: 'Vegan',           value: 'vegan' },
      { label: 'Halal',           value: 'halal' },
      { label: 'Keto',            value: 'keto' },
      { label: 'Gluten-free',     value: 'gluten-free' },
    ],
  },
  {
    field: 'cookingSkill',
    emoji: '🍳',
    prompt: "How comfortable are you in the kitchen?",
    options: [
      { label: 'Beginner — keep it simple',       value: 'beginner' },
      { label: 'Intermediate — I can handle it',  value: 'intermediate' },
      { label: 'Confident — bring the complexity', value: 'confident' },
    ],
  },
  {
    field: 'lifestyle',
    emoji: '⚡',
    prompt: "Which best describes your day-to-day?",
    options: [
      { label: 'Super busy — short on time',   value: 'busy' },
      { label: 'I meal-prep on weekends',       value: 'meal-prep' },
      { label: 'Gym-goer, train regularly',     value: 'gym-goer' },
      { label: 'Student on a budget',           value: 'student' },
      { label: 'Desk job, mostly sedentary',    value: 'office-worker' },
    ],
  },
  {
    field: 'budget',
    emoji: '💸',
    prompt: "How do you feel about ingredient cost?",
    options: [
      { label: 'Budget-friendly please',   value: 'budget' },
      { label: 'Moderate spend is fine',   value: 'moderate' },
      { label: 'Cost isn\'t a concern',    value: 'flexible' },
    ],
  },
  {
    field: 'cuisineInterests',
    emoji: '🌍',
    prompt: "Any cuisines you particularly enjoy?",
    options: [
      { label: 'South Asian / Indian',   value: 'Indian' },
      { label: 'Mediterranean',          value: 'Mediterranean' },
      { label: 'East Asian',             value: 'East Asian' },
      { label: 'Middle Eastern',         value: 'Middle Eastern' },
      { label: 'Latin / Mexican',        value: 'Latin' },
      { label: 'American / Western',     value: 'Western' },
    ],
    freeText: true,
  },
  {
    field: 'allergies',
    emoji: '⚠️',
    prompt: "Any allergies I should absolutely never include?",
    options: [
      { label: 'None',         value: '__none__' },
      { label: 'Nuts / Peanuts', value: 'nuts' },
      { label: 'Dairy',        value: 'dairy' },
      { label: 'Eggs',         value: 'eggs' },
      { label: 'Shellfish',    value: 'shellfish' },
      { label: 'Gluten / Wheat', value: 'gluten' },
    ],
    freeText: true,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

export async function loadMemory(): Promise<AssistantMemory> {
  const saved = await getAssistantMemory<AssistantMemory>();
  return saved ? { ...EMPTY, ...saved } : { ...EMPTY };
}

export async function saveMemory(memory: AssistantMemory): Promise<void> {
  const bounded: AssistantMemory = {
    ...memory,
    feedbackLog: memory.feedbackLog.slice(-20),
  };
  await saveAssistantMemory(bounded);
}

// ─── Engagement flow ──────────────────────────────────────────────────────────

/**
 * Returns the next question to ask the user, or null if all have been asked.
 * Call this once per app session (not per render — use sessionCount).
 */
export function getNextQuestion(mem: AssistantMemory) {
  if (mem.nextQuestionIndex >= ONBOARDING_QUESTIONS.length) return null;
  return ONBOARDING_QUESTIONS[mem.nextQuestionIndex];
}

/**
 * Record an answer to an onboarding question and advance the index.
 * Handles both single-value fields (dietaryStyle, cookingSkill, budget)
 * and array fields (lifestyle, cuisineInterests, allergies).
 */
export async function answerQuestion(
  mem: AssistantMemory,
  field: keyof AssistantMemory,
  values: string[],
): Promise<AssistantMemory> {
  const updated = { ...mem };

  if (values.includes('__none__')) {
    // User explicitly said "none" — don't update the field, just advance
  } else if (field === 'dietaryStyle') {
    (updated as any).dietaryStyle = values[0] ?? null;
  } else if (field === 'cookingSkill') {
    (updated as any).cookingSkill = values[0] ?? null;
  } else if (field === 'budget') {
    (updated as any).budget = values[0] ?? null;
  } else if (field === 'lifestyle') {
    (updated as any).lifestyle = values;
  } else if (field === 'cuisineInterests') {
    (updated as any).cuisineInterests = values;
  } else if (field === 'allergies') {
    // Merge with any allergies already set from feedback
    const existing = (updated.allergies as string[]) ?? [];
    (updated as any).allergies = [...new Set([...existing, ...values])];
  }

  updated.nextQuestionIndex = mem.nextQuestionIndex + 1;
  await saveMemory(updated);
  return updated;
}

/** Call at the start of each app session to increment the session counter. */
export async function incrementSession(mem: AssistantMemory): Promise<AssistantMemory> {
  const updated = { ...mem, sessionCount: mem.sessionCount + 1 };
  await saveMemory(updated);
  return updated;
}

// ─── Passive feedback ─────────────────────────────────────────────────────────

/** Set the user's current pantry. Pass [] to clear. */
export async function setPantryItems(items: string[]): Promise<AssistantMemory> {
  const mem = await loadMemory();
  const updated = { ...mem, pantryItems: items.map(i => i.trim()).filter(Boolean) };
  await saveMemory(updated);
  return updated;
}

/** Remove one ingredient from the pantry (the "❌ don't have this" action). */
export async function removePantryItem(ingredient: string): Promise<AssistantMemory> {
  const mem = await loadMemory();
  const token = ingredient.toLowerCase().trim();
  const updated = {
    ...mem,
    pantryItems: mem.pantryItems.filter(i => i.toLowerCase() !== token),
  };
  await saveMemory(updated);
  return updated;
}

export async function recordFeedback(entry: FeedbackEntry): Promise<AssistantMemory> {
  const mem = await loadMemory();
  const token = entry.suggestionTitle.toLowerCase();

  if (entry.reaction === 'allergy' && !mem.allergies.includes(token)) {
    mem.allergies = [...mem.allergies, token];
    mem.dislikes = mem.dislikes.filter(d => d !== token);
  } else if (entry.reaction === 'dislike' && !mem.dislikes.includes(token)) {
    mem.dislikes = [...mem.dislikes, token];
  } else if (entry.reaction === 'loved' && !mem.preferences.includes(token)) {
    mem.preferences = [...mem.preferences, token];
    mem.dislikes = mem.dislikes.filter(d => d !== token);
  }

  mem.feedbackLog = [...mem.feedbackLog, entry];
  await saveMemory(mem);
  return mem;
}

// ─── Prompt serialisation ─────────────────────────────────────────────────────

/**
 * Serialise memory into a compact prompt-context block injected into every
 * AI call. Keeps it under ~120 tokens. Model-agnostic plain text.
 */
export function memoryToPromptContext(mem: AssistantMemory): string {
  const lines: string[] = [];

  if (mem.pantryItems.length > 0)
    lines.push(`PANTRY MODE — use ONLY these available ingredients: ${mem.pantryItems.join(', ')}. Do not suggest anything requiring ingredients not on this list.`);
  if (mem.allergies.length > 0)
    lines.push(`ALLERGIES — NEVER include: ${mem.allergies.join(', ')}.`);
  if (mem.dislikes.length > 0)
    lines.push(`Dislikes (avoid, or offer a swap): ${mem.dislikes.join(', ')}.`);
  if (mem.preferences.length > 0)
    lines.push(`Enjoys: ${mem.preferences.join(', ')}.`);
  if (mem.dietaryStyle && mem.dietaryStyle !== 'omnivore')
    lines.push(`Diet: ${mem.dietaryStyle}.`);
  if (mem.cookingSkill)
    lines.push(`Kitchen skill: ${mem.cookingSkill} — ${
      mem.cookingSkill === 'beginner'     ? 'keep recipes to 5 steps max, no special equipment.' :
      mem.cookingSkill === 'intermediate' ? '6–8 steps fine, basic techniques ok.' :
      'complex techniques and multi-component dishes welcome.'
    }`);
  if (mem.lifestyle.length > 0)
    lines.push(`Lifestyle: ${mem.lifestyle.join(', ')}.`);
  if (mem.budget)
    lines.push(`Budget: ${mem.budget === 'budget' ? 'use affordable, accessible ingredients.' : mem.budget === 'flexible' ? 'cost is no concern.' : 'moderate spend is fine.'}`);
  if (mem.cuisineInterests.length > 0)
    lines.push(`Favourite cuisines: ${mem.cuisineInterests.join(', ')}.`);
  if (mem.notes)
    lines.push(`Note: ${mem.notes}`);

  if (lines.length === 0) return '';
  return `\n\nPersonalisation context (remembered across sessions):\n${lines.join('\n')}`;
}

/**
 * Returns a short motivational line based on the user's reaction type.
 * Used in the feedback modal to distinguish "can't eat" from "won't right now".
 */
export function motivationForReaction(
  reaction: FeedbackEntry['reaction'],
  title: string,
): string {
  if (reaction === 'allergy')
    return `Got it — I'll never suggest ${title} again. Your safety comes first.`;
  if (reaction === 'dislike')
    return `Noted — I'll swap it for something you'll actually enjoy.`;
  if (reaction === 'mood')
    return `Fair enough — not every day calls for the same thing. I'll mix it up.`;
  if (reaction === 'loved')
    return `Love it! I'll keep meals like this coming. 💪`;
  return '';
}
