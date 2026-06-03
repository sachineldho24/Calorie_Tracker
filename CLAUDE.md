# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kcal.AI is an Expo / React Native (SDK 51) mobile app that tracks calories by analyzing food photos with the Google Gemini Vision API. It also features a personalised meal-suggestion assistant, voice/text meal logging, persistent AI memory, and a health impact dashboard. It is offline-first (all data in AsyncStorage) with a custom "Kinetic Noir" dark-mode design system.

## Layout

The repository root holds docs (`README.md`, `DESIGN.md`, `cal-ai-prd-competitive-analysis.md`), `Screenshots/`, and `ai-logs/`. **All application code lives in `app/`** — run every command from there.

## Commands

```bash
cd app
npm install
npx expo start -c        # start Metro (the -c clears the cache; preferred over `npm start`)
npx expo start -c --tunnel   # use an Ngrok tunnel when LAN/QR delivery fails
npx tsc --noEmit         # type-check (strict mode is on)
```

There is **no test runner or linter configured** — `package.json` has no `test`/`lint` script and no Jest config, despite the stub at `components/__tests__/StyledText-test.js`. Do not invent test commands; if asked to add tests, wire up `jest-expo` first.

The app is consumed via the Expo Go app by scanning the Metro QR code; there is no standalone build step in this repo (`/ios` and `/android` are gitignored).

## API Keys

The app supports three AI providers. Keys are stored in AsyncStorage (entered in-app via Settings) and/or `app/.env`.

- **Gemini** (`EXPO_PUBLIC_GEMINI_API_KEY`) — used for photo vision scanning. The `EXPO_PUBLIC_` prefix is required for Expo to expose the var to client code, which means **the key is bundled into the shipped JS and is not secret** — treat it as a demo/dev key. When missing, `scanFoodPhoto` degrades gracefully (empty result with a notes explanation).
- **Groq** — free-tier OpenAI-compatible API. Used for text suggestions, meal parsing, recipe steps. Key entered in Settings → AI Provider.
- **Custom** — any OpenAI-compatible base URL + key (e.g. OpenRouter, local Ollama). Configured in Settings → AI Provider → Custom.

The vision model is `gemini-flash-latest`. `list_models.mjs` is a throwaway script to list available Gemini models.

## Architecture

Data flows through six layers, bottom to top:

1. **`lib/nutrition.ts`** — pure domain layer. Owns all shared TypeScript types (`UserProfile`, `FoodEntry`, `DailySummary`, `DailyTargets`) and all the math: Mifflin-St Jeor BMR → TDEE (activity multiplier) → calorie target (goal-adjusted: −500 lose / +300 gain) → macro split (30% protein / 40% carbs / 30% fat). No I/O. Date helpers use `YYYY-MM-DD` strings as the canonical date key everywhere.

2. **`lib/storage.ts`** — the only module that touches AsyncStorage. All food entries are stored under a single `@kcalai_food_entries` key as one JSON array and filtered/reduced in memory per date; profile, onboarding flag, streak, per-date water counters, Gemini key, provider config, and assistant memory each have their own keys (see the `KEYS` map). Streak logic lives in `updateStreak`.

3. **`lib/ai-scan.ts`** — Gemini Vision call. Sends a base64 image + a strict-JSON prompt, strips markdown fences from the response, and `JSON.parse`s into `ScanResult`. `scanResultToEntries` maps a `ScanResult` into the `FoodEntry` shape that `addEntry` expects.

4. **`lib/ai-providers.ts`** — provider abstraction layer. Defines `ProviderType` (`gemini` | `groq` | `custom`), holds per-provider defaults, persists the active config via storage, and exposes `resolveTextProviderKey()` and `openAICompatibleChat()`. All text-generation callers go through this rather than directly instantiating an SDK.

5. **`lib/assistant-memory.ts`** — persistent AI memory, model-agnostic. Stores allergies, dislikes, preferences, dietary style, cooking skill, lifestyle tags, budget, cuisine interests, pantry items, and a feedback log in AsyncStorage. Injected as a plain-text context block into every AI prompt so preferences survive provider changes. Exposes `loadMemory`, `saveMemory`, `recordFeedback`, `setPantryItems`, `removePantryItem`, `answerQuestion`, `memoryToPromptContext`. Also defines `ONBOARDING_QUESTIONS` — a progressive "getting to know you" flow (one question per session, six questions total).

