// tests/e2e/02-navigation.spec.js
// Test Suite 02: Navigation — verifica che tutti i nav item cambino vista correttamente

import { test, expect } from '@playwright/test';

const VIEWS = [
  { dataView: 'home',      title: 'Home Dashboard',        paneId: 'view-home' },
  { dataView: 'dashboard', title: 'Mission Control',        paneId: 'view-dashboard' },
  { dataView: 'workspace', title: 'Archivio Documentale',   paneId: 'view-workspace' },
  { dataView: 'map',       title: 'Mappa Hub',              paneId: 'view-map' },
  { dataView: 'charts',    title: 'Osservatorio Cinetico',  paneId: 'view-charts' },
  { dataView: 'calendar',  title: 'Pianificazione Matrix',  paneId: 'view-calendar' },
  { dataView: 'reports',   title: 'Report & Analisi',       paneId: 'view-reports' },
];

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to be ready
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home (300ms in app_v2.js) to finish
    await page.waitForTimeout(500);
  });

  for (const view of VIEWS) {
    test(`clicking nav "${view.dataView}" activates correct pane`, async ({ page }) => {
      const navItem = page.locator(`.nav-item[data-view="${view.dataView}"]`);
      await expect(navItem).toBeVisible();
      await navItem.click();

      // The pane should be active
      await page.waitForTimeout(400); // allow transition
      const pane = page.locator(`#${view.paneId}`);
      await expect(pane).toBeVisible();

      // Nav item should have .active class
      await expect(navItem).toHaveClass(/active/);
    });
  }

  test('view title updates on navigation', async ({ page }) => {
    await page.locator('.nav-item[data-view="dashboard"]').click();
    await page.waitForTimeout(300);
    const title = await page.locator('#view-title').textContent();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('only one pane is visible at a time', async ({ page }) => {
    await page.locator('.nav-item[data-view="charts"]').click();
    await page.waitForTimeout(400);

    const activePanes = await page.locator('.view-pane.active').count();
    expect(activePanes).toBe(1);
  });

});
