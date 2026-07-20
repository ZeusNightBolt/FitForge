import { test, expect } from '@playwright/test';
import { resetDemo } from './helpers';

test.describe('progress', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page);
  });

  test('renders with weight chart and switchable tabs', async ({ page }) => {
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();

    // Tabs are present.
    for (const label of ['Weight', 'Measurements', 'PRs', 'Photos']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    // Switching to the PRs tab renders without error.
    await page.getByRole('button', { name: 'PRs', exact: true }).click();
    await expect(page.getByRole('button', { name: 'PRs', exact: true })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/progress.png', fullPage: true });
  });
});
