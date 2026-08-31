import { test, expect } from '@playwright/test';

test.describe('CineTheme Player E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject active session into localStorage matching useAuthStore key
    await page.addInitScript(() => {
      const activeSession = {
        accessToken: 'test-e2e-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'DemoUser', isAdmin: true, isDisabled: false },
        lastConnected: Date.now(),
      };
      localStorage.setItem('cinetheme_active_session', JSON.stringify(activeSession));
    });

    // Mock Item metadata
    await page.route('**/Users/*/Items/movie-item-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'movie-item-1',
          Name: 'Inception',
          Type: 'Movie',
          ProductionYear: 2010,
          RunTimeTicks: 88800000000,
          UserData: { PlaybackPositionTicks: 0, Played: false, IsFavorite: true },
        }),
      });
    });

    // Mock PlaybackInfo negotiation
    await page.route('**/Items/movie-item-1/PlaybackInfo**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          MediaSources: [
            {
              Id: 'source-movie-item-1',
              Container: 'mp4',
              SupportsDirectPlay: true,
              SupportsDirectStream: true,
              SupportsTranscoding: true,
              RunTimeTicks: 88800000000,
              MediaStreams: [
                { Type: 'Video', Index: 0, Codec: 'h264', IsDefault: true },
                { Type: 'Audio', Index: 1, Codec: 'aac', Language: 'eng', DisplayTitle: 'English Stereo', IsDefault: true },
                { Type: 'Subtitle', Index: 2, Codec: 'vtt', Language: 'eng', DisplayTitle: 'English (SRT)', DeliveryMethod: 'External', DeliveryUrl: '/Videos/movie-item-1/source-movie-item-1/Subtitles/2/Stream.vtt' },
              ],
              DefaultAudioStreamIndex: 1,
              DefaultSubtitleStreamIndex: 2,
            },
          ],
          PlaySessionId: 'e2e-session-123',
        }),
      });
    });

    // Mock Telemetry
    await page.route('**/Sessions/Playing**', async (route) => {
      await route.fulfill({ status: 204 });
    });
  });

  test('loads player route, renders HUD, and handles controls', async ({ page }) => {
    await page.goto('/player/movie-item-1');

    // Video stream element is mounted
    const video = page.getByLabel(/CineTheme Video Stream/i);
    await expect(video).toBeVisible();

    // Verify Title in HUD
    await expect(page.getByText('Inception')).toBeVisible();

    // Verify Timeline Slider
    await expect(page.getByRole('slider', { name: /Video Timeline/i })).toBeVisible();

    // Verify Play button
    const playBtn = page.getByRole('button', { name: 'Play', exact: true });
    await expect(playBtn).toBeVisible();

    // Open Audio Menu
    await page.getByRole('button', { name: /Audio Track/i }).click();
    await expect(page.getByRole('dialog', { name: /Audio Settings/i })).toBeVisible();
    await page.getByRole('button', { name: /Close audio settings/i }).click();

    // Open Subtitle Menu
    await page.getByRole('button', { name: /Subtitles/i }).click();
    await expect(page.getByRole('dialog', { name: /Subtitle Settings/i })).toBeVisible();
    await page.getByRole('button', { name: /Close subtitle settings/i }).click();

    // Open Quality Menu
    await page.getByRole('button', { name: /Stream Quality/i }).click();
    await expect(page.getByRole('dialog', { name: /Quality Settings/i })).toBeVisible();
    await page.getByRole('button', { name: /Close quality settings/i }).click();

    // Test Keyboard Hotkey (M for mute)
    await page.keyboard.press('KeyM');

    // Exit Player
    await page.getByRole('button', { name: /Exit Player/i }).click();
  });
});
