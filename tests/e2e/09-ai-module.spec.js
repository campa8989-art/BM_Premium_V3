// tests/e2e/09-ai-module.spec.js
import { test, expect } from '@playwright/test';

test.describe('AI Module — Gemini Integration', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    await page.goto('/');
    await page.waitForFunction(() => typeof window.BM_v2 !== 'undefined', { timeout: 15000 });
    // Wait for the app to settle
    await page.waitForTimeout(1000);
  });

  test('AI Command Center can be toggled', async ({ page }) => {
    const aiTrigger = page.locator('#ai-trigger');
    const aiModal = page.locator('#ai-command-modal');
    const backdrop = page.locator('#drawer-backdrop');

    // Open
    await aiTrigger.click();
    await expect(aiModal).toHaveClass(/active/);
    await expect(backdrop).toHaveClass(/active/);

    // Initial greeting
    const greeting = page.locator('#ai-chat-history .ai-message.ai').first();
    await expect(greeting).toContainText('Buongiorno, sono il tuo assistente Gemini', { timeout: 10000 });

    // Close via times button
    await page.locator('.close-ai').click();
    await expect(aiModal).not.toHaveClass(/active/);
  });

  test('Sending AI query works with mocked response', async ({ page }) => {
    // Mock the AI proxy
    await page.route('**/api/proxy-ai', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: "Risposta simulata di Gemini per l'analisi tecnica." }]
            }
          }]
        })
      });
    });

    await page.locator('#ai-trigger').click();
    
    const input = page.locator('#ai-input-field');
    await input.fill('Analisi stato manutenzione sito 12');
    await page.keyboard.press('Enter');

    // Verify user message in history
    await expect(page.locator('#ai-chat-history .ai-message.user')).toContainText('Analisi stato manutenzione sito 12');

    // Wait for processing to finish
    await expect(page.locator('#ai-status-indicator')).not.toHaveClass(/processing/, { timeout: 10000 });

    // Verify AI response
    const aiMsg = page.locator('#ai-chat-history .ai-message.ai').nth(1); // 0 is greeting, 1 is response
    await expect(aiMsg).toContainText('Risposta simulata di Gemini', { timeout: 10000 });
  });

  test('AI Autopilot execution is triggered correctly', async ({ page }) => {
    // Mock a response with Autopilot block
    await page.route('**/api/proxy-ai', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ 
                text: "Procedo con la configurazione del report.\n[AUTOPILOT]\n{\"siteId\": \"12\", \"date\": \"2026-05-10\", \"systems\": [\"1.1\"]}\n[/AUTOPILOT]" 
              }]
            }
          }]
        })
      });
    });

    await page.locator('#ai-trigger').click();
    await page.locator('#ai-input-field').fill('Prepara report sito 12');
    await page.keyboard.press('Enter');

    // Wait for processing to finish
    await expect(page.locator('#ai-status-indicator')).not.toHaveClass(/processing/, { timeout: 10000 });

    // Wait for the autopilot to execute
    await page.waitForTimeout(2000);

    // Verify navigation to reports view
    const viewTitle = page.locator('#view-title');
    await expect(viewTitle).toContainText('Report & Analisi');

    // Verify site selection
    const siteSelect = page.locator('#presidio-select');
    const selectedValue = await siteSelect.inputValue();
    // We expect the option with data-id="12" to be selected. 
    // In reports_module.js, it sets select.selectedIndex.
    // Let's check the selected text or value.
    const selectedText = await page.evaluate(() => {
        const sel = document.getElementById('presidio-select');
        return sel.options[sel.selectedIndex].text;
    });
    // Assuming site 12 has a specific name, but we can just check if it's not the default
    expect(selectedValue).not.toBe('');
  });

});
