import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explore Page Accessibility (WCAG AA), Keyboard & RTL Audits', () => {
  test('should pass WCAG AA standards in dark mode on /explore', async ({
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

    await page.goto('/explore');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass WCAG AA standards in light mode on /explore', async ({
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

    await page.goto('/explore');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass WCAG AA standards on /explore/saved', async ({
    page,
  }) => {
    await page.goto('/explore/saved');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('supports RTL direction on Arabic explore page /ar/explore', async ({ page }) => {
    await page.goto('/ar/explore');
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
  });
});
