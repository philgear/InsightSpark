import { test, expect } from '@playwright/test';

test.describe('Pivot & Pulse End-to-End Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL (configured in playwright.config.js to port 3000)
    await page.goto('/');
  });

  test('PII Privacy Shield should trigger warning on personal information', async ({ page }) => {
    // 1. Enter Demo Mode to unlock input text area
    const demoButton = page.locator('button:has-text("Try a Demo")');
    await expect(demoButton).toBeVisible();
    await demoButton.click({ force: true });

    const problemTextarea = page.locator('#problem-input');
    await expect(problemTextarea).toBeVisible();

    // 2. Clear input and type a phone number
    await problemTextarea.click({ force: true });
    await problemTextarea.fill('Reach me at 555-123-4567 or email patient@med.org.');
    
    // 3. Verify Privacy Warning banner is triggered
    const privacyWarning = page.locator('text=Privacy Warning');
    await expect(privacyWarning).toBeVisible();
    
    const warningText = page.locator('text=Under HIPAA guidelines, please de-identify your query');
    await expect(warningText).toBeVisible();
  });

  test('Demo Mode: should generate Creative Mode insights', async ({ page }) => {
    // 1. Enter Demo Mode (starts in Creative Mode by default)
    const demoButton = page.locator('button:has-text("Try a Demo")');
    await demoButton.click({ force: true });

    // 2. Verify pre-populated challenge text is present
    const problemTextarea = page.locator('#problem-input');
    await expect(problemTextarea).toHaveValue(/municipal park/, { timeout: 8000 });

    // 3. Generate insights
    const generateBtn = page.locator('button.generate-button');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click({ force: true });

    // 4. Verify results render and show creative strategies
    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 15000 });

    const creativeCard = page.locator('h3:has-text("Butterfly Effect")');
    await expect(creativeCard).toBeVisible();
  });

  test('Demo Mode: should switch to Care Mode, save insights, and synthesize care plans', async ({ page }) => {
    // 1. Enter Demo Mode (starts in Creative Mode)
    const demoButton = page.locator('button:has-text("Try a Demo")');
    await expect(demoButton).toBeVisible();
    await demoButton.click({ force: true });

    // 2. Switch mode to Care Mode in the navbar
    const careModeBtn = page.locator('button[aria-label="Switch to Care mode"]');
    await expect(careModeBtn).toBeVisible();
    await careModeBtn.click({ force: true });

    // 3. Verify the input is replaced with the grandmother hip recovery preset automatically
    const problemTextarea = page.locator('#problem-input');
    await expect(problemTextarea).toHaveValue(/grandmother/, { timeout: 8000 });

    // 4. Click Generate to stream Care Mode insights
    const generateBtn = page.locator('button.generate-button');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click({ force: true });

    // 5. Verify results render and show care-specific strategies
    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 15000 });

    // 6. Save/bookmark the first insight card
    const saveBtn = page.locator('button[aria-label*="Save insight"]').first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click({ force: true });

    // 7. Verify the Care Plan synthesis panel pops up, then generate the plan
    const synthesizeBtn = page.locator('button:has-text("Generate Care Plan")');
    await expect(synthesizeBtn).toBeVisible();
    await page.waitForTimeout(500);
    await synthesizeBtn.click({ force: true });

    // 8. Assert that the care plan breakdown is displayed (using locator.waitFor to bypass Firefox hashchange navigation check)
    const carePlanGrid = page.locator('text=Key Interventions');
    await carePlanGrid.waitFor({ state: 'visible', timeout: 15000 });
    await expect(carePlanGrid).toBeVisible();
  });

  test('Navigation: legal links should point to terms and privacy routes', async ({ page }) => {
    const termsLink = page.locator('a:has-text("Terms & Conditions")');
    const privacyLink = page.locator('a:has-text("Privacy Policy")');

    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();

    await expect(termsLink).toHaveAttribute('href', '/terms');
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});
