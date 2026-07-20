import { test, expect } from '@playwright/test';
import { completeOnboarding, resetDemo } from './helpers';

test.describe('today', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page);
  });

  test('shows the generated plan, macro ring targets, and a way into a workout', async ({
    page,
  }) => {
    await completeOnboarding(page);
    await page.goto('/today');

    // Header greeting + today's plan heading.
    await expect(page.getByRole('heading', { name: /plan$/i })).toBeVisible();

    // Nutrition card with a non-zero kcal target rendered in the ring caption.
    await expect(page.getByText(/of \d+ kcal/)).toBeVisible();
    const kcalLabel = await page.getByText(/of \d+ kcal/).innerText();
    const kcalTarget = parseInt(kcalLabel.replace(/\D/g, ''), 10);
    expect(kcalTarget).toBeGreaterThan(0);

    // Macro target rows are present (Protein / Carbs / Fat) with gram targets.
    await expect(page.getByText('Protein').first()).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+ g/).first()).toBeVisible();

    // A CTA into a workout exists whether today is a training or rest day.
    const startBtn = page.getByRole('button', {
      name: /Start workout|Start a freestyle workout/,
    });
    await expect(startBtn).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/today.png', fullPage: true });
  });
});
