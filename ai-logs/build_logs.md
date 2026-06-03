# Kcal.AI — AI Conversation & Development Logs

This directory contains the AI conversation history and development logs showing how **Kcal.AI** was designed, architected, and built.

---

## Prompt 1: Designing the "Kinetic Noir" Design System
**User**: I want to build a premium, high-performance calorie tracking app in React Native using Expo and TypeScript. I want the UI to feel like a high-end sports car dashboard or a premium fitness wearable—sleek, dark mode, high contrast, and using neons as accents rather than boring primary colors. Let's design the theme tokens and file structure.

### Response
To achieve this high-performance, precision-engineered look, we will establish a custom design system called **"Kinetic Noir"**. It rejects soft, clinical pastel health app aesthetics in favor of a deep-space background with vibrant, functional neon accents.

Here is the design system token mapping:

#### Colors (`constants/Colors.ts`)
*   **Background / Canvas**: `#13131b` (Deep Space Dark)
*   **Surface Card**: `#1A1A28` (Tonal charcoal layer for components)
*   **Primary Accent**: `#FFFFFF` with custom glow or **Electric Lime** (`#87db59` / `#a2f872`) for highlights and primary CTA buttons.
*   **Functional Macro Colors**:
    *   **Protein**: `#64B5FF` (Vibrant Blue)
    *   **Carbohydrates**: `#FFB347` (Vibrant Orange)
    *   **Fats**: `#FF6B8A` (Vibrant Pink/Red)
*   **Text Hierarchy**:
    *   `text-primary`: `#EEEEF8` (Off-white)
    *   `text-muted`: `#6B6B90` (Soft blue-grey)

#### Typography & Theme (`constants/Theme.ts`)
We'll pair **Syne** (for bold, high-impact display data like remaining calories) and **DM Sans / Inter** (for clean, legible body text and lists in dark mode).

Let's organize the directory structure using **Expo Router** (file-based navigation):
```text
app/
├── app/                      # Expo Router screens
│   ├── (onboarding)/         # Harris-Benedict onboarding wizard
│   ├── (tabs)/               # Bottom navigation (Home, Diary, Scan, Progress, Profile)
│   ├── _layout.tsx           # Fonts, Theme Provider, state wraps
│   ├── review-edit.tsx       # AI Scan Edit modal
│   └── settings.tsx          # Settings screen
├── components/               # Custom UI Components (MacroRings, ScanFrame, WeekStrip, etc.)
├── constants/                # Colors.ts & Theme.ts
├── context/                  # AppContext.tsx for global state & local storage persistence
└── lib/                      # Business & API logic (ai-scan.ts, nutrition.ts, storage.ts)
```

---

## Prompt 2: Integrating Google Gemini Vision API for Mobile Food Scanning
**User**: How do I integrate the real Google Gemini Vision API to analyze a food photo in React Native? I want to pass a base64 image representation, receive a structured JSON breakdown containing food items, servings, calories, protein, carbs, and fats, and support graceful fallback when no API key is set.

### Response
We will use the `@google/generative-ai` SDK (or a direct fetch request) to communicate with the `gemini-flash-latest` model. To ensure the response is reliable and easy to parse, we instruct the model to return a minified, valid JSON object matching our interface.

