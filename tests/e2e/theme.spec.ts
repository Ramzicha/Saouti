import { test, expect } from '@playwright/test';

test.describe('Theme zero-flash and switching', () => {
  test('persists theme cookie across reload and updates root data-theme attribute', async ({
    page,
    context,
  }) => {
    // Set cookie explicitly to dark
    await context.addCookies([
      {
        name: 'saouti-theme',
        value: 'dark',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/design');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Click light button
    const lightBtn = page.getByRole('button', { name: /light theme/i });
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await expect(html).toHaveAttribute('data-theme', 'light');

      // Reload page and check that light theme persists without flash
      await page.reload();
      await expect(html).toHaveAttribute('data-theme', 'light');
    }
  });
});
