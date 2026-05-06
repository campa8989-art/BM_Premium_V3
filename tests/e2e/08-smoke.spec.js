// tests/e2e/08-smoke.spec.js
// Test Suite 08: Smoke Tests — verifica rapida di tutti i moduli senza crash

import { test, expect } from '@playwright/test';

const ALL_VIEWS = ['home', 'dashboard', 'workspace', 'map', 'charts', 'calendar', 'reports'];

test.describe('Smoke Tests — Zero Crash Guarantee', () => {

  test('visiting all views produces zero JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push({ view: 'loading', msg: err.message }));

    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);

    for (const view of ALL_VIEWS) {
      const navBtn = page.locator(`.nav-item[data-view="${view}"]`);
      if (await navBtn.count() > 0) {
        await navBtn.click();
        await page.waitForTimeout(500);
      }
    }

    const realErrors = errors.filter(e =>
      !e.msg.includes('favicon') &&
      !e.msg.includes('net::ERR_') &&
      !e.msg.includes('CORS') &&
      !e.msg.includes('404')
    );

    if (realErrors.length > 0) {
      console.log('🔴 JS Errors detected:');
      realErrors.forEach(e => console.log(`  [${e.view}] ${e.msg}`));
    }

    expect(realErrors, `Found ${realErrors.length} JS errors`).toHaveLength(0);
  });

  test('all nav items exist in DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });
    await page.waitForTimeout(500);

    for (const view of ALL_VIEWS) {
      const navBtn = page.locator(`.nav-item[data-view="${view}"]`);
      expect(await navBtn.count(), `Missing nav item for view: ${view}`).toBeGreaterThan(0);
    }
  });

  test('critical DOM elements are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });
    await page.waitForTimeout(500);

    const criticalElements = [
      '#sidebar',
      '#presidi-list',
      '#site-search',
      '#profile-drawer',
      '#drawer-backdrop',
      '#theme-btn',
      '#view-title',
    ];

    for (const selector of criticalElements) {
      const el = page.locator(selector);
      expect(await el.count(), `Missing element: ${selector}`).toBeGreaterThan(0);
    }
  });

  test('data.js loaded and maintenanceData is available', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof maintenanceData !== 'undefined', { timeout: 15000 });
    await page.waitForTimeout(500);

    const dataCount = await page.evaluate(() => typeof maintenanceData !== 'undefined' ? maintenanceData.length : 0);
    expect(dataCount).toBeGreaterThan(100); // Should have substantial data
  });

  test('page loads in under 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    const elapsed = Date.now() - start;

    console.log(`⏱ App load time: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(10000);
  });

});
