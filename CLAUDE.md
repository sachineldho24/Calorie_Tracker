# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kcal.AI is an Expo / React Native (SDK 51) mobile app that tracks calories by analyzing food photos with the Google Gemini Vision API. It is offline-first (all data in AsyncStorage) with a custom "Kinetic Noir" dark-mode design system.

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

## Gemini API key

`lib/ai-scan.ts` reads `process.env.EXPO_PUBLIC_GEMINI_API_KEY`. The `EXPO_PUBLIC_` prefix is required for Expo to expose the var to client code, which also means **the key is bundled into the shipped JS and is not secret** — treat it as a demo/dev key. Put it in `app/.env`. When the key is missing the app degrades gracefully: `scanFoodPhoto` returns an empty result with a `notes` explanation rather than throwing.

The model is `gemini-flash-latest`. `list_models.mjs` is a throwaway script to list available Gemini models for the configured key.

## Architecture

Data flows through four layers, bottom to top:

1. **`lib/nutrition.ts`** — pure domain layer. Owns all shared TypeScript types (`UserProfile`, `FoodEntry`, `DailySummary`, `DailyTargets`) and all the math: Mifflin-St Jeor BMR → TDEE (activity multiplier) → calorie target (goal-adjusted: −500 lose / +300 gain) → macro split (30% protein / 40% carbs / 30% fat). No I/O. Date helpers use `YYYY-MM-DD` strings as the canonical date key everywhere.
2. **`lib/storage.ts`** — the only module that touches AsyncStorage. All food entries are stored under a single `@kcalai_food_entries` key as one JSON array and filtered/reduced in memory per date; profile, onboarding flag, streak, and per-date water counters have their own keys (see the `KEYS` map). Streak logic lives in `updateStreak`.
3. **`lib/ai-scan.ts`** — Gemini Vision call. Sends a base64 image + a strict-JSON prompt, strips markdown fences from the response, and `JSON.parse`s into `ScanResult`. `scanResultToEntries` maps a `ScanResult` into the `FoodEntry` shape that `addEntry` expects.
4. **`context/AppContext.tsx`** — single global store (`useApp()` hook). Holds profile, targets, selected date, daily summary, streak, water, and loading state, and exposes all mutating actions (`addEntry`, `editEntry`, `removeEntry`, `setProfile`, `completeOnboarding`, `drinkWater`). After any write it calls `refreshData()` to re-derive the summary. **Screens never call `lib/storage` directly — they go through this context.**

### Navigation (Expo Router, file-based, in `app/app/`)

- `index.tsx` is the gate: redirects to `(onboarding)/target-weight` if onboarding is incomplete, otherwise to `(tabs)`.
- `(onboarding)/` is a 4-step wizard (target-weight → personal-details → activity-level → set-goal) that builds a `UserProfile` and calls `completeOnboarding`.
- `(tabs)/` is the main app: `index` (home dashboard), `diary`, `scan`, `progress`, `profile`.
- `scan.tsx` captures/picks a photo (with `base64: true`), calls `scanFoodPhoto`, then navigates to `review-edit` passing the result as a JSON string param.
- `review-edit.tsx` is a modal that edits scan results (or a blank manual entry when `manual=true`) and commits via `addEntry`.

### Styling

No external UI/styling library — everything is the RN `StyleSheet` API reading design tokens from `constants/Colors.ts` (palette) and `constants/Theme.ts` (`Typography`, `Spacing`, `Radius`, `Shadows`, `FontFamily`). All type roles map to **Inter** weights (loaded in `app/_layout.tsx`); this is a deliberate override of the Syne/DM-Sans pairing described in `DESIGN.md`. Match these tokens rather than hardcoding values when adding UI.

## Conventions

- Imports are **relative** (`../lib/nutrition`), not the `@/*` alias — the alias exists in `tsconfig.json` but is unused in practice; follow the relative style.
- The `app/` package uses the new architecture (`newArchEnabled: true`) and typed routes (`typedRoutes` experiment), so route strings are type-checked.
