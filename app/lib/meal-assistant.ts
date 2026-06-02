/**
 * AI Meal-Suggestion Assistant + Recipe Steps
 *
 * Uses the provider abstraction (ai-providers.ts) so suggestions run on
 * whichever provider the user configured (Groq free / Gemini / custom).
 * Injects persistent memory (assistant-memory.ts) into every prompt so the
 * AI respects allergies and learns from feedback across sessions and model
 * changes — no model-side memory required.
 *
 * Always resolves without throwing (fallback object on any error).
 */
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoalType } from './nutrition';
import { resolveGeminiKey, sanitizeCalories, sanitizeMacro } from './ai-sanity';
import {
  resolveTextProviderKey,
  openAICompatibleChat,
} from './ai-providers';
import { loadMemory, memoryToPromptContext } from './assistant-memory';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealSuggestion {
  title: string;
  description: string;
  estCalories: number;
  estProteinG: number;
  estCarbsG: number;
  estFatG: number;
  reason: string;
  items: string[];
  isFallback?: boolean;
}

export interface RecipeStep {
  step: number;
  action: string;    // short imperative verb phrase, e.g. "Season the chicken"
  detail: string;    // one sentence of detail
  duration?: string; // e.g. "2 min", "10 min"
  tip?: string;      // optional pro tip
}

export interface RecipeGuide {
  title: string;
  prepTime: string;
  totalTime: string;
  servings: number;
  ingredients: string[];
  steps: RecipeStep[];
  macroNote: string; // e.g. "~38g protein per serving"
  isFallback?: boolean;
}

