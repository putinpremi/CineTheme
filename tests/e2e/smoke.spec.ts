import { test, expect } from '@playwright/test';

test.describe('CineTheme E2E Smoke Test', () => {
  test('loads login view on unauthenticated boot', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/CineTheme/i);
    await expect(page.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeVisible();

    // Verify presence of input fields
    await expect(page.getByLabel(/Jellyfin Server URL/i)).toBeVisible();
    await expect(page.getByLabel(/Username/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
});
