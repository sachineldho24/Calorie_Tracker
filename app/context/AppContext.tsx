/**
 * Global app state context
 * Manages user profile, daily data, and food entries
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfile,
  FoodEntry,
  DailySummary,
  DailyTargets,
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
  isLoading: true,
  setProfile: async () => {},
  completeOnboarding: async () => {},
  setSelectedDate: () => {},
  addEntry: async () => ({} as FoodEntry),
  removeEntry: async () => {},
  editEntry: async () => {},
  drinkWater: async () => {},
  refreshData: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [targets, setTargets] = useState<DailyTargets>(defaultTargets);
  const [selectedDate, setSelectedDateState] = useState(getToday());
  const [summary, setSummary] = useState<DailySummary>(emptySummary);
  const [streak, setStreak] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
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
        const [savedProfile, onboarded] = await Promise.all([
          getUserProfile(),
          isOnboardingComplete(),
        ]);

        if (savedProfile) {
          setProfileState(savedProfile);
          setTargets(getDailyTargets(savedProfile));
        }
        setOnboardingDone(onboarded);
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
        isLoading,
        setProfile,
        completeOnboarding,
        setSelectedDate,
        addEntry,
        removeEntry,
        editEntry,
        drinkWater,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
