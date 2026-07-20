import { test, expect } from '@playwright/test';
import { resetDemo } from './helpers';

async function exerciseCount(page: import('@playwright/test').Page): Promise<number> {
  const text = await page.getByText(/^\d+ exercises?$/).innerText();
  return parseInt(text, 10);
}

test.describe('exercises', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page);
  });

  test('catalog lists exercises and a category filter narrows the list', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page.getByRole('heading', { name: 'Exercises' })).toBeVisible();

    const total = await exerciseCount(page);
    expect(total).toBeGreaterThan(1);

    // At least one catalog row links to a detail page (scope to main; the nav also links here).
    await expect(page.locator('main a[href^="/exercises/"]').first()).toBeVisible();

    // Apply a category filter; the count must not exceed the unfiltered total,
    // and the filtered set is smaller (fixture catalog spans multiple categories).
    // "Legs" is unique to the category facet row (avoids the Chest/Glutes muscle-facet clash).
    await page.getByRole('button', { name: 'Legs', exact: true }).click();
    const filtered = await exerciseCount(page);
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
  });

  test('detail page shows the exercise, muscles, and substitution suggestions', async ({
    page,
  }) => {
    await page.goto('/exercises');
    const firstRow = page.locator('main a[href^="/exercises/"]').first();
    const name = (await firstRow.locator('p.font-semibold').first().innerText()).trim();
    await firstRow.click();

    await page.waitForURL(/\/exercises\/[^/]+\/?$/);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByText('Muscles worked')).toBeVisible();
    await expect(page.getByText('Equipment', { exact: true })).toBeVisible();

    // Substitutes section with at least one real suggestion.
    await expect(page.getByText('Swap / similar exercises')).toBeVisible();
    const subsCard = page.locator('div.rounded-card', { hasText: 'Swap / similar' }).first();
    await expect(subsCard.locator('a[href^="/exercises/"]').first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/exercise-detail.png', fullPage: true });

    // "See all" opens the full swap sheet (titled "Swap <exercise>").
    await page.getByRole('button', { name: 'See all' }).click();
    await expect(page.getByText(`Swap ${name}`)).toBeVisible();
  });
});
