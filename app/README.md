# CalSnap — Calorie Tracker & AI Scanner (App Module)

CalSnap is a premium, dark-mode calorie tracking application built with Expo and React Native. It features a custom **"Kinetic Noir"** design system, an intuitive onboarding flow, daily macro tracking with animated rings, real Gemini Vision AI food scanner, weekly history charts, and streak/goal tracking.

---

## 🚀 Features

*   **Kinetic Noir Design**: A sleek dark mode UI with `Electric Lime` accents, `Syne` and `Inter` typography.
*   **Onboarding Wizard**: Calculates your baseline TDEE and daily macro goals using the Harris-Benedict equation based on your personal metrics.
*   **Interactive Dashboard**: Visualizes your daily progress with animated SVG concentric macro rings built with Reanimated 3.
*   **Gemini Vision AI Scanner**: A custom camera overlay UI to snap your meals, calling the real Gemini API (`gemini-flash-latest`) to return structured nutritional values with confidence ratings.
*   **Food Diary**: A chronologically ordered daily log, categorized by meal type (Breakfast, Lunch, Dinner, Snacks).
*   **Weekly History Charts**: Bar charts that map daily calorie intake compared to targets.
*   **Streak & Goal Tracking**: Keep logs daily to maintain and display your running streak.
*   **Local Persistence**: Completely offline-capable using `@react-native-async-storage/async-storage` to save profile metrics, target allocations, streaks, and meal logs.

---

## 🛠️ Technology Stack

*   **Framework**: [Expo](https://expo.dev/) (React Native)
*   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
*   **Styling**: StyleSheet API with custom design tokens (`constants/Colors.ts` & `Theme.ts`)
*   **Typography**: `@expo-google-fonts/inter` & `Syne`
*   **Animations**: `react-native-reanimated` & `react-native-svg`
*   **Storage**: `@react-native-async-storage/async-storage`

---

## 📁 File Structure

```text
app/
├── app/                      # Expo Router navigation (screens & layouts)
│   ├── (onboarding)/         # Onboarding flow (Weight, Details, Activity, Goal)
│   ├── (tabs)/               # Main bottom tab screens (Home, Diary, Scan, Progress, Profile)
│   ├── _layout.tsx           # Root layout & font loading
│   ├── index.tsx             # Entry redirect logic
│   ├── review-edit.tsx       # AI Scan Review modal
│   └── settings.tsx          # Settings screen
├── components/               # Reusable UI components
│   ├── FoodCard.tsx          # Food entry display card
│   ├── MacroBar.tsx          # Horizontal progress bar for individual macros
│   ├── MacroChip.tsx         # Pill-shaped tag for macros
│   ├── MacroRings.tsx        # Animated SVG concentric rings
│   ├── ScanFrame.tsx         # Camera viewfinder overlay with scanning line
│   └── WeekStrip.tsx         # Horizontal scrolling day selector
├── constants/                # Design tokens
│   ├── Colors.ts             # "Kinetic Noir" color palette
│   └── Theme.ts              # Typography, spacing, and layout tokens
├── context/                  # Global state management
│   └── AppContext.tsx        # AppProvider for state & persistence
├── lib/                      # Business logic & utilities
│   ├── ai-scan.ts            # Google Gemini AI vision service
│   ├── nutrition.ts          # TDEE, BMR, and macro calculations
│   └── storage.ts            # Local storage layer (AsyncStorage wrappers)
├── assets/                   # Static assets (images, fonts, splash)
├── package.json              # Project metadata and dependencies
└── app.json                  # Expo configuration
```

---

## 💻 Getting Started

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed on your machine.
- **Expo Go**: Install the **Expo Go** app on your Android or iOS device from the respective app store.

### 2. Installation
Install the dependencies:
```bash
# Navigate to the project directory
cd "c:\Projects\Calorie Tracker\app"

# Install dependencies
npm install
```

### 3. Gemini API Key Setup
CalSnap requires a Gemini API Key to enable the AI food scanning feature.
1. Get a free API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a file named `.env` inside the `app` directory (i.e. `app/.env`).
3. Add your key to the file:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

### 4. Running the Project
Start the Expo development server:
```bash
npx expo start
```
*If you encounter caching issues, run `npx expo start -c` to clear the cache.*

### 5. Running on your Device
1. Ensure your physical device is connected to the **same Wi-Fi network** as your computer.
2. Open the **Expo Go** app on your phone.
3. If on the same Wi-Fi, the app should appear automatically under "Development servers".
4. Alternatively, use the Expo Go app to **Scan the QR code** displayed in your terminal.
5. Wait for the JavaScript bundle to build and load onto your device.

---

## 📝 Available Commands

Run these from the `c:\Projects\Calorie Tracker\app` directory:

| Command | Description |
|---------|-------------|
| `npm install` | Installs project dependencies. |
| `npm start` or `npx expo start` | Starts the Metro Bundler development server. |
| `npx expo start --clear` | Starts the server and clears the Metro cache. |
| `npx expo start --android` | Opens the app on a connected Android device or emulator. |
| `npx expo install --fix` | Auto-fixes dependency version mismatches based on your Expo SDK. |

---

## 🔧 Troubleshooting

### "Failed to download remote update" (Expo Go / Network Issues)
If Metro Metro cannot bind to the correct local network interface:

**Step 1: Bind explicitly to your local IP address**
Find your IP address using `ipconfig` (e.g., `192.168.1.2`), and start Expo by explicitly setting the host:
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.2"; npx expo start -c
```

**Step 2: Allow Port 8081 through Windows Firewall**
If Step 1 doesn't work, Windows Defender Firewall might be blocking incoming connections to the Metro bundler. Open a PowerShell terminal **As Administrator** and run:
```powershell
New-NetFirewallRule -DisplayName "Expo Metro Bundler (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```
