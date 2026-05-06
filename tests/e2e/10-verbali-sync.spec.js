// tests/e2e/10-verbali-sync.spec.js
import { test, expect } from '@playwright/test';

test.describe('Verbali Sync Module — Automated PDF Processing', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('bm_verbali_processed'));
    await page.reload();
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test('Verbali sync button and badge are present', async ({ page }) => {
    const syncBtn = page.locator('#btn-verbali-sync');
    await expect(syncBtn).toBeVisible();
    
    // Initially badge should be hidden if no new files
    const badge = page.locator('#verbali-badge');
    await expect(badge).not.toBeVisible();
  });

  test('Syncing verbali shows notifications and updates UI', async ({ page }) => {
    // Mock the verbali list API
    await page.route('**/api/verbali', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            { name: 'Verbale_Test_1.pdf', relativePath: '2026/Verbale_Test_1.pdf', folder: '2026' }
          ],
          count: 1
        })
      });
    });

    // Mock the file read API
    await page.route('**/api/verbali/read/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: 'JVBERi0xLjQKJ...fake_base64...',
          name: 'Verbale_Test_1.pdf'
        })
      });
    });

    // Mock Gemini API call (the module calls Gemini directly from frontend if window.GEMINI_API_KEY is set)
    // Wait, the module uses window.GEMINI_API_KEY.
    await page.evaluate(() => {
        window.GEMINI_API_KEY = 'dummy-key';
    });

    await page.route('**/api/proxy-ai', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                candidates: [{
                    content: {
                        parts: [{ 
                            text: '{"data_intervento": "2026-05-01", "nome_presidio": "Sacco", "tipologia_impianto": "Antincendio", "note_tecniche": "Test Sync", "stato": "OK"}' 
                        }]
                    }
                }]
            })
        });
    });

    const syncBtn = page.locator('#btn-verbali-sync');
    await syncBtn.click();

    // Verify processing notification
    const toast = page.locator('.toast');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('Trovati 1 nuovi verbali');

    // Wait for processing (it has a 5s timeout between files in the code)
    await page.waitForTimeout(7000); 

    // Verify success notification
    await expect(toast.first()).toContainText('Processati 1 verbali');

    // Verify badge is updated (should be 0 or hidden now as it's processed)
    const badge = page.locator('#verbali-badge');
    await expect(badge).not.toBeVisible();

    // Verify localStorage
    const processed = await page.evaluate(() => localStorage.getItem('bm_verbali_processed'));
    expect(processed).toContain('Verbale_Test_1.pdf');
  });

});
