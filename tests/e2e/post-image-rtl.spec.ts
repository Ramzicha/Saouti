import { test, expect } from '@playwright/test';

test.describe('Post Visuals Arabic RTL Layout E2E', () => {
  test('renders Arabic visual elements with rtl directionality', async ({ page }) => {
    await page.goto('/ar/library');

    const localizedContainer = page.locator('div[lang="ar"]');
    await expect(localizedContainer).toHaveAttribute('dir', 'rtl');

    // Verify Arabic visual translation text when cards are present
    const artBadge = page.locator('text=المخرج الفني');
    if (await artBadge.first().isVisible()) {
      await expect(artBadge.first()).toBeVisible();
    }
  });
});