export interface SuggestionInput {
  slot: MealSlot;
  remaining: { calories: number; proteinG: number; carbsG: number; fatG: number };
  goalType?: GoalType;
  region?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function mealSlotForHour(hour: number): MealSlot {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'snack';
}

function sanitizeSuggestion(raw: MealSuggestion): MealSuggestion {
  return {
    title: String(raw.title || 'Meal idea').trim(),
    description: String(raw.description || '').trim(),
    estCalories: sanitizeCalories(raw.estCalories),
    estProteinG: sanitizeMacro(raw.estProteinG),
    estCarbsG: sanitizeMacro(raw.estCarbsG),
    estFatG: sanitizeMacro(raw.estFatG),
    reason: String(raw.reason || '').trim(),
    items: Array.isArray(raw.items)
      ? raw.items.map(i => String(i).trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}

function fallbackSuggestion(reason: string): MealSuggestion {
  return {
    title: 'High-protein plate',
    description: 'Grilled chicken breast, steamed broccoli, brown rice.',
    estCalories: 0, estProteinG: 0, estCarbsG: 0, estFatG: 0,
    reason,
    items: ['Chicken breast 150g', 'Broccoli 100g', 'Brown rice 80g'],
    isFallback: true,
  };
}

function fallbackRecipe(title: string): RecipeGuide {
  return {
    title,
    prepTime: '5 min', totalTime: '20 min', servings: 1,
    ingredients: ['Chicken breast 150g', 'Broccoli 100g', 'Brown rice 80g (cooked)', 'Olive oil 1 tsp', 'Salt, pepper, garlic powder'],
    steps: [
      { step: 1, action: 'Season chicken', detail: 'Pat dry, season both sides with salt, pepper, and garlic powder.', duration: '1 min' },
      { step: 2, action: 'Cook chicken', detail: 'Heat pan on medium-high, cook 6–7 min per side until internal temp reaches 75°C / 165°F.', duration: '14 min', tip: 'Let it rest 2 min before cutting — keeps it juicy.' },
      { step: 3, action: 'Steam broccoli', detail: 'Microwave in a covered bowl with 2 tbsp water for 3 min, or steam for 5 min.', duration: '3 min' },
      { step: 4, action: 'Plate up', detail: 'Slice chicken, serve over rice with broccoli on the side.', duration: '1 min' },
    ],
    macroNote: 'Approx. 38g protein, 45g carbs, 8g fat per serving.',
    isFallback: true,
  };
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSuggestionPrompt(input: SuggestionInput, memCtx: string): string {
  const { slot, remaining, goalType, region } = input;
  const goalLine =
    goalType === 'gain' ? 'Goal: build muscle — prioritise protein above all else.'
    : goalType === 'lose' ? 'Goal: lose weight — high protein, lower calories.'
    : 'Goal: maintain weight — balanced macros.';
  const regionLine = region
    ? `Bias toward ${region} cuisine using locally common ingredients.`
    : 'Keep ingredients widely accessible.';

  return `You are a personal nutrition coach. Suggest ONE simple, high-protein ${slot}.
${goalLine}
Remaining today: ${remaining.calories} kcal | ${remaining.proteinG}g protein | ${remaining.carbsG}g carbs | ${remaining.fatG}g fat.
${regionLine}
Rules:
- Prioritise protein. Minimum 25g per suggestion unless macros are already met.
- Keep it SIMPLE — max 5 ingredients, no complex techniques. Busy-person food.
- Do not exceed remaining calories. Stay realistic for one ${slot} (max 900 kcal).
- "reason" = one sentence referencing their remaining protein gap.
- "items" = 3–5 ingredient components.
- "description" = one vivid sentence that makes it sound appealing.${memCtx}

Return valid JSON matching this schema exactly:
{"title":"string","description":"string","estCalories":number,"estProteinG":number,"estCarbsG":number,"estFatG":number,"reason":"string","items":["string"]}`;
}

function buildRecipePrompt(title: string, items: string[], memCtx: string): string {
  return `You are a helpful cooking coach. Write a quick, easy recipe for: "${title}".
Ingredients on hand: ${items.join(', ')}.
${memCtx}
Rules:
- Maximum 6 steps. Each step must have a short action verb phrase and one detail sentence.
- Include a prepTime, totalTime, servings (1), and a macroNote with estimated protein.
- Optimise for someone who wants high-protein, quick, cheap meals.
- If any step has a useful tip, include it.

Return valid JSON:
{"title":"string","prepTime":"string","totalTime":"string","servings":1,"ingredients":["string"],"steps":[{"step":1,"action":"string","detail":"string","duration":"string","tip":"string"}],"macroNote":"string"}`;
}

// ─── Gemini structured-output schema (text suggestion) ───────────────────────

const GEMINI_SUGGESTION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    estCalories: { type: SchemaType.NUMBER },
    estProteinG: { type: SchemaType.NUMBER },
    estCarbsG: { type: SchemaType.NUMBER },
    estFatG: { type: SchemaType.NUMBER },
    reason: { type: SchemaType.STRING },
    items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['title','description','estCalories','estProteinG','estCarbsG','estFatG','reason','items'],
} as const;

// ─── Core API calls ───────────────────────────────────────────────────────────

async function callGeminiText(prompt: string, schema: unknown): Promise<string> {
  const key = await resolveGeminiKey();
  if (!key) throw new Error('No Gemini key');
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema as any,
      temperature: 0.7,
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callOpenAIText(prompt: string): Promise<string> {
  const provider = await resolveTextProviderKey();
  if (!provider || provider.type === 'gemini') throw new Error('No OpenAI-compat provider');
  return openAICompatibleChat(
    provider.baseUrl,
    provider.apiKey,
    provider.model,
    [{ role: 'user', content: prompt }],
    true, // JSON mode
  );
}

/** Try text provider first, fall back to Gemini. */
async function callText(prompt: string, geminiSchema: unknown): Promise<string> {
  const provider = await resolveTextProviderKey();
  if (provider && provider.type !== 'gemini') {
    try { return await callOpenAIText(prompt); } catch (e) {
      console.warn('Text provider failed, falling back to Gemini:', e);
    }
  }
  return callGeminiText(prompt, geminiSchema);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get a meal suggestion. Never throws. */
export async function getMealSuggestion(input: SuggestionInput): Promise<MealSuggestion> {
  const mem = await loadMemory();
  const memCtx = memoryToPromptContext(mem);
  const prompt = buildSuggestionPrompt(input, memCtx);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callText(prompt, GEMINI_SUGGESTION_SCHEMA);
      return sanitizeSuggestion(JSON.parse(text) as MealSuggestion);
    } catch (e) {
      lastError = e;
      console.warn(`Suggestion attempt ${attempt + 1} failed:`, e);
    }
  }
  console.error('Meal suggestion error:', lastError);
  return fallbackSuggestion('Could not reach AI — here is a solid default.');
}

/** Get recipe steps for a meal. Never throws. */
export async function getRecipeGuide(
  title: string,
  items: string[],
): Promise<RecipeGuide> {
  const mem = await loadMemory();
  const memCtx = memoryToPromptContext(mem);
  const prompt = buildRecipePrompt(title, items, memCtx);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callText(prompt, null); // schema not needed — Groq JSON mode is enough
      const raw = JSON.parse(text) as RecipeGuide;
      return {
        title: raw.title || title,
        prepTime: raw.prepTime || '?',
        totalTime: raw.totalTime || '?',
        servings: Number(raw.servings) || 1,
        ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : items,
        steps: Array.isArray(raw.steps)
          ? raw.steps.slice(0, 8).map((s: RecipeStep, i: number) => ({
              step: Number(s.step) || i + 1,
              action: String(s.action || '').trim(),
              detail: String(s.detail || '').trim(),
              duration: s.duration ? String(s.duration) : undefined,
              tip: s.tip ? String(s.tip).trim() : undefined,
            }))
          : [],
        macroNote: String(raw.macroNote || '').trim(),
      };
    } catch (e) {
      lastError = e;
      console.warn(`Recipe attempt ${attempt + 1} failed:`, e);
    }
  }
  console.error('Recipe error:', lastError);
  return fallbackRecipe(title);
}
