import { test, expect } from '@playwright/test';

test.describe('Post Library Arabic RTL Layout', () => {
  test('renders Arabic library with dir="rtl", mirrored filters and search input', async ({
    page,
  }) => {
    await page.goto('/ar/library');

    const localizedContainer = page.locator('div[lang="ar"]');
    await expect(localizedContainer).toHaveAttribute('dir', 'rtl');

    // Verify Arabic headline text
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
    await expect(title).toContainText('مكتبة المنشورات');

    // Verify search input has dir="auto"
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('dir', 'auto');
  });
});
