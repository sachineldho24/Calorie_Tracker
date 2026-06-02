/**
 * AI Scan powered by Gemini API
 *
 * Hardening notes:
 * - Uses Gemini *structured output* (responseMimeType + responseSchema) so the
 *   model returns guaranteed-shape JSON. No markdown-fence stripping required.
 * - A sanity layer clamps implausible values and recomputes the total from the
 *   (clamped) items, so a single hallucinated number can't produce a
 *   "27,000,000 kcal" meal. Confidence is downgraded when we have to correct.
 * - One automatic retry covers transient network/parse failures.
 */
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { FoodEntry } from './nutrition';
import {
  MAX_ITEM_CALORIES,
  MAX_ITEM_MACRO_G,
  sanitizeCalories,
  sanitizeMacro,
  resolveGeminiKey,
} from './ai-sanity';
import { resolveTextProviderKey, openAICompatibleChat } from './ai-providers';

export interface ScanResult {
  confidence: 'high' | 'medium' | 'low';
  items: {
    name: string;
    servingDescription: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
  total: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  notes: string;
}

/**
 * Response schema handed to Gemini. Forcing this shape removes the need to
 * strip ```json fences or defensively parse — the SDK returns valid JSON.
 */
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    confidence: { type: SchemaType.STRING, enum: ['high', 'medium', 'low'] },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          servingDescription: { type: SchemaType.STRING },
          calories: { type: SchemaType.NUMBER },
          proteinG: { type: SchemaType.NUMBER },
          carbsG: { type: SchemaType.NUMBER },
          fatG: { type: SchemaType.NUMBER },
        },
        required: ['name', 'servingDescription', 'calories', 'proteinG', 'carbsG', 'fatG'],
      },
    },
    notes: { type: SchemaType.STRING },
  },
  required: ['confidence', 'items', 'notes'],
} as const;

const PROMPT = `You are a nutrition expert analyzing a photo of food.
Identify each distinct food item and estimate its nutrition for the portion visible.
Rules:
- Estimate per the portion shown, not a generic serving.
- Use realistic values: a single item is almost never above 2000 kcal.
- proteinG, carbsG and fatG are grams. calories should be roughly 4*protein + 4*carbs + 9*fat.
- Set "confidence" to how sure you are: "high" for clear single dishes, "low" for blurry or ambiguous photos.
- If you cannot identify any food, return an empty items array and explain in "notes".`;

/** Coerce one raw item into safe, rounded, in-range numbers. */
function sanitizeItem(raw: ScanResult['items'][number]) {
  const calories = sanitizeCalories(raw.calories);
  const proteinG = sanitizeMacro(raw.proteinG);
  const carbsG = sanitizeMacro(raw.carbsG);
  const fatG = sanitizeMacro(raw.fatG);

  // Was any value out of range before clamping? (signals a hallucination)
  const wasClamped =
    Number(raw.calories) > MAX_ITEM_CALORIES ||
    Number(raw.proteinG) > MAX_ITEM_MACRO_G ||
    Number(raw.carbsG) > MAX_ITEM_MACRO_G ||
    Number(raw.fatG) > MAX_ITEM_MACRO_G ||
    [raw.calories, raw.proteinG, raw.carbsG, raw.fatG].some(v => Number(v) < 0);

  // Does the macro breakdown roughly match the calorie count?
  const macroCalories = proteinG * 4 + carbsG * 4 + fatG * 9;
  const inconsistent =
    calories > 0 && Math.abs(macroCalories - calories) > Math.max(150, calories * 0.4);

  return {
    item: {
      name: String(raw.name || 'Unknown item').trim(),
      servingDescription: String(raw.servingDescription || '1 serving').trim(),
      calories,
      proteinG,
      carbsG,
      fatG,
    },
    wasClamped,
    inconsistent,
  };
}

/**
 * Apply sanity bounds to the whole result and recompute the total from the
 * cleaned items. Downgrades confidence and appends a note when values were
 * corrected, so the UI can prompt the user to double-check.
 */
function sanitizeResult(raw: ScanResult): ScanResult {
  const cleaned = (raw.items || []).map(sanitizeItem);
  const items = cleaned.map(c => c.item);
  const corrected = cleaned.some(c => c.wasClamped || c.inconsistent);

  // Always derive the total from items — never trust the model's own sum.
  const total = items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      proteinG: acc.proteinG + i.proteinG,
      carbsG: acc.carbsG + i.carbsG,
      fatG: acc.fatG + i.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  let confidence = (['high', 'medium', 'low'] as const).includes(raw.confidence)
    ? raw.confidence
    : 'low';
  let notes = String(raw.notes || '');

  if (corrected) {
    // Step the confidence down one notch and leave a breadcrumb.
    confidence = confidence === 'high' ? 'medium' : 'low';
    const flag = 'Some values looked off and were adjusted — please verify.';
    notes = notes ? `${notes} ${flag}` : flag;
  }

  return { confidence, items, total, notes };
}

const EMPTY_RESULT: ScanResult = {
  confidence: 'low',
  items: [],
  total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  notes: '',
};

/**
 * Scan food photo.
 *
 * Priority order:
 *  1. Gemini (best structured-output + vision quality) when a key is set.
 *  2. Groq / custom vision model (OpenAI-compatible multimodal) when the user
 *     configured a text provider with a vision-capable model.
 *  3. Graceful empty result with a descriptive note.
 */
export async function scanFoodPhoto(_imageUri: string, base64?: string | null): Promise<ScanResult> {
  if (!base64) {
    throw new Error('No image data provided for scanning.');
  }

  const geminiKey = await resolveGeminiKey();

  // ── Path 1: Gemini ────────────────────────────────────────────────────────
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as any,
        temperature: 0.2,
      },
    });
    const imageParts = [{ inlineData: { data: base64, mimeType: 'image/jpeg' } }];

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent([PROMPT, ...imageParts]);
        return sanitizeResult(JSON.parse(result.response.text()) as ScanResult);
      } catch (error) {
        lastError = error;
        console.warn(`Gemini scan attempt ${attempt + 1} failed:`, error);
      }
    }
    console.error('Gemini scan error:', lastError);
    // Fall through to provider fallback rather than hard-throwing
  }

  // ── Path 2: OpenAI-compatible vision (Groq / custom) ─────────────────────
  const provider = await resolveTextProviderKey();
  if (provider && provider.type !== 'gemini') {
    const imageMessage = {
      role: 'user' as const,
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
      ],
    };
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await openAICompatibleChat(
          provider.baseUrl,
          provider.apiKey,
          provider.visionModel ?? provider.model,
          [imageMessage],
          true,
        );
        return sanitizeResult(JSON.parse(text) as ScanResult);
      } catch (error) {
        lastError = error;
        console.warn(`Provider vision scan attempt ${attempt + 1} failed:`, error);
      }
    }
    console.error('Provider vision scan error:', lastError);
  }

  // ── Path 3: Graceful degrade ──────────────────────────────────────────────
  return {
    ...EMPTY_RESULT,
    notes: geminiKey
      ? 'Scan failed after retries — please try again.'
      : 'No AI key configured. Add a Gemini key or set up a provider in Settings.',
  };
}

/**
 * Convert scan result items to food entries
 */
export function scanResultToEntries(
  result: ScanResult,
  mealType: FoodEntry['mealType'] = 'lunch',
  imageUri?: string,
): Omit<FoodEntry, 'id' | 'timestamp' | 'date'>[] {
  return result.items.map(item => ({
    name: item.name,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    servingDescription: item.servingDescription,
    mealType,
    imageUri,
    confidence: result.confidence,
    notes: result.notes,
  }));
}
