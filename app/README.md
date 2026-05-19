# Kcal.AI — Calorie Tracker & AI Scanner

Kcal.AI is a premium, dark-mode calorie tracking application built with Expo and React Native. It features a custom "Kinetic Noir" design system, an intuitive onboarding flow, daily macro tracking with animated rings, and a mock AI meal scanner to log foods effortlessly.

## 🚀 Features

- **Kinetic Noir Design**: A sleek dark mode UI with `Electric Lime` accents and `Inter` typography.
- **Onboarding Wizard**: Calculates your baseline TDEE and daily macro goals using the Harris-Benedict equation based on your personal metrics.
- **Interactive Dashboard**: Visualizes your daily progress with animated SVG macro rings built with Reanimated 3.
- **AI Meal Scanner (Mock)**: A custom camera overlay UI to snap your meals, accompanied by a realistic AI analysis mock returning data (including diverse cuisines) with varying confidence levels.
- **Food Diary**: A chronologically ordered daily log, categorized by meal type.
- **Local Persistence**: Completely offline-capable MVP using `@react-native-async-storage/async-storage` to save your profile, targets, and logs.

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: StyleSheet API with custom design tokens (`constants/Colors.ts` & `Theme.ts`)
- **Typography**: `@expo-google-fonts/inter`
- **Animations**: `react-native-reanimated` & `react-native-svg`
- **Storage**: `@react-native-async-storage/async-storage`

## 📁 File Structure

```text
c:\Projects\Calorie Tracker\app\
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
│   ├── ai-scan.ts            # Mock AI vision service
│   ├── nutrition.ts          # TDEE, BMR, and macro calculations
│   └── storage.ts            # Local storage layer (AsyncStorage wrappers)
├── assets/                   # Static assets (images, fonts, splash)
├── package.json              # Project metadata and dependencies
└── app.json                  # Expo configuration
```

## 💻 Getting Started

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed on your machine.
- **Expo Go**: Install the **Expo Go** app on your Android (POCO X3) or iOS device from the respective app store.

### 2. Installation
Clone the repository and install the dependencies:
```bash
# Navigate to the project directory
cd "c:\Projects\Calorie Tracker\app"

# Install dependencies
npm install
```

### 3. Running the Project
Start the Expo development server:
```bash
npx expo start
```
*If you encounter caching issues, run `npx expo start -c` to clear the cache.*

### 4. Running on your Device (POCO X3)
1. Ensure your POCO X3 is connected to the **same Wi-Fi network** as your computer.
2. Open the **Expo Go** app on your phone.
3. If on the same Wi-Fi, the app should appear automatically under "Development servers".
4. Alternatively, use the Expo Go app to **Scan the QR code** displayed in your terminal.
5. Wait for the JavaScript bundle to build and load onto your device.

> **Note on Expo SDK Versions:** This project is initialized with Expo SDK 54 dependencies. If your Expo Go app (e.g., SDK 51) fails to load the project, you have two options:
> - Update your Expo Go app via the Google Play Store.
> - Run `npx expo install --fix` in your terminal to attempt aligning the project dependencies with your globally installed Expo version.

## 📝 Available Commands

Run these from the `c:\Projects\Calorie Tracker\app` directory:

| Command | Description |
|---------|-------------|
| `npm install` | Installs project dependencies. |
| `npm start` or `npx expo start` | Starts the Metro Bundler development server. |
| `npx expo start --clear` | Starts the server and clears the Metro cache. |
| `npx expo start --android` | Opens the app on a connected Android device or emulator. |
| `npx expo install --fix` | Auto-fixes dependency version mismatches based on your Expo SDK. |

**In-Terminal Shortcuts (while the server is running):**
- Press `a` to launch on Android emulator.
- Press `i` to launch on iOS simulator.
- Press `r` to reload the app manually.
- Press `m` to toggle the developer menu.

## 🔧 Troubleshooting

### "Failed to download remote update" (Expo Go / Network Issues)
If you are testing on a physical device and Expo Go cannot connect to your local server (or gets stuck at downloading the bundle), Windows may be blocking the connection or Expo may be binding to the wrong network interface.

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

### Animation Glitches
If the macro rings or scan frames don't animate smoothly, let me know so we can tweak the `react-native-reanimated` physics specific to your Android device.
