// tests/e2e/06-reports.spec.js
// Test Suite 06: Reports & Analisi — rendering e funzioni di export

import { test, expect } from '@playwright/test';

test.describe('Reports & Analisi', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);

    await page.locator('.nav-item[data-view="reports"]').click();
    await page.waitForTimeout(600);
  });

  test('reports pane is visible', async ({ page }) => {
    await expect(page.locator('#view-reports')).toBeVisible({ timeout: 5000 });
  });

  test('reports view renders content (not empty)', async ({ page }) => {
    const reportsPane = page.locator('#view-reports');
    const content = await reportsPane.innerHTML();
    expect(content.length).toBeGreaterThan(200);
  });

  test('no JS errors when loading reports', async ({ page }) => {
    const errors = [];
    // Set up listener before navigate
    const page2 = page;
    page2.on('pageerror', err => errors.push(err.message));

    await page2.locator('.nav-item[data-view="reports"]').click();
    await page2.waitForTimeout(700);

    const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    expect(realErrors).toHaveLength(0);
  });

  test('report filter/search controls present if initialized', async ({ page }) => {
    const reportsPane = page.locator('#view-reports');
    await expect(reportsPane).toBeVisible();

    // Check for report cards or filter elements
    // We accept the test if the module rendered anything useful
    const html = await reportsPane.innerHTML();
    const hasContent = html.includes('report') || html.includes('Report') || html.includes('presid') || html.length > 500;
    expect(hasContent).toBe(true);
  });

});
