/**
 * Shared sanity bounds + key resolution for Gemini-backed features.
 *
 * Both the photo scanner (`ai-scan.ts`) and the meal-suggestion assistant
 * (`meal-assistant.ts`) produce nutrition numbers from an LLM, so they share
 * the same clamps (to avoid the "27,000,000 kcal" outliers the reference app is
 * criticised for) and the same API-key resolution (user key → bundled env key).
 */
import { getGeminiApiKey } from './storage';

// Generous enough not to clip a real large meal, tight enough to catch
// hallucinated outliers.
export const MAX_ITEM_CALORIES = 5000;
export const MAX_ITEM_MACRO_G = 500;

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/** Round + clamp one calorie value into a plausible range. */
export const sanitizeCalories = (n: unknown) =>
  clamp(Math.round(Number(n) || 0), 0, MAX_ITEM_CALORIES);

/** Round + clamp one macro (grams) value into a plausible range. */
export const sanitizeMacro = (n: unknown) =>
  clamp(Math.round(Number(n) || 0), 0, MAX_ITEM_MACRO_G);

/**
 * Resolve the Gemini API key at call time: a user-supplied key (Settings)
 * takes priority over the bundled demo key from EXPO_PUBLIC_GEMINI_API_KEY.
 */
export async function resolveGeminiKey(): Promise<string> {
  const userKey = await getGeminiApiKey();
  return (userKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
}
