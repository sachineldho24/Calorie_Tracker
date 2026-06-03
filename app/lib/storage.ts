/**
 * Local storage layer using AsyncStorage
 * Manages user profile, food entries, and daily data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  FoodEntry,
  DailySummary,
  DailyTargets,
  WeightEntry,
  ProgressPhoto,
  getDailyTargets,
  getToday,
  generateId,
} from './nutrition';

const KEYS = {
  USER_PROFILE: '@calsnap_user_profile',
  ONBOARDING_COMPLETE: '@calsnap_onboarding_complete',
  FOOD_ENTRIES: '@calsnap_food_entries',
  STREAK: '@calsnap_streak',
  WATER_INTAKE: '@calsnap_water_intake',
  GEMINI_API_KEY: '@calsnap_gemini_api_key',
  USE_LOCATION: '@calsnap_use_location',
  MEAL_SUGGESTION: '@calsnap_meal_suggestion', // suffixed with _<date>_<slot>
  PROVIDER_CONFIG: '@calsnap_provider_config',
  ASSISTANT_MEMORY: '@calsnap_assistant_memory',
  WEIGHT_HISTORY: '@calsnap_weight_history',
  PROGRESS_PHOTOS: '@calsnap_progress_photos',
};

// === User Profile ===

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
}

export async function isOnboardingComplete(): Promise<boolean> {
  const data = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
  return data ? JSON.parse(data) : false;
}

// === Food Entries ===

async function getAllEntries(): Promise<FoodEntry[]> {
  const data = await AsyncStorage.getItem(KEYS.FOOD_ENTRIES);
  return data ? JSON.parse(data) : [];
}

async function saveAllEntries(entries: FoodEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FOOD_ENTRIES, JSON.stringify(entries));
}

export async function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'timestamp' | 'date'>): Promise<FoodEntry> {
  const entries = await getAllEntries();
  const newEntry: FoodEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
    date: getToday(),
  };
  entries.push(newEntry);
  await saveAllEntries(entries);
  return newEntry;
}

export async function updateFoodEntry(id: string, updates: Partial<FoodEntry>): Promise<void> {
  const entries = await getAllEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    await saveAllEntries(entries);
  }
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const entries = await getAllEntries();
  const filtered = entries.filter(e => e.id !== id);
  await saveAllEntries(filtered);
}

export async function getEntriesForDate(date: string): Promise<FoodEntry[]> {
  const entries = await getAllEntries();
  return entries.filter(e => e.date === date).sort((a, b) => a.timestamp - b.timestamp);
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const entries = await getEntriesForDate(date);
  return {
    date,
    totalCalories: entries.reduce((sum, e) => sum + e.calories, 0),
    totalProtein: entries.reduce((sum, e) => sum + e.proteinG, 0),
    totalCarbs: entries.reduce((sum, e) => sum + e.carbsG, 0),
    totalFat: entries.reduce((sum, e) => sum + e.fatG, 0),
    entries,
  };
}

// === Streak ===

interface StreakData {
  currentStreak: number;
  lastLogDate: string;
  longestStreak: number;
}

export async function getStreak(): Promise<StreakData> {
  const data = await AsyncStorage.getItem(KEYS.STREAK);
  return data ? JSON.parse(data) : { currentStreak: 0, lastLogDate: '', longestStreak: 0 };
}

export async function updateStreak(): Promise<StreakData> {
  const streak = await getStreak();
  const today = getToday();

  if (streak.lastLogDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastLogDate === yesterdayStr) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.lastLogDate = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  return streak;
}

// === Water ===

export async function getWaterIntake(date: string): Promise<number> {
  const data = await AsyncStorage.getItem(`${KEYS.WATER_INTAKE}_${date}`);
  return data ? JSON.parse(data) : 0;
}

export async function addWaterGlass(date: string): Promise<number> {
  const current = await getWaterIntake(date);
  const updated = current + 1;
  await AsyncStorage.setItem(`${KEYS.WATER_INTAKE}_${date}`, JSON.stringify(updated));
  return updated;
}

// === Gemini API Key (user-supplied, stored as a plain string) ===

export async function getGeminiApiKey(): Promise<string | null> {
  const data = await AsyncStorage.getItem(KEYS.GEMINI_API_KEY);
  return data ? data : null;
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.GEMINI_API_KEY, key.trim());
}

export async function clearGeminiApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.GEMINI_API_KEY);
}

// === Location preference (opt-in for meal suggestions) ===

export async function getUseLocation(): Promise<boolean> {
  const data = await AsyncStorage.getItem(KEYS.USE_LOCATION);
  return data ? JSON.parse(data) : false;
}

export async function setUseLocation(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.USE_LOCATION, JSON.stringify(enabled));
}

// === Meal suggestion cache (one per date + meal slot) ===

function suggestionKey(date: string, slot: string): string {
  return `${KEYS.MEAL_SUGGESTION}_${date}_${slot}`;
}

export async function getCachedSuggestion<T>(date: string, slot: string): Promise<T | null> {
  const data = await AsyncStorage.getItem(suggestionKey(date, slot));
  return data ? JSON.parse(data) : null;
}

export async function saveCachedSuggestion<T>(date: string, slot: string, suggestion: T): Promise<void> {
  await AsyncStorage.setItem(suggestionKey(date, slot), JSON.stringify(suggestion));
}

// === AI Provider config (JSON blob) ===

export async function getProviderConfig<T>(): Promise<T | null> {
  const data = await AsyncStorage.getItem(KEYS.PROVIDER_CONFIG);
  return data ? JSON.parse(data) : null;
}

export async function saveProviderConfig<T>(config: T): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROVIDER_CONFIG, JSON.stringify(config));
}

// === Assistant persistent memory (model-agnostic, plain JSON) ===

export async function getAssistantMemory<T>(): Promise<T | null> {
  const data = await AsyncStorage.getItem(KEYS.ASSISTANT_MEMORY);
  return data ? JSON.parse(data) : null;
}

export async function saveAssistantMemory<T>(memory: T): Promise<void> {
  await AsyncStorage.setItem(KEYS.ASSISTANT_MEMORY, JSON.stringify(memory));
}

// === Recent unique entries (for re-log in scan screen) ===

export async function getRecentUniqueEntries(limit = 8): Promise<FoodEntry[]> {
  const all = await getAllEntries();
  // Sort newest first, then dedupe by name (keep the most recent per name)
  const sorted = [...all].sort((a, b) => b.timestamp - a.timestamp);
  const seen = new Set<string>();
  const unique: FoodEntry[] = [];
  for (const e of sorted) {
    const key = e.name.toLowerCase().trim();
    if (!seen.has(key)) { seen.add(key); unique.push(e); }
    if (unique.length >= limit) break;
  }
  return unique;
}

// === Weight history ===

export async function getWeightHistory(): Promise<WeightEntry[]> {
  const data = await AsyncStorage.getItem(KEYS.WEIGHT_HISTORY);
  return data ? JSON.parse(data) : [];
}

export async function addWeightEntry(weightKg: number, date?: string): Promise<WeightEntry[]> {
  const history = await getWeightHistory();
  const entry: WeightEntry = { date: date ?? getToday(), weightKg };
  // Replace any existing entry for the same date, otherwise append
  const filtered = history.filter(e => e.date !== entry.date);
  const updated = [...filtered, entry]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90); // keep last 90 entries
  await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(updated));
  return updated;
}

// === Progress photos ===

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  const data = await AsyncStorage.getItem(KEYS.PROGRESS_PHOTOS);
  return data ? JSON.parse(data) : [];
}

export async function addProgressPhoto(uri: string): Promise<ProgressPhoto[]> {
  const photos = await getProgressPhotos();
  const photo: ProgressPhoto = { id: generateId(), uri, date: getToday(), timestamp: Date.now() };
  const updated = [photo, ...photos].slice(0, 30); // newest first, cap at 30
  await AsyncStorage.setItem(KEYS.PROGRESS_PHOTOS, JSON.stringify(updated));
  return updated;
}

export async function removeProgressPhoto(id: string): Promise<ProgressPhoto[]> {
  const photos = await getProgressPhotos();
  const updated = photos.filter(p => p.id !== id);
  await AsyncStorage.setItem(KEYS.PROGRESS_PHOTOS, JSON.stringify(updated));
  return updated;
}

// === Clear All Data ===

export async function clearAllData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  // Remove the fixed keys plus any date/slot-suffixed water and suggestion entries.
  const toRemove = allKeys.filter(
    k => Object.values(KEYS).some(base => k === base || k.startsWith(`${base}_`)),
  );
  await AsyncStorage.multiRemove(toRemove);
}
