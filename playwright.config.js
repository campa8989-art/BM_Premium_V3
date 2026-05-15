// playwright.config.js
// Building Manager V3 — Automated QA Configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 2,
  workers: 1, // Sequential: app has shared state
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Give the SPA time to boot (data.js is large)
    navigationTimeout: 30_000,
    actionTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // DO NOT start a webServer — the dev server is already running via run.ps1
});
