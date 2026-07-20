import { test, expect } from '@playwright/test';
import { resetDemo } from './helpers';

test.describe('landing', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page);
  });

  test('renders hero, value props, and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /pocket personal trainer/i }),
    ).toBeVisible();
    await expect(page.getByText(/Calorie & macro targets/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I have an account' })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/landing.png', fullPage: true });
  });

  test('"Get started" navigates into onboarding', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.waitForURL(/\/onboarding\/welcome/);
    await expect(page.getByRole('heading', { name: /built around your life/i })).toBeVisible();
  });

  test('"I have an account" navigates to the login entry', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'I have an account' }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByTestId('enter-demo')).toBeVisible();
  });
});
