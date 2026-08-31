import { test, expect } from '@playwright/test';

test.describe('CineTheme PWA & Offline Shell E2E Tests', () => {
  test('serves valid web app manifest with standalone display mode and icons', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('CineTheme');
    expect(manifest.short_name).toBe('CineTheme');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0a0a0f');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('verifies service worker file is available at root /sw.js', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const swContent = await response.text();
    expect(swContent).toContain('cinetheme-app-shell');
  });

  test('renders offline banner when browser goes offline', async ({ page }) => {
    await page.goto('/login');

    // Simulate going offline
    await page.context().setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Offline banner appears
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText(/You are currently offline/i)).toBeVisible();

    // Simulate going back online
    await page.context().setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Offline banner dismisses
    await expect(page.getByRole('status')).not.toBeVisible();
  });
});