Here is the implementation for `lib/ai-scan.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodEntry } from './nutrition';

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

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export async function scanFoodPhoto(imageUri: string, base64?: string | null): Promise<ScanResult> {
  if (!base64) {
    throw new Error("No image data provided for scanning.");
  }

  if (!GEMINI_API_KEY) {
    // Graceful fallback for demo/testing without API keys
    return {
      confidence: 'low',
      items: [],
      total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      notes: 'No Gemini API Key found in EXPO_PUBLIC_GEMINI_API_KEY.',
    };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Analyze this food image and provide nutritional information. 
Format your response exactly as a JSON object matching this schema:
{
  "confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": "string",
      "servingDescription": "string",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ],
  "total": {
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number
  },
  "notes": "string"
}
Ensure the output is valid JSON without any markdown formatting like \`\`\`json.`;

  const imageParts = [{
    inlineData: {
      data: base64,
      mimeType: "image/jpeg",
    },
  }];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown blocks
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    return JSON.parse(text) as ScanResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze image with Gemini API");
  }
}
```

---

## Prompt 3: Building Interactive Animated SVG Progress Rings
**User**: I want the home screen's calorie and macro tracker to look gorgeous and premium. Can we build concentric progress rings using `react-native-svg` and animate them using `react-native-reanimated`? The outer ring should be Electric Lime (Calories), and the three inner rings should represent Protein (Blue), Carbs (Orange), and Fat (Pink).

### Response
Using React Native SVG along with Reanimated 3, we can create custom animated concentric rings. Each ring uses a `Circle` element with a `strokeDashoffset` dynamically animated using `useAnimatedProps` based on the percentage of target completion.

Here is the core logic for the `MacroRings` component:

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  percentage: number;
  color: string;
  radius: number;
  strokeWidth: number;
  delay?: number;
}

function ProgressRing({ percentage, color, radius, strokeWidth }: RingProps) {
  const strokeDasharray = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, percentage)), { duration: 1200 });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => {
    const offset = strokeDasharray * (1 - progress.value);
    return { strokeDashoffset: offset };
  });

  return (
    <AnimatedCircle
      cx="100"
      cy="100"
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      animatedProps={animatedProps}
      strokeLinecap="round"
      fill="transparent"
      rotation="-90"
      origin="100, 100"
    />
  );
}

// Render nested rings on the dashboard
export default function MacroRings({ caloriesPct, proteinPct, carbsPct, fatPct }) {
  return (
    <View style={styles.container}>
      <Svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background track rings */}
        <Circle cx="100" cy="100" r="85" stroke="#1A1A28" strokeWidth={10} fill="none" />
        <Circle cx="100" cy="100" r="70" stroke="#1A1A28" strokeWidth={8} fill="none" />
        <Circle cx="100" cy="100" r="56" stroke="#1A1A28" strokeWidth={8} fill="none" />
        <Circle cx="100" cy="100" r="42" stroke="#1A1A28" strokeWidth={8} fill="none" />

        {/* Foreground active progress rings */}
        <ProgressRing percentage={caloriesPct} color="#87db59" radius={85} strokeWidth={10} />
        <ProgressRing percentage={proteinPct} color="#64B5FF" radius={70} strokeWidth={8} />
        <ProgressRing percentage={carbsPct} color="#FFB347" radius={56} strokeWidth={8} />
        <ProgressRing percentage={fatPct} color="#FF6B8A" radius={42} strokeWidth={8} />
      </Svg>
    </View>
  );
}
```

---

## Prompt 4: Implementing Local Persistence & Business Logic
**User**: How should we persist the food journal, user profile parameters (weight, targets, goals), and day streaks locally so the app remains fully responsive and functional even when offline?

### Response
We will use `@react-native-async-storage/async-storage` as a clean key-value store wrapper, and expose all state changes through a centralized custom hook `useApp()` from `AppContext.tsx`.

We'll structure key storage utilities in `lib/storage.ts`:
- `saveProfile(profile)` & `loadProfile()`
- `saveFoodDiary(entries)` & `loadFoodDiary()`
- `updateStreak()` which compares the user's last log date with today to increment the streak or reset it.

In `AppContext.tsx`, we orchestrate these calls inside `useEffect` initialization and offer callbacks like `addFoodEntry`, `deleteFoodEntry`, and `saveUserProfile`.

---

## Prompt 5: Creating the Progress Statistics & Weekly History Bar Charts
**User**: The application needs to display progress statistics, including weight trends, day streaks, and a beautiful weekly history bar chart showing how many calories the user consumed compared to their daily target. How do we build this screen in React Native cleanly?

### Response
We'll create a clean **Progress Screen** (`app/(tabs)/progress.tsx`) that:
1.  Displays the running streak card pulling a dynamic flame symbol with `streak` count from context.
2.  Builds a lightweight, hardware-accelerated bar chart from scratch using standard Flexbox layouts.
3.  Draws a dashed daily calorie limit threshold horizontal line over the bars to indicate visually whether the user stayed under or went over their calorie goals.
4.  Renders a metric grid showing Current Weight, Target Weight, Calories to Go, and Daily Goals.
