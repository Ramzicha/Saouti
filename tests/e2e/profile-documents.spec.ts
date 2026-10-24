import { test, expect } from '@playwright/test';

test.describe('E2E User Journey: Profile Documents (PDF)', () => {
  test('navigates to settings profile and checks document management section', async ({
    page,
  }) => {
    await page.goto('/en/settings/profile');

    // Verify page loads successfully
    await expect(page).toHaveTitle(/Saouti|Voice Profile|Settings/i);

    // Look for Documents tab button or heading
    const docsTab = page.getByRole('tab', { name: /documents/i }).or(page.getByText(/documents/i).first());
    if (await docsTab.isVisible()) {
      await docsTab.click();
    }

    // Verify Documents section is present
    const documentsContainer = page.locator('div').filter({ hasText: /Upload PDF Documents|Documents/i }).first();
    await expect(documentsContainer).toBeVisible();
  });
});
