import { test, expect } from '@playwright/test';

test.describe('Pivot & Pulse Demo Mode Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (using the baseURL from config)
    await page.goto('/');
  });

  test('should unlock the app in Demo Mode, populate problem, and generate insights', async ({ page }) => {
    // 1. Verify we are on the API Key setup screen (API key input is visible)
    const apiKeyInput = page.locator('input[placeholder*="Enter Gemini API Key"]');
    await expect(apiKeyInput).toBeVisible();

    // 2. Click the "Try a Demo (No Key Required)" button
    const demoButton = page.locator('button:has-text("Try a Demo")');
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // 3. Verify that the overlay is dismissed (API key input is hidden)
    await expect(apiKeyInput).not.toBeVisible();

    // 4. Verify that the Demo Mode banner is visible
    const demoBanner = page.locator('text=You are running in Demo Mode');
    await expect(demoBanner).toBeVisible();

    // 5. Verify the problem input textarea is pre-populated
    const problemTextarea = page.locator('#problem-input');
    await expect(problemTextarea).toBeVisible();
    const problemValue = await problemTextarea.inputValue();
    expect(problemValue.length).toBeGreaterThan(10);

    // 6. Click the Generate button to load mock insights
    const generateBtn = page.locator('button.generate-button');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 7. Verify we show the results section (Demo Mode loads quickly)
    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 15000 });

    // Verify the generated insights are displayed
    const insightCard = page.locator('h3:has-text("Butterfly Effect")');
    await expect(insightCard).toBeVisible();
  });
});
