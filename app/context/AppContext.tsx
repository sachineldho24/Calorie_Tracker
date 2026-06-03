/**
 * Global app state context
 * Manages user profile, daily data, food entries, weight history, and progress photos
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfile,
  FoodEntry,
  DailySummary,
  DailyTargets,
  WeightEntry,
  ProgressPhoto,
  getDailyTargets,
  getToday,
} from '../lib/nutrition';
import {
  getUserProfile,
  saveUserProfile,
  isOnboardingComplete,
  setOnboardingComplete,
  getEntriesForDate,
  getDailySummary,
  addFoodEntry,
  deleteFoodEntry,
  updateFoodEntry,
  getStreak,
  updateStreak,
  getWaterIntake,
  addWaterGlass,
  getWeightHistory,
  addWeightEntry as storageAddWeightEntry,
  getProgressPhotos,
  addProgressPhoto as storageAddProgressPhoto,
  removeProgressPhoto as storageRemoveProgressPhoto,
} from '../lib/storage';

interface AppState {
  // User
  profile: UserProfile | null;
  onboardingDone: boolean;
  targets: DailyTargets;

  // Daily
  selectedDate: string;
  summary: DailySummary;
  streak: number;
  waterGlasses: number;

  // Weight & photos
  weightHistory: WeightEntry[];
  progressPhotos: ProgressPhoto[];

  // Loading
  isLoading: boolean;

  // Actions
  setProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  addEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp' | 'date'>) => Promise<FoodEntry>;
  removeEntry: (id: string) => Promise<void>;
  editEntry: (id: string, updates: Partial<FoodEntry>) => Promise<void>;
  drinkWater: () => Promise<void>;
  refreshData: () => Promise<void>;
  addWeightEntry: (kg: number) => Promise<void>;
  addProgressPhoto: (uri: string) => Promise<void>;
  removeProgressPhoto: (id: string) => Promise<void>;
  resetApp: () => void;
}

const defaultTargets: DailyTargets = { calories: 2000, proteinG: 150, carbsG: 200, fatG: 67 };
const emptySummary: DailySummary = {
  date: getToday(),
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  entries: [],
};

const AppContext = createContext<AppState>({
  profile: null,
  onboardingDone: false,
  targets: defaultTargets,
  selectedDate: getToday(),
  summary: emptySummary,
  streak: 0,
  waterGlasses: 0,
  weightHistory: [],
  progressPhotos: [],
  isLoading: true,
  setProfile: async () => {},
  completeOnboarding: async () => {},
  setSelectedDate: () => {},
  addEntry: async () => ({} as FoodEntry),
  removeEntry: async () => {},
  editEntry: async () => {},
  drinkWater: async () => {},
  refreshData: async () => {},
  addWeightEntry: async () => {},
  addProgressPhoto: async () => {},
  removeProgressPhoto: async () => {},
  resetApp: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [targets, setTargets] = useState<DailyTargets>(defaultTargets);
  const [selectedDate, setSelectedDateState] = useState(getToday());
  const [summary, setSummary] = useState<DailySummary>(emptySummary);
  const [streak, setStreak] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [dailySummary, streakData, water] = await Promise.all([
        getDailySummary(selectedDate),
        getStreak(),
        getWaterIntake(selectedDate),
      ]);
      setSummary(dailySummary);
      setStreak(streakData.currentStreak);
      setWaterGlasses(water);
    } catch (e) {
      console.error('Failed to refresh data:', e);
    }
  }, [selectedDate]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [savedProfile, onboarded, weights, photos] = await Promise.all([
          getUserProfile(),
          isOnboardingComplete(),
          getWeightHistory(),
          getProgressPhotos(),
        ]);

        if (savedProfile) {
          setProfileState(savedProfile);
          setTargets(getDailyTargets(savedProfile));
        }
        setOnboardingDone(onboarded);
        setWeightHistory(weights);
        setProgressPhotos(photos);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Refresh when date changes
  useEffect(() => {
    if (!isLoading) {
      refreshData();
    }
  }, [selectedDate, isLoading, refreshData]);

  const setProfile = async (newProfile: UserProfile) => {
    await saveUserProfile(newProfile);
    setProfileState(newProfile);
    setTargets(getDailyTargets(newProfile));
  };

  const completeOnboarding = async () => {
    await setOnboardingComplete(true);
    setOnboardingDone(true);
  };

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
  };

  const addEntry = async (entry: Omit<FoodEntry, 'id' | 'timestamp' | 'date'>) => {
    const newEntry = await addFoodEntry(entry);
    await updateStreak();
    await refreshData();
    return newEntry;
  };

  const removeEntry = async (id: string) => {
    await deleteFoodEntry(id);
    await refreshData();
  };

  const editEntry = async (id: string, updates: Partial<FoodEntry>) => {
    await updateFoodEntry(id, updates);
    await refreshData();
  };

  const drinkWater = async () => {
    const updated = await addWaterGlass(selectedDate);
    setWaterGlasses(updated);
  };

  const addWeightEntry = async (kg: number) => {
    const updated = await storageAddWeightEntry(kg);
    setWeightHistory(updated);
    // Also update the profile's current weight so TDEE stays accurate
    if (profile) {
      const updatedProfile = { ...profile, weightKg: kg };
      await saveUserProfile(updatedProfile);
      setProfileState(updatedProfile);
      setTargets(getDailyTargets(updatedProfile));
    }
  };

  const addProgressPhoto = async (uri: string) => {
    const updated = await storageAddProgressPhoto(uri);
    setProgressPhotos(updated);
  };

  const removeProgressPhoto = async (id: string) => {
    const updated = await storageRemoveProgressPhoto(id);
    setProgressPhotos(updated);
  };

  // Wipe all in-memory state so the index gate re-evaluates after clearAllData().
  const resetApp = () => {
    setProfileState(null);
    setOnboardingDone(false);
    setTargets(defaultTargets);
    setSummary(emptySummary);
    setStreak(0);
    setWaterGlasses(0);
    setWeightHistory([]);
    setProgressPhotos([]);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        onboardingDone,
        targets,
        selectedDate,
        summary,
        streak,
        waterGlasses,
        weightHistory,
        progressPhotos,
        isLoading,
        setProfile,
        completeOnboarding,
        setSelectedDate,
        addEntry,
        removeEntry,
        editEntry,
        drinkWater,
        refreshData,
        addWeightEntry,
        addProgressPhoto,
        removeProgressPhoto,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
