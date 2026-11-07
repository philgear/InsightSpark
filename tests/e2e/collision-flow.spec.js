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

    // 2. Click Demo Mode to enter the workbench cleanly
    const demoButton = page.locator('button:has-text("Demo Mode")');
    if (await demoButton.isVisible()) {
      await demoButton.click({ force: true });
    }

    // 3. Select the 3 strategies: The Butterfly Effect, Combinatorial Evolution, Intergenerational Kinship
    const problemInput = page.locator('#problem-input');
    await expect(problemInput).toBeVisible({ timeout: 10000 });

    // Clear initial selection first so we can pick the exact 3 collision strategies
    const clearBtn = page.locator('button:has-text("Clear")');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }

    // Select Butterfly
    const butterflyBtn = page.locator('button.strategy-button:has-text("Butterfly Effect")');
    await expect(butterflyBtn).toBeVisible();
    await butterflyBtn.click();

    // Select Combinatorial Evolution
    const combBtn = page.locator('button.strategy-button:has-text("Combinatorial Evolution")');
    await expect(combBtn).toBeVisible();
    await combBtn.click();

    // Select Intergenerational Kinship (under Grounding / Kinship Anchors)
    const kinshipBtn = page.locator('button.strategy-button:has-text("Intergenerational Kinship")');
    await expect(kinshipBtn).toBeVisible();
    await kinshipBtn.click();

    // 4. Verify the Active Triad banner displays the combined label
    const collisionBanner = page.locator('text=Active Triad:');
    await expect(collisionBanner).toBeVisible({ timeout: 5000 });

    // 5. Enter test challenge into problem input
    await problemInput.click();
    await problemInput.fill('Helping grandma maintain independence and emotional vitality at home while ensuring caregiver respite.');

    // 6. Click Generate
    const generateBtn = page.locator('button.generate-button');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click({ force: true });

    // 7. Wait for results region to appear and cards to render
    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 35000 });

    // 8. Verify strategy cards are actually displayed with insight texts
    const insightCards = page.locator('.insight-card-magical, h3');
    await expect(insightCards.first()).toBeVisible({ timeout: 15000 });

    // 9. Verify no "Final parse failed" or ".map is not a function" error was logged
    const parseErrors = consoleErrors.filter(e => e.includes('Final parse failed') || e.includes('.map is not a function'));
    expect(parseErrors).toEqual([]);
  });

});
