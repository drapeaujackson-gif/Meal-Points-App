export const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
export type MealCategory = (typeof MEAL_CATEGORIES)[number];

/** Point amounts are stored as integer hundredths, never floating-point decimals. */
export interface Plan {
  name: string;
  startingBalance: number;
  endDate: string;
}

export interface Meal {
  id: string;
  location: string;
  points: number;
  category: MealCategory;
  date: string;
  createdAt: string;
}

export interface AppState {
  version: 1;
  plan: Plan | null;
  meals: Meal[];
}

export interface Summary {
  spent: number;
  remaining: number;
  daysRemaining: number;
  dailyAllowance: number;
  spentToday: number;
}

export function emptyState(): AppState {
  return { version: 1, plan: null, meals: [] };
}

export function parsePoints(input: string): number {
  const value = input.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new Error('Enter a positive points amount with no more than two decimal places.');
  }
  const [whole, fraction = ''] = value.split('.');
  const hundredths = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(hundredths) || hundredths <= 0 || hundredths > 99999999) {
    throw new Error('Enter points between 0.01 and 999,999.99.');
  }
  return hundredths;
}

const pointsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPoints(points: number): string {
  return pointsFormatter.format(points / 100);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000-')) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function todayISO(date: Date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function summarize(plan: Plan | null, meals: Meal[], today = todayISO()): Summary {
  let spent = 0;
  let spentToday = 0;
  for (const meal of meals) {
    spent += meal.points;
    if (meal.date === today) spentToday += meal.points;
  }
  const remaining = (plan?.startingBalance ?? 0) - spent;
  // UTC midnights represent calendar dates; local daylight-saving changes cannot
  // shorten or lengthen one of these day intervals.
  const daysRemaining = plan && isValidDate(plan.endDate) && isValidDate(today)
    ? Math.max(0, Math.round((Date.parse(`${plan.endDate}T00:00:00.000Z`) - Date.parse(`${today}T00:00:00.000Z`)) / 86400000) + 1)
    : 0;
  return {
    spent,
    remaining,
    daysRemaining,
    dailyAllowance: daysRemaining > 0 && remaining > 0 ? Math.floor(remaining / daysRemaining) : 0,
    spentToday,
  };
}

function csvCell(value: string): string {
  // A quoted CSV field can still become a formula in spreadsheet software.
  const safeValue = /^[\s\uFEFF]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function mealsToCsv(meals: Meal[]): string {
  const sorted = [...meals].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const rows = sorted.map((meal) => [
    meal.date, meal.location, meal.category, (meal.points / 100).toFixed(2),
  ].map(csvCell).join(','));
  return ['Date,Location,Meal,Points', ...rows].join('\r\n') + '\r\n';
}
