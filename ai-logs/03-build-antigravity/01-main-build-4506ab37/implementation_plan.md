# Cal AI Clone — Full Calorie Tracker App (Expo/React Native)

Build the entire calorie tracker application as a production-ready Expo React Native app, matching the Stitch UI screens pixel-for-pixel, and make it runnable on the user's POCO X3 (Android) and iOS.

## Stitch Project Summary

The Stitch project `projects/11477223460145127465` ("Calendar App Full Implementation") contains **15 screens** with the "Kinetic Noir" design system. The visible (active) screens that form the app's core flow are:

| # | Screen Title | Screen ID | Purpose |
|---|---|---|---|
| 1 | Onboarding - Target Weight | `555bd984acca47b2a3f143a7d90daa1e` | Weight goal input |
| 2 | Onboarding - Personal Details | `fd1a6a4628514c9ca59665fb992662ee` | Height, age, sex |
| 3 | Onboarding - Activity Level | `338d3487480742a5b94d6cbf9c4b4082` | Activity selection |
| 4 | Onboarding - Set Goal | `4a2f796668b341d4b8ead27ce85e5453` | Weight goal type |
| 5 | Home Dashboard | `f60ca43bc55140dfaaf0ccc2d9791bee` | Macro rings + daily summary |
| 6 | Food Diary | `e1ebf08bae0848d0ac4a73b390414ee7` | Chronological meal log |
| 7 | AI Meal Scan | `cb318664d83a48c2884a06292b0cc7e5` | Camera scan UI |
| 8 | Review & Edit | `6a4fb0ad05d144ef8c6435469cd6ebf7` | Edit AI scan results |
| 9 | User Profile | `a9593c09a6bd447fa5a08fb1f862e720` | Profile page |
| 10 | App Settings | `a0f291c1f8db4a82a5d49f360cd70a17` | Settings page |
| 11 | Progress Overview | `ea95b9be4b5846b19a53195dd7fa1968` | Weight/progress charts |

Plus additional hidden screens (duplicates/iterations) and two uploaded reference files.

## User Requirements

1. **Font override**: Use **Inter** everywhere instead of Syne/DM Sans (the only change from DESIGN.md)
2. **Pixel-perfect UI**: Match the Stitch screens exactly
3. **Cross-platform**: Must work on Android (POCO X3) and iOS
4. **Test device**: POCO X3 (Android) — primary test target, no iPhone available

## Design System — "Kinetic Noir" (with Inter override)

