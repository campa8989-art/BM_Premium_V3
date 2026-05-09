// tests/e2e/05-matrix.spec.js
// Test Suite 05: Pianificazione Matrix — rendering timeline e navigazione

import { test, expect } from '@playwright/test';

test.describe('Pianificazione Matrix (Calendar)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);

    // Navigate to calendar view
    await page.locator('.nav-item[data-view="calendar"]').click();
    await page.waitForTimeout(500);
  });

  test('calendar pane becomes active', async ({ page }) => {
    const pane = page.locator('#view-calendar');
    await expect(pane).toBeVisible({ timeout: 5000 });
  });

  test('matrix timeline container renders', async ({ page }) => {
    // Look for the matrix container (rendered by matrix_module.js)
    const matrixContainer = page.locator('#view-calendar');
    await expect(matrixContainer).toBeVisible();

    // Check that some content is rendered inside
    const content = await matrixContainer.innerHTML();
    expect(content.length).toBeGreaterThan(100);
  });

  test('week/month toggle buttons exist', async ({ page }) => {
    const toggleBtns = page.locator('.matrix-view-toggle button');
    const count = await toggleBtns.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('prev/next navigation buttons are present', async ({ page }) => {
    const navBtns = page.locator('.matrix-timeline-nav button');
    const count = await navBtns.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('clicking next navigation button does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const nextBtn = page.locator('.matrix-timeline-nav button').last();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }

    const realErrors = errors.filter(e => !e.includes('favicon'));
    expect(realErrors).toHaveLength(0);
  });

  test('site filter sidebar renders and expands', async ({ page }) => {
    // Matrix has site filter sidebar with collapsed dropdowns
    const dropdownHeader = page.locator('#matrix-site-dropdown-header');
    await expect(dropdownHeader).toBeVisible();
    
    // Click header to reveal the site search input
    await dropdownHeader.click();
    
    const matrixSearch = page.locator('#matrix-site-search');
    await expect(matrixSearch).toBeVisible();
  });

});
