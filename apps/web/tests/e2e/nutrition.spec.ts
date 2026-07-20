import { test, expect } from '@playwright/test';
import { completeOnboarding, resetDemo, readDemoState, DEMO_STORAGE_KEY } from './helpers';

const yesterdayISO = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

test.describe('nutrition', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page);
  });

  test('food search returns results and logging a food updates + persists the day totals', async ({
    page,
  }) => {
    await completeOnboarding(page);
    await page.goto('/nutrition');

    await expect(page.getByRole('heading', { name: 'Nutrition' })).toBeVisible();

    // Fresh day shows the guided empty state; use its primary CTA to open the food search.
    await page.getByRole('button', { name: /Search & add food/i }).click();

    const search = page.getByRole('combobox', { name: 'Search foods' });
    await expect(search).toBeVisible();
    await search.fill('Chicken');

    // Type-ahead returns matching results.
    const option = page.getByRole('option', { name: /Chicken/i }).first();
    await expect(option).toBeVisible();
    await option.click();

    // Serving picker → confirm log.
    const logBtn = page.getByRole('button', { name: /Log \d+ kcal/ });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // The logged food now appears in the day view.
    await expect(page.getByText(/Chicken/i).first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nutrition.png', fullPage: true });

    // Persisted to the store under today's date.
    const state = await readDemoState(page);
    const logsByDate = (state as { logsByDate: Record<string, unknown[]> }).logsByDate;
    const today = new Date().toISOString().slice(0, 10);
    expect(logsByDate[today], 'today has persisted food logs').toBeTruthy();
    expect(logsByDate[today].length).toBeGreaterThan(0);

    // Reload and confirm the entry survives.
    await page.reload();
    await expect(page.getByText(/Chicken/i).first()).toBeVisible();
  });

  test('copy-yesterday re-logs the previous day’s meals into today and persists', async ({
    page,
  }) => {
    await completeOnboarding(page);

    // Seed a food log under yesterday's date directly in the store, then reload the day view.
    const y = yesterdayISO();
    await page.evaluate(
      ({ key, date }) => {
        const raw = window.localStorage.getItem(key);
        const state = raw ? JSON.parse(raw) : {};
        state.logsByDate = state.logsByDate ?? {};
        state.logsByDate[date] = [
          {
            id: 'nl-yesterday-1',
            logged_on: date,
            meal_slot: 'lunch',
            food_id: 'f-salmon',
            custom_name: 'Atlantic Salmon, cooked',
            quantity_g: 150,
            kcal: 312,
            protein_g: 30,
            carbs_g: 0,
            fat_g: 19.5,
          },
        ];
        window.localStorage.setItem(key, JSON.stringify(state));
      },
      { key: DEMO_STORAGE_KEY, date: y },
    );

    await page.goto('/nutrition');

    // The copy-yesterday affordance appears because yesterday has logs.
    const copyBtn = page.getByTestId('copy-yesterday');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Yesterday's meal now shows in today's day view.
    await expect(page.getByText('Atlantic Salmon, cooked').first()).toBeVisible();

    // Persisted under today's date.
    const state = await readDemoState(page);
    const logsByDate = (state as { logsByDate: Record<string, unknown[]> }).logsByDate;
    const today = new Date().toISOString().slice(0, 10);
    expect(logsByDate[today]?.length ?? 0).toBeGreaterThan(0);

    // Survives reload.
    await page.reload();
    await expect(page.getByText('Atlantic Salmon, cooked').first()).toBeVisible();
  });
});
