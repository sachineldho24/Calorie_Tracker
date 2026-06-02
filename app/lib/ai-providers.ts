/**
 * AI Provider abstraction for Kcal.AI
 *
 * Three providers:
 *   gemini  — Google Gemini SDK. Used for: photo vision scanning, image-heavy
 *             reasoning. Requires a Gemini API key.
 *   groq    — Groq Cloud (OpenAI-compatible REST). Free tier, very fast.
 *             Used for: text suggestions, recipe steps, structured JSON.
 *             Vision models available on Groq (llama-4 scout) can also handle
 *             photo scanning when selected.
 *   custom  — Any OpenAI-compatible base URL + key (e.g. Ollama, Together AI,
 *             OpenRouter). Used for the same text tasks as Groq.
 *
 * Image generation (meal pictures) uses Pollinations.ai — a free, keyless
 * service. This is independent of the provider setting.
 *
 * Rule of thumb baked into this module:
 *   - Vision / photo scanning → always prefer Gemini when a key is present;
 *     fall back to the configured text provider if it supports vision.
 *   - Text suggestions / recipe steps → use the configured text provider
 *     (groq or custom) first; fall back to Gemini if no text provider is set.
 */
import { getGeminiApiKey, getProviderConfig, saveProviderConfig } from './storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProviderType = 'gemini' | 'groq' | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  /** API key for the selected provider. */
  apiKey: string;
  /**
   * Base URL for OpenAI-compatible providers (groq / custom).
   * groq default: 'https://api.groq.com/openai/v1'
   * custom: user-supplied
   */
  baseUrl?: string;
  /** Model ID for text tasks. */
  textModel?: string;
  /** Model ID for vision tasks (if the provider supports it). */
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
    // llama-4-scout supports vision; gemma2 is fast for text-only
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

/**
 * Resolve the Gemini key: user-supplied (AsyncStorage) → bundled env var.
 * This is the same logic as ai-sanity.ts `resolveGeminiKey` but lives here
 * so providers can reference it without circular imports.
 */
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

/**
 * Call an OpenAI-compatible chat/completions endpoint and return the assistant
 * message content as a string. Used by Groq and custom providers.
 */
export async function openAICompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  jsonMode = false,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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

// ─── Pollinations image URL (free, keyless) ───────────────────────────────────

/**
 * Slot-specific lighting and mood context for food photography.
 * Morning light reads differently from evening candlelight — Pollinations
 * responds strongly to these cues and produces much more realistic images.
 */
const SLOT_PHOTO_CONTEXT: Record<string, string> = {
  breakfast: 'soft morning sunlight streaming through a window, warm golden hour light, bright and fresh atmosphere, light wooden table',
  lunch:     'natural daylight, bright and clean, minimal shadow, modern kitchen counter, matte ceramic plate',
  dinner:    'warm ambient restaurant lighting, slightly dim moody atmosphere, dark slate or wood surface, soft bokeh background',
  snack:     'casual lifestyle flat-lay, neutral linen background, natural diffused light, rustic wooden board',
};

/**
 * Build a high-quality Pollinations.ai image URL.
 *
 * Prompt engineering principles applied:
 * - Lead with the exact dish name and hero ingredients (most weight in diffusion)
 * - Slot-specific lighting/mood (morning vs evening changes the whole feel)
 * - Camera language: lens, angle, aperture cues
 * - Style anchor: Ottolenghi cookbook / Bon Appétit / Kinfolk magazine aesthetic
 * - Negative-space foreground for text overlay readability
 * - No generic filler ("high quality", "amazing") — specificity beats superlatives
 *
 * Returns a URL passable directly to <Image source={{ uri }}>.
 * No API key, no rate-limit enforcement, CORS-free in React Native.
 */
export function mealImageUrl(title: string, slot: string): string {
  const lighting = SLOT_PHOTO_CONTEXT[slot] ?? SLOT_PHOTO_CONTEXT.lunch;
  const prompt = [
    `${title}`,
    `beautifully plated on a ${slot === 'dinner' ? 'dark matte ceramic bowl' : 'white ceramic plate'}`,
    lighting,
    'food photography, 85mm portrait lens, f/2.0 shallow depth of field',
    'Ottolenghi cookbook style, Bon Appetit magazine editorial',
    'macro detail on texture and garnish, vibrant fresh colors',
    'negative space in foreground for text overlay',
    'no watermark, no text, no logos, photorealistic',
  ].join(', ');

  const encoded = encodeURIComponent(prompt);
  // Use a hash of the title as seed so the same meal always gets the same image
  // (stable across refreshes) but different meals get genuinely different images.
  const seed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9999;
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true&seed=${seed}`;
}
