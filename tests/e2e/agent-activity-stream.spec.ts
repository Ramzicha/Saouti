import { test, expect } from '@playwright/test';

test.describe('Agent Activity Timeline & Composer E2E', () => {
  test('renders workspace composer with multi-platform chips and Fast Draft toggle', async ({
    page,
  }) => {
    await page.goto('/en');

    // Verify main workspace headline
    const headline = page.locator('h2');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText('Craft posts in your');

    // Verify Composer exists
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Verify platform chips
    await expect(page.locator('button:has-text("LinkedIn")')).toBeVisible();
    await expect(page.locator('button:has-text("X (Twitter)")')).toBeVisible();
    await expect(page.locator('button:has-text("Reddit")')).toBeVisible();

    // Verify Fast Draft toggle button
    const fastDraftBtn = page.locator('button:has-text("Fast Draft")');
    await expect(fastDraftBtn).toBeVisible();

    // Verify Activity Timeline section
    const timelineRegion = page.locator('div[role="region"][aria-label="Agent activity timeline"]');
    await expect(timelineRegion).toBeVisible();

    // Verify default agents present in timeline
    await expect(page.locator('text=Writer')).toBeVisible();
    await expect(page.locator('text=Critic')).toBeVisible();
    await expect(page.locator('text=Art Director')).toBeVisible();
  });

  test('toggles Fast Draft option and platforms interactively in Composer', async ({ page }) => {
    await page.goto('/en');

    const fastDraftBtn = page.locator('button:has-text("Fast Draft")');
    await expect(fastDraftBtn).toBeVisible();

    // Click Fast Draft to enable
    await fastDraftBtn.click();
    await expect(fastDraftBtn).toHaveClass(/border-accent/);

    // Click again to disable
    await fastDraftBtn.click();
    await expect(fastDraftBtn).toHaveClass(/border-border/);

    // Toggle Reddit chip
    const redditChip = page.locator('button:has-text("Reddit")');
    await redditChip.click();
    await expect(redditChip).toHaveAttribute('aria-pressed', 'true');
  });
});
