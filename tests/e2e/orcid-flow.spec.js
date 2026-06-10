import { test, expect } from '@playwright/test';

test.describe('ORCID Authentication Flow', () => {

  test('should handle ORCID OAuth callback, exchange code, store researcher details, and display badges', async ({ page }) => {
    // Mock config call
    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          googleClientId: null,
          orcidClientId: 'mock-client-id'
        })
      });
    });

    // Mock OAuth exchange token endpoint
    await page.route('**/api/auth/orcid', async (route) => {
      expect(route.request().method()).toBe('POST');
      const postData = route.request().postDataJSON();
      expect(postData.code).toBe('mock-code-123');
      expect(postData.redirectUri).toContain('http://localhost:');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orcid: '0009-0008-1372-5381',
          name: 'Phil Gear',
          accessToken: 'mock-access-token'
        })
      });
    });

    // 1. Navigate to the page with a mock code query parameter
    await page.goto('/?code=mock-code-123');

    // 2. The overlay should show the connected ORCID status
    const connectedName = page.locator('text=Phil Gear');
    await expect(connectedName).toBeVisible({ timeout: 10000 });

    const connectedId = page.locator('text=0009-0008-1372-5381');
    await expect(connectedId).toBeVisible();

    // 3. Close overlay by clicking Try a Demo (to see header and footer)
    const demoButton = page.locator('button:has-text("Try a Demo")');
    await demoButton.click({ force: true });

    // 4. Verify the header displays the verified ORCID badge
    const headerBadge = page.locator('header a[href*="orcid.org/0009-0008-1372-5381"]');
    await expect(headerBadge).toBeVisible();

    // 5. Verify the footer contains the authenticated researcher attribution
    const footerAttribution = page.locator('text=Documented by Researcher: Phil Gear');
    await expect(footerAttribution).toBeVisible();

    // 6. Test Disconnect
    const disconnectButton = page.locator('button[aria-label="Disconnect ORCID"]');
    await disconnectButton.click({ force: true });

    // 7. Verify ORCID is disconnected (footer and header badges should disappear)
    await expect(headerBadge).not.toBeVisible();
    await expect(footerAttribution).not.toBeVisible();
  });
});
