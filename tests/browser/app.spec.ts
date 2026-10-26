import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T16:00:00Z') });
  await page.goto('/');
});

test('plan, meals, reload, filters, export and delete/undo retain the exact balance', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page).toHaveTitle(/Meal Points/);
  await expect(page.getByRole('heading', { name: 'Good meals. Great balance.' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Plan name').fill('Fall semester');
  await dialog.getByLabel('Starting points').fill('1000');
  await dialog.getByLabel('Plan end date').fill('2026-11-04');
  await dialog.getByRole('button', { name: 'Save plan' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('remaining')).toHaveText('1,000.00');
  await expect(page.getByTestId('daily-allowance')).toHaveText('100.00');
  await page.getByLabel('Where did you eat?').fill('Campus café');
  await page.getByLabel('Points spent').fill('12.50');
  await page.getByRole('button', { name: 'Add meal', exact: true }).click();
  await expect(page.getByTestId('remaining')).toHaveText('987.50');
  await expect(page.getByRole('row', { name: /Campus café/ })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('remaining')).toHaveText('987.50');
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await expect(page.getByText('No meals match this filter')).toBeVisible();
  await page.getByRole('button', { name: 'All meals', exact: true }).click();
  await page.getByRole('button', { name: 'View all', exact: true }).click();
  await page.getByLabel('Search meals').fill('missing');
  await expect(page.getByText('No meals match this filter')).toBeVisible();
  await page.getByLabel('Search meals').fill('café');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/meal-points.*\.csv/);
  await page.getByRole('button', { name: 'Delete meal at Campus café' }).click();
  await expect(page.getByTestId('remaining')).toHaveText('1,000.00');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByTestId('remaining')).toHaveText('987.50');
  await page.reload();
  await expect(page.getByTestId('remaining')).toHaveText('987.50');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('invalid points cannot create a meal and overspending is visible', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await page.getByLabel('Starting points').fill('10');
  await page.getByLabel('Plan end date').fill('2026-10-26');
  await page.getByRole('button', { name: 'Save plan' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Where did you eat?').fill('Dining hall');
  await expect(page.getByLabel('Where did you eat?')).toHaveValue('Dining hall');
  await page.getByLabel('Points spent').fill('0');
  await page.getByRole('button', { name: 'Add meal', exact: true }).click();
  await expect(page.getByTestId('remaining')).toHaveText('10.00');
  await expect(page.getByText('Your first meal starts here')).toBeVisible();
  await page.getByLabel('Points spent').fill('12.25');
  await page.getByRole('button', { name: 'Add meal', exact: true }).click();
  await expect(page.getByTestId('remaining')).toHaveText('-2.25');
  await expect(page.getByTestId('daily-allowance')).toHaveText('0.00');
  await expect(page.getByText(/over your starting balance/)).toBeVisible();
});

test('corrupt saved data remains recoverable without crashing or overwriting it', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('meal-points:v1', '{bad json'));
  await page.reload();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('meal-points:v1'))).toBe('{bad json');
  await expect(page.getByRole('button', { name: 'Download recovery data' })).toBeVisible();
});

test('plan dialog is keyboard dismissible and restores focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit plan', exact: true })).toBeFocused();
});

test('concurrent tabs preserve both meals and do not reset an open plan draft', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await page.getByLabel('Starting points').fill('100');
  await page.getByLabel('Plan end date').fill('2026-11-04');
  await page.getByRole('button', { name: 'Save plan' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const second = await context.newPage();
  await second.clock.install({ time: new Date('2026-10-26T16:00:00Z') });
  await second.goto('/');
  await page.getByLabel('Where did you eat?').fill('First café');
  await page.getByLabel('Points spent').fill('10');
  await second.getByLabel('Where did you eat?').fill('Second café');
  await second.getByLabel('Points spent').fill('20');
  await Promise.all([
    page.evaluate(() => document.querySelector<HTMLFormElement>('.meal-panel form')!.requestSubmit()),
    second.evaluate(() => document.querySelector<HTMLFormElement>('.meal-panel form')!.requestSubmit()),
  ]);
  await expect(page.getByTestId('remaining')).toHaveText('70.00');
  await expect(second.getByTestId('remaining')).toHaveText('70.00');
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await page.getByLabel('Plan name').fill('My unsaved plan name');
  await second.getByLabel('Where did you eat?').fill('Third café');
  await second.getByLabel('Points spent').fill('5');
  await second.getByRole('button', { name: 'Add meal', exact: true }).click();
  await expect(page.getByTestId('remaining')).toHaveText('65.00');
  await expect(page.getByLabel('Plan name')).toHaveValue('My unsaved plan name');
});

test('blocked reads cannot overwrite unseen saved meals even when writes are allowed', async ({ page }) => {
  const existing = JSON.stringify({ version: 1, plan: { name: 'Existing plan', startingBalance: 10000, endDate: '2026-11-04' }, meals: [{ id: 'old', location: 'Existing meal', points: 1000, category: 'Lunch', date: '2026-10-26', createdAt: '2026-10-26T12:00:00.000Z' }] });
  await page.evaluate(value => localStorage.setItem('meal-points:v1', value), existing);
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    (window as unknown as { originalGetItem: typeof original }).originalGetItem = original;
    Storage.prototype.getItem = function (key) { if (key === 'meal-points:v1') throw new Error('Read blocked'); return original.call(this, key); };
  });
  await page.reload();
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await page.getByLabel('Starting points').fill('500');
  await page.getByLabel('Plan end date').fill('2026-11-04');
  await page.getByRole('button', { name: 'Save plan' }).click();
  const after = await page.evaluate(() => (window as unknown as { originalGetItem: Storage['getItem'] }).originalGetItem.call(localStorage, 'meal-points:v1'));
  expect(after).toBe(existing);
  await expect(page.getByRole('dialog')).toBeVisible();
});
