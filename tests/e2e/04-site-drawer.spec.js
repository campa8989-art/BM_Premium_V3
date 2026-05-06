// tests/e2e/04-site-drawer.spec.js
// Test Suite 04: Site Detail Drawer — apertura, contenuto, chiusura

import { test, expect } from '@playwright/test';

test.describe('Site Detail Drawer', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined' && window.BM_v2.state?.sites?.length > 0, { timeout: 15000 });
    // Allow auto-switch to home to finish
    await page.waitForTimeout(500);
    // Navigate to dashboard where site list is visible
    await page.locator('.nav-item[data-view="dashboard"]').click();
    await page.waitForSelector('#presidi-list .site-item', { timeout: 15000 });
  });

  test('clicking a site item opens the drawer', async ({ page }) => {
    const firstSite = page.locator('#presidi-list .site-item').first();
    await firstSite.click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });
  });

  test('drawer shows site name and tasks', async ({ page }) => {
    await page.locator('#presidi-list .site-item').first().click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });

    // Should contain a title and table rows
    const drawerTitle = drawer.locator('.drawer-title');
    await expect(drawerTitle).toBeVisible();

    const taskRows = drawer.locator('.v2-row');
    const rowCount = await taskRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('drawer contains task status indicators', async ({ page }) => {
    await page.locator('#presidi-list .site-item').first().click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });

    const statusBadges = drawer.locator('.status-indicator');
    expect(await statusBadges.count()).toBeGreaterThan(0);
  });

  test('clicking backdrop closes the drawer', async ({ page }) => {
    await page.locator('#presidi-list .site-item').first().click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });

    const backdrop = page.locator('#drawer-backdrop');
    await backdrop.click({ force: true });
    await page.waitForTimeout(400);

    await expect(drawer).not.toHaveClass(/open/);
  });

  test('close button in drawer closes it', async ({ page }) => {
    await page.locator('#presidi-list .site-item').first().click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });

    const closeBtn = drawer.locator('.close-drawer');
    if (await closeBtn.count() > 0) {
      await closeBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await expect(drawer).not.toHaveClass(/open/);
    }
  });

  test('ARIA info button is present in task rows', async ({ page }) => {
    await page.locator('#presidi-list .site-item').first().click();

    const drawer = page.locator('#profile-drawer');
    await expect(drawer).toHaveClass(/open/, { timeout: 5000 });

    const infoButtons = drawer.locator('.v2-info-btn');
    expect(await infoButtons.count()).toBeGreaterThan(0);
  });

});
