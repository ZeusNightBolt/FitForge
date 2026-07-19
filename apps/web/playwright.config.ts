import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the onboarding smoke test. Uses an iPhone-sized viewport (mobile-first,
 * §1.3). The web server is started by Playwright; the test mocks all Supabase traffic via
 * `page.route`, so no live backend / env is required.
 *
 * NOTE (WS-4 handoff): this suite is UNRUN in the build sandbox — it needs `@fitforge/shared`
 * built, `next` + browsers installed, and `npx playwright install`. Left in place for CI/WS-7.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['iPhone 13'],
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
