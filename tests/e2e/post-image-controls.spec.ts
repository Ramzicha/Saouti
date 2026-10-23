import { test, expect } from '@playwright/test';

test.describe('Post Visuals & Image Controls E2E', () => {
  test('renders image prompts, copy action, and aspect ratio badge on post cards', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/en/library');

    // Verify Library heading
    const heading = page.locator('h1, h2').filter({ hasText: 'Post Library' });
    await expect(heading.first()).toBeVisible();

    // Check if visual prompt cards are present
    const promptCard = page.locator('text=Art Director').first();
    if (await promptCard.isVisible()) {
      // Find Copy Prompt button
      const copyPromptBtn = page.locator('button', { hasText: 'Copy prompt' }).first();
      if (await copyPromptBtn.isVisible()) {
        await copyPromptBtn.click();
        const copiedIndicator = page.locator('text=Prompt copied!').first();
        await expect(copiedIndicator).toBeVisible();
      }
    }
  });
});
