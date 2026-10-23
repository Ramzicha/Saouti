import { test, expect } from '@playwright/test';

test.describe('Voice Profile Onboarding Multilingual E2E', () => {
  test('renders English onboarding with LTR layout and correct step labels', async ({
    page,
  }) => {
    await page.goto('/en/onboarding');

    // Verify main header
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Build Your Voice Profile');

    // Verify LTR direction
    const container = page.locator('div[lang="en"]');
    await expect(container).toHaveAttribute('dir', 'ltr');

    // Verify Step 1 fields
    const roleInput = page.locator('#identity_role');
    await expect(roleInput).toBeVisible();
    await expect(roleInput).toHaveAttribute(
      'placeholder',
      'e.g. Lead Cloud Architect, Founder & CEO',
    );

    // Verify Completeness Meter
    const completeness = page.locator('text=Profile Completeness');
    await expect(completeness).toBeVisible();

    // Verify AI interview mode switcher
    const switcher = page.locator('text=Or choose interactive AI interview');
    await expect(switcher).toBeVisible();
  });

  test('renders French onboarding with LTR layout and French translations', async ({
    page,
  }) => {
    await page.goto('/fr/onboarding');

    // Verify main header
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Construisez votre profil vocal');

    // Verify LTR direction
    const container = page.locator('div[lang="fr"]');
    await expect(container).toHaveAttribute('dir', 'ltr');

    // Verify French switcher button
    const switcher = page.locator('button:has-text("entretien interactif")');
    await expect(switcher).toBeVisible();
  });

  test('renders Arabic onboarding with RTL layout and Arabic translations', async ({
    page,
  }) => {
    await page.goto('/ar/onboarding');

    // Verify RTL direction on Arabic container
    const container = page.locator('div[lang="ar"]');
    await expect(container).toHaveAttribute('dir', 'rtl');

    // Verify Arabic main header
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('أنشئ ملفك الصوتي');

    // Verify Arabic role input placeholder
    const roleInput = page.locator('#identity_role');
    await expect(roleInput).toBeVisible();

    // Verify Arabic Completeness Meter
    const completeness = page.locator('text=اكتمال الملف');
    await expect(completeness).toBeVisible();
  });

  test('allows toggling between Guided Form and AI Profiler interview mode', async ({
    page,
  }) => {
    await page.goto('/en/onboarding');

    // Click interactive AI interview button
    const interviewBtn = page.locator('button:has-text("Or choose interactive AI interview")');
    await interviewBtn.click();

    // Verify chat UI mounts
    const profilerHeader = page.locator('h1:has-text("AI Voice Profiler Interview")');
    await expect(profilerHeader).toBeVisible();

    // Switch back to form
    const formBtn = page.locator('button:has-text("Switch to Guided Form")');
    await expect(formBtn).toBeVisible();
    await formBtn.click();

    // Verify form re-mounts
    const roleInput = page.locator('#identity_role');
    await expect(roleInput).toBeVisible();
  });
});
