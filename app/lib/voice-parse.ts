/**
 * Voice / text logging — parse a natural-language meal description into a
 * ScanResult using the configured AI provider.
 *
 * Uses the same provider chain as meal-assistant.ts (Groq free → Gemini fallback)
 * and returns a ScanResult so voice-record.tsx can push directly to review-edit
 * with no extra plumbing — the existing review screen handles it identically to
 * a photo scan.
 *
 * Example: "I had a bowl of dal rice with yogurt" →
 *   { confidence: 'medium', items: [{name:'Dal rice',calories:420,...}, {name:'Yogurt',...}], ... }
 */
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ScanResult } from './ai-scan';
import { resolveGeminiKey, sanitizeCalories, sanitizeMacro } from './ai-sanity';
import { resolveTextProviderKey, openAICompatibleChat } from './ai-providers';

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

function buildPrompt(transcript: string): string {
  return `You are a nutrition expert. The user described a meal in natural language. Parse it and return nutritional estimates.

User said: "${transcript}"

Rules:
- Identify each distinct food item mentioned (including implied items like "with rice" → rice).
- Estimate realistic calories and macros for the portion described.
- If quantities are vague, use typical single-serving amounts.
- Set confidence to "high" if amounts are clear, "medium" if estimated, "low" if very vague.
- notes: one sentence about any assumptions made.

Return valid JSON matching this schema exactly:
{"confidence":"medium","items":[{"name":"string","servingDescription":"string","calories":0,"proteinG":0,"carbsG":0,"fatG":0}],"notes":"string"}`;
}

function sanitizeResult(raw: ScanResult): ScanResult {
  return {
    confidence: (['high', 'medium', 'low'] as const).includes(raw.confidence) ? raw.confidence : 'low',
    items: (raw.items || []).map(i => ({
      name: String(i.name || 'Unknown').trim(),
      servingDescription: String(i.servingDescription || '1 serving').trim(),
      calories: sanitizeCalories(i.calories),
      proteinG: sanitizeMacro(i.proteinG),
      carbsG: sanitizeMacro(i.carbsG),
      fatG: sanitizeMacro(i.fatG),
    })),
    total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }, // recomputed below
    notes: String(raw.notes || '').trim(),
  };
}

function recomputeTotal(result: ScanResult): ScanResult {
  const total = result.items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      proteinG: acc.proteinG + i.proteinG,
      carbsG: acc.carbsG + i.carbsG,
      fatG: acc.fatG + i.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return { ...result, total };
}

const EMPTY: ScanResult = {
  confidence: 'low',
  items: [],
  total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  notes: '',
};

/**
 * Parse natural-language meal description into a ScanResult.
 * Tries the configured text provider first (Groq free), falls back to Gemini.
 * Never throws — returns empty result with a note on failure.
 */
export async function parseVoiceToMeals(transcript: string): Promise<ScanResult> {
  if (!transcript.trim()) {
    return { ...EMPTY, notes: 'Please describe what you ate.' };
  }

  const prompt = buildPrompt(transcript);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    // Try text provider (Groq/custom) first
    const provider = await resolveTextProviderKey();
    if (provider && provider.type !== 'gemini') {
      try {
        const text = await openAICompatibleChat(
          provider.baseUrl, provider.apiKey, provider.model,
          [{ role: 'user', content: prompt }],
          true,
        );
        return recomputeTotal(sanitizeResult(JSON.parse(text) as ScanResult));
      } catch (e) {
        console.warn(`Voice parse provider attempt ${attempt + 1}:`, e);
        lastError = e;
      }
    }

    // Fall back to Gemini
    const geminiKey = await resolveGeminiKey();
    if (!geminiKey) break;
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA as any,
          temperature: 0.2,
        },
      });
      const result = await model.generateContent(prompt);
      return recomputeTotal(sanitizeResult(JSON.parse(result.response.text()) as ScanResult));
    } catch (e) {
      console.warn(`Voice parse Gemini attempt ${attempt + 1}:`, e);
      lastError = e;
    }
  }

  console.error('Voice parse error:', lastError);
  return { ...EMPTY, notes: 'Could not parse your description — please try again or use manual entry.' };
}
