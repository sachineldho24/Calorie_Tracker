# Kcal.AI - Calorie Tracker

An AI-powered mobile application built with React Native and Expo that tracks calories by analyzing pictures of your food using the Google Gemini Vision API.

## Prerequisites

- **Expo Go App**: Make sure you have the Expo Go app installed on your Android/iOS device. This project is built using Expo SDK 51.
- **Node.js**: Recommended version 18 or above.

## Getting Started

1. **Install Dependencies**
   Navigate into the `app` directory and install the necessary packages:
   ```bash
   cd app
   npm install
   ```

2. **Gemini API Key Setup**
   You need a Google Gemini API Key to enable the AI food scanning feature.
   - Get your free API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Create a file named `.env` in the `app` directory (i.e., `app/.env`)
   - Add your API key to the file:
     ```env
     EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
     ```

## Running the App

### Standard Local LAN Connection
The easiest way to run the app is over your Local Area Network (Wi-Fi). Ensure your phone and PC are on the same Wi-Fi network.

```bash
cd app
npx expo start -c
```
*Note: If Expo tries to connect to `127.0.0.1`, force it to use your local IP:*
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="YOUR_LOCAL_IP_ADDRESS"; npx expo start -c
```
*(Replace `YOUR_LOCAL_IP_ADDRESS` with your actual PC Wi-Fi IP, e.g., `192.168.1.x`)*

### Windows Firewall Issues (LAN not connecting)
If the Expo server is running but your phone cannot connect (endpoint is offline), Windows Defender Firewall is likely blocking incoming connections on port 8081.

**To fix this permanently (Run in PowerShell as Administrator):**
```powershell
New-NetFirewallRule -DisplayName "Expo Metro Bundler (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

### Ngrok Tunnel (Alternative Method)
If you are on a restrictive network (like a public cafe) or LAN isn't working, you can use a tunnel.
```bash
npx expo start -c --tunnel
```
*Troubleshooting:* If you get a `CommandError: TypeError: Cannot read properties of undefined (reading 'body')` or `ngrok tunnel took too long to connect`, it means the Ngrok tunneling service is currently experiencing outages or rate limits. In this case, use the LAN connection method above.

## Tech Stack
- React Native (Expo)
- Google Gemini API (gemini-flash-latest)
- TypeScript
