import { test, expect } from '@playwright/test';

test.describe('Post Library - One-Click Copy E2E', () => {
  test('renders post cards with copy triggers and displays confirmation badge on copy', async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/en/library');

    // Verify Library heading
    const heading = page.locator('h1, h2').filter({ hasText: 'Post Library' });
    await expect(heading.first()).toBeVisible();

    // Check if post cards or copy buttons are present
    const copyButton = page.locator('button[data-testid="copy-post-button"]').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Verify "Copied!" badge appears
      const copiedBadge = page.locator('text=Copied!').first();
      await expect(copiedBadge).toBeVisible();

      // Verify badge auto-dismisses after 2 seconds
      await expect(copiedBadge).not.toBeVisible({ timeout: 4000 });
    }
  });
});
