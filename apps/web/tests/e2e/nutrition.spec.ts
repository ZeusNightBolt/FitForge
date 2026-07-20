import { test, expect } from '@playwright/test';
import { completeOnboarding, resetDemo, readDemoState } from './helpers';

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
});
