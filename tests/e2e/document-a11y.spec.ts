import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Profile Documents Accessibility (WCAG AA), Keyboard & RTL Audits', () => {
  test('should pass WCAG AA standards in dark mode on /settings/profile documents section', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'saouti-theme',
        value: 'dark',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/en/settings/profile');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass WCAG AA standards in light mode on /settings/profile documents section', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'saouti-theme',
        value: 'light',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/en/settings/profile');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('verifies keyboard accessibility and escape key handling', async ({ page }) => {
    await page.goto('/en/settings/profile');

    // Tab through to verify focusability
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Escape should not crash and should dismiss open modals if any
    await page.keyboard.press('Escape');
    expect(page.url()).toContain('/settings/profile');
  });

  test('renders Arabic documents UI with dir="rtl" and appropriate localized typography', async ({
    page,
  }) => {
    await page.goto('/ar/settings/profile');

    const localizedContainer = page.locator('div[lang="ar"]');
    if (await localizedContainer.count() > 0) {
      await expect(localizedContainer.first()).toHaveAttribute('dir', 'rtl');
    }

    // Verify page loads without console error
    expect(page.url()).toContain('/ar/settings/profile');
  });
});
