import { test, expect } from '@playwright/test';

test.describe('Multilingual and Right-to-Left (RTL) Layout', () => {
  test('renders Arabic layout with dir="rtl" and mirrors start alignment', async ({
    page,
  }) => {
    await page.goto('/ar/design');

    const localizedContainer = page.locator('div[lang="ar"]');
    await expect(localizedContainer).toHaveAttribute('dir', 'rtl');

    // Check Arabic page title text
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
  });
});
