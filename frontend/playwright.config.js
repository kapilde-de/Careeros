// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  // Reporters: HTML always, plus GitHub-friendly list on CI
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'https://frontend-pink-one-13.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Global timeout — pipeline takes ~25s so tests can take up to 90s
  timeout: 90000,
  expect: { timeout: 15000 },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Only run extra browsers on CI
    ...(process.env.CI ? [
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ] : []),
  ],
});
