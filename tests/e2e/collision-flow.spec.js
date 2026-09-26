import { test, expect } from '@playwright/test';

test.describe('Combinatorial Synergy Collision Flow E2E', () => {

  test('Should execute Active Collision and render insight cards without parse error', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    // 1. Navigate to the app
    await page.goto('/');

    // 2. Set up local model pivotpulse in localStorage
    await page.evaluate(() => {
      localStorage.setItem('spark_model_val', 'ollama:pivotpulse');
      localStorage.setItem('spark_cfg_val', 'demo-key-active'); // bypass key overlay
    });
    await page.reload();

    // 3. Close settings overlay if visible
    const closeBtn = page.locator('button[aria-label="Close settings"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    // 4. Select the 3 strategies: The Butterfly Effect, Combinatorial Evolution, Intergenerational Kinship
    // First, clear any pre-selected strategies if any
    const problemInput = page.locator('#problem-input');
    await expect(problemInput).toBeVisible({ timeout: 10000 });

    // Select Butterfly
    const butterflyBtn = page.locator('button.strategy-button:has-text("Butterfly Effect")');
    if (await butterflyBtn.isVisible()) {
      const isPressed = await butterflyBtn.getAttribute('aria-pressed');
      if (isPressed !== 'true') await butterflyBtn.click();
    }

    // Select Combinatorial Evolution
    const combBtn = page.locator('button.strategy-button:has-text("Combinatorial Evolution")');
    if (await combBtn.isVisible()) {
      const isPressed = await combBtn.getAttribute('aria-pressed');
      if (isPressed !== 'true') await combBtn.click();
    }

    // Select Intergenerational Kinship (under Grounding / Kinship Anchors)
    const kinshipBtn = page.locator('button.strategy-button:has-text("Intergenerational Kinship")');
    if (await kinshipBtn.isVisible()) {
      const isPressed = await kinshipBtn.getAttribute('aria-pressed');
      if (isPressed !== 'true') await kinshipBtn.click();
    }

    // 5. Verify the Active Collision banner displays the combined label
    const collisionBanner = page.locator('text=Active Collision:');
    await expect(collisionBanner).toBeVisible({ timeout: 5000 });

    // 6. Enter test challenge into problem input
    await problemInput.click();
    await problemInput.fill('Helping grandma maintain independence and emotional vitality at home while ensuring caregiver respite.');

    // 7. Click Generate
    const generateBtn = page.locator('button.generate-button');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click({ force: true });

    // 8. Wait for results region to appear and cards to render
    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 35000 });

    // 9. Verify strategy cards are actually displayed with insight texts
    const insightCards = page.locator('article.insight-card, div.insight-card, [data-testid="insight-card"], h3.font-serif');
    await expect(insightCards.first()).toBeVisible({ timeout: 15000 });

    // 10. Verify no "Final parse failed" or ".map is not a function" error was logged
    const parseErrors = consoleErrors.filter(e => e.includes('Final parse failed') || e.includes('.map is not a function'));
    expect(parseErrors).toEqual([]);
  });

});
