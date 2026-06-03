/**
 * AI Provider abstraction for CalSnap
 *
 * Three providers:
 *   gemini  — Google Gemini SDK. Used for: photo vision scanning, image-heavy
 *             reasoning. Requires a Gemini API key.
 *   groq    — Groq Cloud (OpenAI-compatible REST). Free tier, very fast.
 *             Used for: text suggestions, recipe steps, structured JSON.
 *   custom  — Any OpenAI-compatible base URL + key (e.g. OpenRouter).
 *
 * Meal images are served from TheMealDB (free, no key) — real food photos.
 * No AI generation needed for images.
 */
import { getGeminiApiKey, getProviderConfig, saveProviderConfig } from './storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProviderType = 'gemini' | 'groq' | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
  textModel?: string;
  visionModel?: string;
}

// Default models per provider
export const PROVIDER_DEFAULTS: Record<ProviderType, Partial<ProviderConfig>> = {
  gemini: {
    textModel: 'gemini-flash-latest',
    visionModel: 'gemini-flash-latest',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    textModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  custom: {
    baseUrl: '',
    textModel: 'gpt-4o-mini',
    visionModel: 'gpt-4o-mini',
  },
};

const DEFAULT_CONFIG: ProviderConfig = { type: 'gemini', apiKey: '' };

// ─── Config persistence ───────────────────────────────────────────────────────

export async function loadProviderConfig(): Promise<ProviderConfig> {
  const saved = await getProviderConfig<ProviderConfig>();
  return saved ?? DEFAULT_CONFIG;
}

export async function updateProviderConfig(patch: Partial<ProviderConfig>): Promise<void> {
  const current = await loadProviderConfig();
  await saveProviderConfig({ ...current, ...patch });
}

// ─── Key resolution ───────────────────────────────────────────────────────────

async function resolveGeminiKeyInternal(): Promise<string> {
  const userKey = await getGeminiApiKey();
  return (userKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
}

/**
 * Get the effective key for the *text* provider (suggestions, recipe steps).
 * Returns null when no key is configured for the active provider.
 */
export async function resolveTextProviderKey(): Promise<{
  type: ProviderType;
  apiKey: string;
  baseUrl: string;
  model: string;
  visionModel: string;
} | null> {
  const cfg = await loadProviderConfig();

  if (cfg.type === 'gemini') {
    const key = await resolveGeminiKeyInternal();
    if (!key) return null;
    return {
      type: 'gemini',
      apiKey: key,
      baseUrl: '',
      model: cfg.textModel ?? PROVIDER_DEFAULTS.gemini.textModel!,
      visionModel: cfg.visionModel ?? PROVIDER_DEFAULTS.gemini.visionModel!,
    };
  }

  // groq / custom — OpenAI-compatible
  const key = cfg.apiKey.trim();
  if (!key) return null;
  const defaults = PROVIDER_DEFAULTS[cfg.type as 'groq' | 'custom'];
  const baseUrl = cfg.baseUrl?.trim() || defaults.baseUrl || '';
  return {
    type: cfg.type,
    apiKey: key,
    baseUrl,
    model: cfg.textModel ?? defaults.textModel!,
    visionModel: cfg.visionModel ?? defaults.visionModel!,
  };
}

// ─── OpenAI-compatible text completion ───────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

export async function openAICompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  jsonMode = false,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body: Record<string, unknown> = { model, messages, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${err}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Unexpected response shape');
  return content;
}

// ─── Meal image lookup via TheMealDB (free, no key) ──────────────────────────
//
// TheMealDB provides real human food photography across all world cuisines.
// No API key needed. ~300+ dishes indexed by name search.
// Rate limit: generous (public API, no documented limit).
//
// Pollinations.ai was previously used but now returns HTTP 402 (Paywalled).
// Unsplash Source (source.unsplash.com) also returns 503.

/** Extract the primary food noun for database lookup. */
function extractFoodKeyword(title: string): string {
  const stripped = title
    .toLowerCase()
    .replace(/\b(grilled|baked|roasted|steamed|fried|boiled|sautéed|pan-seared|stir-fried|crispy|spicy|creamy|fresh|homemade|high-protein|lean|low-fat|with|and|or|the|a|an)\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return stripped.slice(0, 2).join(' ') || title.split(' ')[0];
}

/**
 * Search TheMealDB by dish name and return the real photo URL.
 * Returns null when no dish matches the keyword.
 * The meal image component then shows a styled placeholder fallback.
 */
export async function fetchMealDbImage(title: string): Promise<string | null> {
  try {
    const keyword = extractFoodKeyword(title);
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.meals?.[0]?.strMealThumb as string | undefined;
    return thumb ?? null;
  } catch {
    return null;
  }
}
