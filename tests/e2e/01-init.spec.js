// tests/e2e/01-init.spec.js
// Test Suite 01: Application Initialization
// Verifica che l'app si carichi correttamente e BM_v2 sia inizializzato

import { test, expect } from '@playwright/test';

test.describe('App Initialization', () => {

  test('should load without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    // Wait for BM_v2 to initialize (it logs "✅ Events Bound")
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });

    // Filter out known benign warnings
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('net::ERR_')
    );
    expect(realErrors, `JS errors: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('BM_v2 global object should be initialized', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });

    const state = await page.evaluate(() => ({
      hasSites: Array.isArray(window.BM_v2.state?.sites) && window.BM_v2.state.sites.length > 0,
      currentView: window.BM_v2.state?.currentView,
      isLocal: window.BM_v2.state?.isLocal,
    }));

    expect(state.hasSites).toBe(true);
    expect(state.currentView).toBeTruthy();
    expect(state.isLocal).toBe(true);
  });

  test('page title should be present', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/); // Any non-empty title
  });

  test('sidebar should be visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  test('site list should render at least one site', async ({ page }) => {
    await page.goto('/');
    // Switch to dashboard view where the site list is visible
    await page.waitForSelector('.nav-item[data-view="dashboard"]', { timeout: 10000 });
    await page.locator('.nav-item[data-view="dashboard"]').click();
    
    await page.waitForSelector('#presidi-list-v3 .site-item-v3', { timeout: 15000 });
    const count = await page.locator('#presidi-list-v3 .site-item-v3').count();
    expect(count).toBeGreaterThan(0);
  });

});
