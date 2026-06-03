/**
 * Nutrition calculation utilities
 * Harris-Benedict / Mifflin-St Jeor TDEE + macro splitting
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface WeightEntry {
  date: string;     // YYYY-MM-DD
  weightKg: number;
}

export interface ProgressPhoto {
  id: string;
  uri: string;      // local file path — no base64
  date: string;     // YYYY-MM-DD
  timestamp: number;
}

export interface UserProfile {
  name?: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export interface DailyTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingDescription: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: number;
  date: string; // YYYY-MM-DD
  imageUri?: string;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: FoodEntry[];
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin-St Jeor BMR calculation
 */
export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * Total Daily Energy Expenditure
 */
export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

/**
 * Calculate daily calorie target based on goal
 */
export function calculateCalorieTarget(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);

  switch (profile.goalType) {
    case 'lose':
      return Math.round(tdee - 500); // ~0.5kg/week deficit
    case 'gain':
      return Math.round(tdee + 300); // lean bulk surplus
    case 'maintain':
    default:
      return tdee;
  }
}

/**
 * Split calories into macros
 * Default: 30% protein, 40% carbs, 30% fat
 */
export function calculateMacroTargets(calories: number): DailyTargets {
  return {
    calories,
    proteinG: Math.round((calories * 0.30) / 4), // 4 cal/g
    carbsG: Math.round((calories * 0.40) / 4),   // 4 cal/g
    fatG: Math.round((calories * 0.30) / 9),      // 9 cal/g
  };
}

/**
 * Full daily targets from profile
 */
export function getDailyTargets(profile: UserProfile): DailyTargets {
  const calories = calculateCalorieTarget(profile);
  return calculateMacroTargets(calories);
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date string
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Get the days of the current week
 */
export function getWeekDays(referenceDate: Date = new Date()): Date[] {
  const days: Date[] = [];
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function getDayInitial(date: Date): string {
  return DAY_INITIALS[date.getDay()];
}
