import { emptyState, isValidDate, MEAL_CATEGORIES } from './model.ts';
import type { AppState, Meal, Plan } from './model.ts';

export const STORAGE_KEY = 'meal-points:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonblank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPointAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 99999999;
}

function isPlan(value: unknown): value is Plan {
  return isRecord(value)
    && isNonblank(value.name)
    && isPointAmount(value.startingBalance)
    && typeof value.endDate === 'string'
    && isValidDate(value.endDate);
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function isMeal(value: unknown): value is Meal {
  return isRecord(value)
    && isNonblank(value.id)
    && isNonblank(value.location)
    && isPointAmount(value.points)
    && MEAL_CATEGORIES.some((category) => value.category === category)
    && typeof value.date === 'string'
    && isValidDate(value.date)
    && isTimestamp(value.createdAt);
}

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value) || value.version !== 1 || (value.plan !== null && !isPlan(value.plan))) return false;
  if (!Array.isArray(value.meals) || !value.meals.every(isMeal)) return false;
  if (value.plan === null && value.meals.length > 0) return false;
  if (new Set(value.meals.map((meal) => meal.id)).size !== value.meals.length) return false;
  const total = value.meals.reduce((sum, meal) => sum + meal.points, 0);
  return Number.isSafeInteger(total);
}

export function readState(storage: Pick<Storage, 'getItem'>): { state: AppState; error: string | null; raw: string | null } {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: emptyState(),
      error: 'This browser is blocking saved data. Allow browser storage to save your meal plan.',
      raw: null,
    };
  }
  if (raw === null) return { state: emptyState(), error: null, raw: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (isAppState(value)) return { state: value, error: null, raw };
  } catch {
    // Keep the original bytes available for explicit recovery; never overwrite
    // a malformed value merely because the app was opened.
  }
  return {
    state: emptyState(),
    error: 'Your saved data could not be read. It has not been overwritten. Download a recovery copy before starting fresh.',
    raw,
  };
}

export function writeState(storage: Pick<Storage, 'setItem'>, state: AppState): { error: string | null } {
  if (!isAppState(state)) {
    return { error: 'This change contains invalid data and was not saved.' };
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { error: null };
  } catch {
    return { error: 'Your changes could not be saved. Browser storage may be full or blocked. Free space or allow storage, then try again.' };
  }
}