- **Colors**: Dark premium (#0C0C14 base, #13131b surface, #1A1A28 cards)
- **Accent**: Electric Lime #a8ff78 / #A2F872
- **Macros**: Protein #64B5FF, Carbs #FFB347, Fat #FF6B8A
- **Font**: ~~Syne + DM Sans~~ → **Inter** for ALL typography roles
- **Roundness**: 4px–16px hierarchy, full circles for FAB/rings
- **Spacing**: 20px page padding, 24px section gap, 12px card gap, 16px inner padding

## Open Questions

> [!IMPORTANT]
> **AI Vision API Key**: The photo scan feature needs a Vision API (GPT-4o, Claude, or Gemini). Do you have an API key ready, or should I build the UI with a mock/placeholder for now and wire it up later?

> [!IMPORTANT]
> **Backend/Database**: The PRD mentions SQLite for local storage. Should I use:
> - **AsyncStorage + SQLite** (fully offline, no account sync) — simplest for contest
> - **Supabase** (cloud-backed, user accounts) — more production-ready
> 
> Recommendation: SQLite for contest speed. We can add cloud sync later.

> [!IMPORTANT]
> **Barcode Scanner**: Open Food Facts API is free and keyless. Should I integrate it now, or focus on the photo scan + manual entry first?

## Proposed Changes

### Phase 1: Project Setup & Design System

#### [NEW] Expo project initialization
- `npx -y create-expo-app@latest ./` in `c:\Projects\Calorie Tracker`
- Install dependencies: `expo-router`, `expo-camera`, `expo-image-picker`, `react-native-reanimated`, `react-native-svg`, `expo-sqlite`, `expo-font`, `@expo/vector-icons`
- Configure `app.json` for both Android and iOS (app name: "Kcal.AI")
- Load **Inter** font via `expo-font` / Google Fonts

#### [NEW] `constants/theme.ts`
- Full design token system: colors, typography (all Inter), spacing, roundness
- Export typed constants for use across all components

#### [NEW] `constants/colors.ts`
- All color tokens from the Kinetic Noir design system

---

### Phase 2: Navigation & Core Layout

#### [NEW] `app/_layout.tsx`
- Root layout with Expo Router
- Font loading (Inter with all weights: 400, 500, 600, 700, 800)
- Navigation structure: Tab navigator + Stack screens

#### [NEW] `app/(tabs)/_layout.tsx`
- Bottom tab bar: Home, Diary, Scan (center FAB), Progress, Profile
- Custom tab bar matching Stitch design (dark surface, lime active indicator)
- Center FAB with glow effect for the Scan button

#### [NEW] `app/(onboarding)/_layout.tsx`
- Stack navigator for onboarding flow
- Conditional redirect: if onboarding complete → tabs, else → onboarding

---

### Phase 3: Onboarding Flow (4 screens)

#### [NEW] `app/(onboarding)/target-weight.tsx`
- Weight input with slider/scroll picker
- Current weight + target weight
- Matches "Onboarding - Target Weight" Stitch screen

#### [NEW] `app/(onboarding)/personal-details.tsx`
- Height, age, sex inputs
- Matches "Onboarding - Personal Details" Stitch screen

#### [NEW] `app/(onboarding)/activity-level.tsx`
- Activity level selection cards (Sedentary, Light, Moderate, Active, Very Active)
- Matches "Onboarding - Activity Level" Stitch screen

#### [NEW] `app/(onboarding)/set-goal.tsx`
- Goal type: Lose, Maintain, Gain
- TDEE calculation (Harris-Benedict)
- Daily calorie/macro targets
- Matches "Onboarding - Set Goal" Stitch screen

---

### Phase 4: Main App Screens

#### [NEW] `app/(tabs)/index.tsx` — Home Dashboard
- **Hero element**: Animated circular macro rings (Cal/Protein/Carbs/Fat)
- Remaining calories as hero number
- Week strip (horizontal day selector)
- Daily macro summary bars
- Recent meals preview
- Matches "Home Dashboard" Stitch screen

#### [NEW] `app/(tabs)/diary.tsx` — Food Diary
- Chronological meal list grouped by meal type (Breakfast, Lunch, Dinner, Snacks)
- Food cards with thumbnail, name, calorie/macro chips
- Week strip at top
- Matches "Food Diary" Stitch screen

#### [NEW] `app/(tabs)/scan.tsx` — AI Meal Scan
- Camera viewfinder with scanning frame overlay
- Corner-stroke scan frame (3px, 24px radius)
- Animated scan line (Electric Lime horizontal line)
- Capture button
- Matches "AI Meal Scan" Stitch screen

#### [NEW] `app/(tabs)/progress.tsx` — Progress Overview
- Weight trend chart
- Weekly calorie averages
- Streak counter
- Matches "Progress Overview" Stitch screen

#### [NEW] `app/(tabs)/profile.tsx` — User Profile
- User info display
- Daily targets summary
- Navigation to Settings
- Matches "User Profile" Stitch screen

#### [NEW] `app/review-edit.tsx` — Review & Edit (Stack screen)
- AI scan results display
- Editable food items (name, calories, macros)
- Confidence indicator
- Save/discard actions
- Matches "Review & Edit" Stitch screen

#### [NEW] `app/settings.tsx` — App Settings (Stack screen)
- Notification preferences
- Unit preferences (metric/imperial)
- Theme settings
- Data management
- Matches "App Settings" Stitch screen

---

### Phase 5: Shared Components

#### [NEW] `components/MacroRings.tsx`
- Animated concentric circular progress bars using `react-native-svg` + Reanimated
- Outer: Calories (Electric Lime), Inner: Protein (Blue), Carbs (Orange), Fat (Pink)

#### [NEW] `components/WeekStrip.tsx`
- Horizontal scrolling day selector
- Active state with Electric Lime highlight

#### [NEW] `components/FoodCard.tsx`
- Food entry card with thumbnail, title, macro chips
- Dark card background with border

#### [NEW] `components/MacroChip.tsx`
- Pill-shaped macro tag (15% opacity bg, full color text)

#### [NEW] `components/BottomTabBar.tsx`
- Custom tab bar with center FAB (glow effect)

#### [NEW] `components/ScanFrame.tsx`
- Camera overlay with corner-only strokes

#### [NEW] `components/MacroBar.tsx`
- Horizontal progress bar for individual macros

---

### Phase 6: Data Layer

#### [NEW] `lib/database.ts`
- SQLite schema: users, food_entries, daily_goals, streaks
- CRUD operations

#### [NEW] `lib/nutrition.ts`
- TDEE calculation (Harris-Benedict / Mifflin-St Jeor)
- Macro split calculator

#### [NEW] `lib/ai-scan.ts`
- Vision API integration (placeholder/mock initially)
- Prompt engineering per PRD spec

#### [NEW] `hooks/useNutrition.ts`
- Custom hooks for daily totals, remaining macros, streak

---

### Phase 7: Polish & Platform Testing

- Test on POCO X3 via Expo Go or development build
- Verify all animations run smoothly (Reanimated)
- Ensure safe area handling for Android notch/nav bar
- Dark theme system-level integration

## Verification Plan

### Automated Tests
- Run `npx expo start` and verify no build errors
- Test on Android via Expo Go on POCO X3
- Verify all screens render correctly with Inter font

### Manual Verification
- Side-by-side comparison of each screen against Stitch screenshots
- Test complete flow: Onboarding → Dashboard → Scan → Review → Diary
- Verify animations: macro rings, scan line, tab transitions
- Test on POCO X3 specifically for performance and layout