6. **`lib/meal-assistant.ts`** — meal suggestion and recipe guide generation. Uses `ai-providers.ts` (Groq → Gemini fallback). `getMealSuggestion(input)` returns a `MealSuggestion` for the given slot with remaining macros injected. `getRecipeGuide(title, items)` returns step-by-step `RecipeGuide`. Both inject persistent memory from `assistant-memory.ts` and never throw (fallback objects on error). `mealSlotForHour` maps the current hour to a `MealSlot`.

7. **`lib/voice-parse.ts`** — natural-language meal parsing. `parseVoiceToMeals(transcript)` sends a plain-text description to the text provider (Groq → Gemini fallback) and returns a `ScanResult` — the same shape as a photo scan — so `voice-record.tsx` can push directly to `review-edit` with no extra plumbing.

8. **`context/AppContext.tsx`** — single global store (`useApp()` hook). Holds profile, targets, selected date, daily summary, streak, water, and loading state, and exposes all mutating actions (`addEntry`, `editEntry`, `removeEntry`, `setProfile`, `completeOnboarding`, `drinkWater`, `resetApp`). After any write it calls `refreshData()` to re-derive the summary. **Screens never call `lib/storage` directly — they go through this context.**

### Navigation (Expo Router, file-based, in `app/app/`)

- `index.tsx` is the gate: redirects to `(onboarding)/target-weight` if onboarding is incomplete, otherwise to `(tabs)`.
- `(onboarding)/` is a 4-step wizard (target-weight → personal-details → activity-level → set-goal) that builds a `UserProfile` and calls `completeOnboarding`.
- `(tabs)/` is the main app: `index` (home dashboard), `diary`, `scan`, `progress`, `profile`.
- `scan.tsx` captures/picks a photo (with `base64: true`), calls `scanFoodPhoto`, then navigates to `review-edit` passing the result as a JSON string param.
- `voice-record.tsx` is a text-input screen where the user describes a meal in natural language; on submit it calls `parseVoiceToMeals` and navigates to `review-edit` with the parsed `ScanResult`.
- `review-edit.tsx` is a modal that edits scan/voice results (or a blank manual entry when `manual=true`) and commits via `addEntry`.
- `settings.tsx` exposes provider selection (Gemini / Groq / Custom), per-provider API key entry, location toggle, and danger-zone data clear.

### Key Components

- `AssistantCard` — home-screen card that shows meal suggestions, renders the "getting to know you" onboarding question flow, and handles feedback reactions (allergy / dislike / mood / loved) that write back to persistent memory.
- `HealthImpactCard` — shows estimated healthy-life minutes gained and CO₂e footprint for today's meals (motivational approximation, not medical claim).
- `MealImage` — fetches a real food photo from TheMealDB by dish name (free, no key); shows a styled placeholder if no match is found.
- `WeekStrip` — horizontal 7-day date picker used on the home and diary screens.

### Styling

No external UI/styling library — everything is the RN `StyleSheet` API reading design tokens from `constants/Colors.ts` (palette) and `constants/Theme.ts` (`Typography`, `Spacing`, `Radius`, `Shadows`, `FontFamily`). All type roles map to **Inter** weights (loaded in `app/_layout.tsx`); this is a deliberate override of the Syne/DM-Sans pairing described in `DESIGN.md`. Match these tokens rather than hardcoding values when adding UI.

## Conventions

- Imports are **relative** (`../lib/nutrition`), not the `@/*` alias — the alias exists in `tsconfig.json` but is unused in practice; follow the relative style.
- The `app/` package uses the new architecture (`newArchEnabled: true`) and typed routes (`typedRoutes` experiment), so route strings are type-checked.
- All AI-calling functions must never throw to the caller — return a fallback object with `isFallback: true` on error and log via `console.error`.
- Persistent memory (`assistant-memory.ts`) is the canonical place for user preferences injected into AI prompts — do not duplicate preference state in `AppContext` or component state.
