import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emptyState, parsePoints, formatPoints, isValidDate, todayISO, summarize, mealsToCsv,
} from '../src/lib/model.ts';
import type { Meal, Plan } from '../src/lib/model.ts';

const plan: Plan = { name: 'Fall plan', startingBalance: 10000, endDate: '2026-11-01' };
const meal = (overrides: Partial<Meal> = {}): Meal => ({
  id: 'meal-1', location: 'Campus café', points: 1250, category: 'Lunch',
  date: '2026-10-26', createdAt: '2026-10-26T16:00:00.000Z', ...overrides,
});

test('decimal input and deletion retain hundredth-point accuracy', () => {
  const breakfast = meal({ id: 'a', points: parsePoints('0.10') });
  const lunch = meal({ id: 'b', points: parsePoints('0.20') });
  assert.equal(summarize(plan, [breakfast, lunch], '2026-10-26').remaining, 9970);
  assert.equal(summarize(plan, [lunch], '2026-10-26').remaining, 9980);
  assert.equal(formatPoints(-30), '-0.30');
  assert.equal(formatPoints(123456), '1,234.56');
});

test('positive point amounts accept up to two fractional digits and the maximum', () => {
  assert.equal(parsePoints('12'), 1200);
  assert.equal(parsePoints('12.5'), 1250);
  assert.equal(parsePoints(' 12.50 '), 1250);
  assert.equal(parsePoints('0.01'), 1);
  assert.equal(parsePoints('999999.99'), 99999999);
});

test('invalid point values cannot introduce zero, negative, unsafe or imprecise amounts', () => {
  for (const value of ['', ' ', '0', '0.00', '-1', 'NaN', 'Infinity', '1e3', '1.001', '1,000', '+2', '1000000', '99999999999999999999']) {
    assert.throws(() => parsePoints(value), Error, `Expected rejection: ${JSON.stringify(value)}`);
  }
});

test('calendar dates reject normalized impossible dates and accept leap days', () => {
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2026-10-26'), true);
  for (const value of ['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '2026-1-01', '2026-01-01Z', 'not-a-date', '0000-01-01']) {
    assert.equal(isValidDate(value), false, value);
  }
});

test('todayISO represents the local calendar date rather than UTC rollover', () => {
  assert.equal(todayISO(new Date(2026, 9, 26, 23, 59)), '2026-10-26');
});

test('an empty state contains no fabricated plan or spending and is independently mutable', () => {
  const first = emptyState();
  assert.deepEqual(first, { version: 1, plan: null, meals: [] });
  first.meals.push(meal());
  assert.deepEqual(emptyState().meals, []);
  assert.deepEqual(summarize(null, [], '2026-10-26'), {
    spent: 0, remaining: 0, daysRemaining: 0, dailyAllowance: 0, spentToday: 0,
  });
});

test('a plan ending today has one spending day, while an expired plan has none', () => {
  assert.deepEqual(summarize({ ...plan, endDate: '2026-10-26' }, [meal()], '2026-10-26'), {
    spent: 1250, remaining: 8750, daysRemaining: 1, dailyAllowance: 8750, spentToday: 1250,
  });
  const expired = summarize({ ...plan, endDate: '2026-10-25' }, [meal()], '2026-10-26');
  assert.equal(expired.daysRemaining, 0);
  assert.equal(expired.dailyAllowance, 0);
  assert.equal(expired.remaining, 8750);
});

test('remaining days count calendar dates across both daylight saving transitions', () => {
  assert.equal(summarize({ ...plan, endDate: '2026-03-09' }, [], '2026-03-07').daysRemaining, 3);
  assert.equal(summarize({ ...plan, endDate: '2026-11-02' }, [], '2026-10-31').daysRemaining, 3);
});

test('daily allowance rounds down and counts all meals while isolating today spending', () => {
  const summary = summarize({ ...plan, startingBalance: 100, endDate: '2026-10-28' }, [
    meal({ points: 10, date: '2026-10-25' }), meal({ id: 'b', points: 20 }),
  ], '2026-10-26');
  assert.deepEqual(summary, { spent: 30, remaining: 70, daysRemaining: 3, dailyAllowance: 23, spentToday: 20 });
});

test('overspending stays negative and does not yield a positive daily allowance', () => {
  const summary = summarize({ ...plan, startingBalance: 1000 }, [meal()], '2026-10-26');
  assert.equal(summary.remaining, -250);
  assert.equal(summary.dailyAllowance, 0);
});

test('CSV preserves commas, quotes and line breaks and exports decimal amounts', () => {
  const csv = mealsToCsv([meal({ location: 'Café, "North"\nHall' })]);
  assert.equal(csv, 'Date,Location,Meal,Points\r\n"2026-10-26","Café, ""North""\nHall","Lunch","12.50"\r\n');
});

test('CSV neutralizes spreadsheet formulas even behind whitespace', () => {
  for (const location of ['=2+2', '+SUM(1,2)', '-2+3', '@SUM(A1)', ' \t=1+1', '\n=1']) {
    const csv = mealsToCsv([meal({ location })]);
    assert.ok(csv.includes(`"'${location.replaceAll('"', '""')}"`), JSON.stringify(location));
  }
});

test('CSV uses newest meal date then creation time without mutating the input', () => {
  const items = [
    meal({ id: 'older', location: 'Older', date: '2026-10-25' }),
    meal({ id: 'early', location: 'Earlier', createdAt: '2026-10-26T12:00:00.000Z' }),
    meal({ id: 'late', location: 'Later', createdAt: '2026-10-26T18:00:00.000Z' }),
  ];
  const csv = mealsToCsv(items);
  assert.ok(csv.indexOf('Later') < csv.indexOf('Earlier'));
  assert.ok(csv.indexOf('Earlier') < csv.indexOf('Older'));
  assert.equal(items[0].id, 'older');
  assert.equal(mealsToCsv([]), 'Date,Location,Meal,Points\r\n');
});
