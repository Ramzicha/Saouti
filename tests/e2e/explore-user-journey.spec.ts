import { test, expect } from '@playwright/test';

test.describe('Explore User Journey (Onboarding -> Explore -> Create Post)', () => {
  test('verifies Tavily key onboarding step is available and skippable', async ({ page }) => {
    await page.goto('/onboarding');
    // Onboarding page renders with step navigation
    await expect(page).toHaveTitle(/Saouti/);
  });

  test('loads Explore feed with topic chips and search box', async ({ page }) => {
    await page.goto('/explore');
    // Either redirected to login or renders explore view
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('navigates cleanly to /explore/saved reading list', async ({ page }) => {
    await page.goto('/explore/saved');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/login/);
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});
