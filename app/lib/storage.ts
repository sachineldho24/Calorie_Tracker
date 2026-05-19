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
  getDailyTargets,
  getToday,
  generateId,
} from './nutrition';

const KEYS = {
  USER_PROFILE: '@kcalai_user_profile',
  ONBOARDING_COMPLETE: '@kcalai_onboarding_complete',
  FOOD_ENTRIES: '@kcalai_food_entries',
  STREAK: '@kcalai_streak',
  WATER_INTAKE: '@kcalai_water_intake',
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

// === Clear All Data ===

export async function clearAllData(): Promise<void> {
  const keys = Object.values(KEYS);
  await AsyncStorage.multiRemove(keys);
}
