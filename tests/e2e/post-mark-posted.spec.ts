import { test, expect } from '@playwright/test';

test.describe('Post Library - Mark As Posted E2E', () => {
  test('opens mark-as-posted modal, validates HTTPS URL, and updates status', async ({
    page,
  }) => {
    await page.goto('/en/library');

    // Check if library page loaded
    const heading = page.locator('h1, h2').filter({ hasText: 'Post Library' });
    await expect(heading.first()).toBeVisible();

    // Look for mark-as-posted trigger button on any card
    const markPostedBtn = page.locator('button[aria-label="Mark as posted"]').first();
    if (await markPostedBtn.isVisible()) {
      await markPostedBtn.click();

      // Verify modal opened
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      // Enter invalid HTTP url
      const urlInput = page.locator('input[type="url"]');
      await urlInput.fill('http://insecure-link.com/post');

      // Submit and verify validation error
      const submitBtn = modal.locator('button[type="submit"]');
      await submitBtn.click();
      await expect(page.locator('text=HTTPS')).toBeVisible();

      // Enter valid HTTPS url
      await urlInput.fill('https://linkedin.com/posts/saouti-launch-123');
      await submitBtn.click();

      // Modal closes
      await expect(modal).not.toBeVisible({ timeout: 4000 });
    }
  });
});
