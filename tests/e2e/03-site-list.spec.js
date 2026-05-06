// tests/e2e/03-site-list.spec.js
// Test Suite 03: Site List (Presidi) — rendering e filtro ricerca

import { test, expect } from '@playwright/test';

test.describe('Site List (Presidi)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);
    // Navigate to dashboard where site list is visible
    await page.locator('.nav-item[data-view="dashboard"]').click();
    await page.waitForSelector('#presidi-list .site-item', { timeout: 15000 });
  });

  test('renders multiple site items', async ({ page }) => {
    const items = page.locator('#presidi-list .site-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(5); // Should have meaningful number of sites
  });

  test('each site item shows name and ID', async ({ page }) => {
    const firstItem = page.locator('#presidi-list .site-item').first();
    const idEl = firstItem.locator('.site-id');
    const nameEl = firstItem.locator('.site-name');

    await expect(idEl).toBeVisible();
    await expect(nameEl).toBeVisible();

    const id = await idEl.textContent();
    const name = await nameEl.textContent();

    expect(id?.trim().length).toBeGreaterThan(0);
    expect(name?.trim().length).toBeGreaterThan(0);
  });

  test('search/filter reduces visible items', async ({ page }) => {
    const allItems = await page.locator('#presidi-list .site-item').count();

    // Type a very specific query that should match fewer sites
    await page.fill('#site-search', 'zxzxzxzxzx_nomatch_zxzx');
    await page.waitForTimeout(200);

    const visibleItems = await page.locator('#presidi-list .site-item:visible').count();
    expect(visibleItems).toBeLessThan(allItems);
  });

  test('clearing search restores all items', async ({ page }) => {
    const allItems = await page.locator('#presidi-list .site-item').count();

    await page.fill('#site-search', 'some text');
    await page.waitForTimeout(200);

    await page.fill('#site-search', '');
    await page.waitForTimeout(200);

    const visibleItems = await page.locator('#presidi-list .site-item:visible').count();
    expect(visibleItems).toBe(allItems);
  });

  test('global stats are displayed', async ({ page }) => {
    const totalEl = page.locator('#stat-total');
    const complianceEl = page.locator('#stat-compliance');

    if (await totalEl.count() > 0) {
      const total = await totalEl.textContent();
      expect(parseInt(total)).toBeGreaterThan(0);
    }

    if (await complianceEl.count() > 0) {
      const compliance = await complianceEl.textContent();
      expect(compliance?.trim().length).toBeGreaterThan(0);
    }
  });

});
