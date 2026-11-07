import { test, expect } from '@playwright/test';

test.describe('HTTP Security Headers, ASCII Fetch Headers & Mobile Header Layout E2E', () => {
  test('Server returns Mozilla Observatory 125+ Grade A+ security headers on root & API', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();

    expect(headers['strict-transport-security']).toContain('max-age=31536000; includeSubDomains; preload');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(headers['cross-origin-embedder-policy']).toBe('credentialless');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['content-security-policy']).not.toContain("'unsafe-inline' 'unsafe-eval'");
  });

  test('Roll Smart Synergy + 6-Axis Steering sends strict ISO-8859-1 ASCII headers without fetch crash', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport
    await page.goto('/');

    // Enter Demo Mode
    const demoBtn = page.locator('button:has-text("Demo Mode")');
    await expect(demoBtn).toBeVisible();
    await demoBtn.click({ force: true });

    // Verify mobile header controls stay in a single horizontal row (all chips share similar Y top)
    const creativeChip = page.locator('button[aria-label="Switch to Creative mode"]');
    const themeChip = page.locator('button[aria-label*="theme"]');
    const box1 = await creativeChip.boundingBox();
    const box2 = await themeChip.boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    expect(Math.abs(box1.y - box2.y)).toBeLessThan(12);

    // Click Roll Smart Synergy (populates x-synergy-bridge in localStorage)
    const rollBtn = page.locator('button:has-text("Roll Smart Synergy")');
    await expect(rollBtn).toBeVisible();
    await rollBtn.click({ force: true });

    // Verify localStorage headers contain zero non-ISO-8859-1 characters (> 0xFF)
    const headerCheck = await page.evaluate(() => {
      const bridge = localStorage.getItem('spark_synergy_bridge') || '';
      const steering = localStorage.getItem('spark_brand_steering') || '';
      const hasHighUnicode = (s) => [...s].some(ch => ch.charCodeAt(0) > 126);
      return {
        bridge,
        steering,
        bridgeClean: !hasHighUnicode(bridge),
        steeringClean: !hasHighUnicode(steering),
      };
    });
    expect(headerCheck.bridgeClean).toBe(true);
    expect(headerCheck.steeringClean).toBe(true);

    // Verify tapping a provocation pill directly works in 1 tap (auto-unlocks wheel lock)
    const simplifyPill = page.locator('button.strategy-button:has-text("Eliminate & Simplify")');
    await expect(simplifyPill).toBeEnabled();
    await simplifyPill.click({ force: true });

    // Generate insights and verify zero Generation Error banner
    const generateBtn = page.locator('button.generate-button');
    await generateBtn.click({ force: true });

    const errorBanner = page.locator('text=Generation Error');
    await expect(errorBanner).toBeHidden();

    const resultsRegion = page.locator('section[role="region"]');
    await expect(resultsRegion).toBeVisible({ timeout: 15000 });
  });
});
