import { test, expect } from '@playwright/test';

test.describe('CineTheme Application & Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock public server info
    await page.route('**/System/Info/Public', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ServerName: 'CineTheme-E2E-Server',
          Version: '10.9.11',
          Id: 'server-guid-12345',
          StartupWizardCompleted: true,
        }),
      });
    });

    // Mock authentication
    await page.route('**/Users/AuthenticateByName', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          User: {
            Id: 'user-guid-67890',
            Name: 'DemoUser',
            Policy: { IsAdministrator: true, IsDisabled: false },
          },
          AccessToken: 'test-e2e-token-xyz',
          ServerId: 'server-guid-12345',
        }),
      });
    });

    // Mock user libraries
    await page.route('**/Users/*/Views', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            { Id: 'lib-movies-1', Name: 'Movies', CollectionType: 'movies', Type: 'CollectionFolder' },
            { Id: 'lib-tv-2', Name: 'TV Shows', CollectionType: 'tvshows', Type: 'CollectionFolder' },
          ],
          TotalRecordCount: 2,
        }),
      });
    });

    // Mock resume items
    await page.route('**/Users/*/Items/Resume**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            {
              Id: 'movie-item-1',
              Name: 'Inception',
              Type: 'Movie',
              ProductionYear: 2010,
              RunTimeTicks: 88800000000,
              UserData: { PlaybackPositionTicks: 24000000000, Played: false, IsFavorite: true },
            },
          ],
          TotalRecordCount: 1,
        }),
      });
    });

    // Mock items search / library
    await page.route('**/Users/*/Items**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            {
              Id: 'movie-item-1',
              Name: 'Inception',
              Type: 'Movie',
              ProductionYear: 2010,
              RunTimeTicks: 88800000000,
              UserData: { PlaybackPositionTicks: 0, Played: false, IsFavorite: true },
            },
          ],
          TotalRecordCount: 1,
        }),
      });
    });
  });

  test('completes login and navigates between views', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeVisible();

    // Fill credentials
    await page.getByLabel(/Jellyfin Server URL/i).fill('http://127.0.0.1:8096');
    await page.getByLabel(/Username/i).fill('demo');
    await page.locator('input[type="password"]').fill('password123');

    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify redirect to Home view
    await expect(page).toHaveURL(/.*home/);
    await expect(page.getByRole('heading', { name: /Cinematic Media Hub/i })).toBeVisible();

    // Navigate to Library
    await page.getByRole('link', { name: 'Libraries', exact: true }).click();
    await expect(page).toHaveURL(/.*library/);
    await expect(page.getByRole('heading', { name: /Media Libraries/i, level: 1 })).toBeVisible();

    // Navigate to Search
    await page.getByRole('link', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/.*search/);
    await expect(page.getByPlaceholder(/Search by title/i)).toBeVisible();
  });

  test('renders properly across mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
});
