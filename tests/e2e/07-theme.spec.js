// tests/e2e/07-theme.spec.js
// Test Suite 07: Tema — dark/light toggle e persistenza

import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);
  });

  test('theme button is visible', async ({ page }) => {
    const themeBtn = page.locator('#theme-btn');
    await expect(themeBtn).toBeVisible();
  });

  test('clicking theme button toggles light-theme class on body', async ({ page }) => {
    const initialHasDark = await page.evaluate(() => !document.body.classList.contains('light-theme'));

    await page.locator('#theme-btn').click();
    await page.waitForTimeout(300);

    const afterToggle = await page.evaluate(() => !document.body.classList.contains('light-theme'));
    expect(afterToggle).toBe(!initialHasDark);
  });

  test('theme state is updated in BM_v2', async ({ page }) => {
    const initialDark = await page.evaluate(() => window.BM_v2.state.isDarkMode);

    await page.locator('#theme-btn').click();
    await page.waitForTimeout(300);

    const afterDark = await page.evaluate(() => window.BM_v2.state.isDarkMode);
    expect(afterDark).toBe(!initialDark);
  });

  test('theme preference is stored in localStorage', async ({ page }) => {
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => localStorage.getItem('bm-theme'));
    expect(['dark', 'light']).toContain(stored);
  });

  test('toggling twice returns to original theme', async ({ page }) => {
    const initial = await page.evaluate(() => window.BM_v2.state.isDarkMode);

    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);

    const final = await page.evaluate(() => window.BM_v2.state.isDarkMode);
    expect(final).toBe(initial);
  });

});
