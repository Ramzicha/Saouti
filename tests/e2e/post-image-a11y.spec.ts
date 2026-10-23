import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Post Images Accessibility WCAG AA Audit', () => {
  test('should pass WCAG AA standards in dark mode on /en/library with visual elements', async ({
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

    await page.goto('/en/library');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass WCAG AA standards in light mode on /en/library with visual elements', async ({
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

    await page.goto('/en/library');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass WCAG AA standards in RTL dark mode on /ar/library', async ({
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

    await page.goto('/ar/library');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
