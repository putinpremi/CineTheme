import { test, expect } from '@playwright/test';

test.describe('CineTheme Anime Intelligence & Player Features E2E', () => {
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

    // Mock Anime Episode Item Metadata with Chapters
    await page.route('**/Users/*/Items/anime-ep-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'anime-ep-1',
          Name: 'Cruel Angel Thesis',
          Type: 'Episode',
          SeriesName: 'Neon Genesis Evangelion',
          SeriesId: 'series-eva-1',
          SeasonId: 'season-eva-1',
          IndexNumber: 1,
          ParentIndexNumber: 1,
          ProductionYear: 1995,
          RunTimeTicks: 14400000000,
          Chapters: [
            { StartPositionTicks: 0, Name: 'Prologue' },
            { StartPositionTicks: 900000000, Name: 'Opening (A Cruel Angel\'s Thesis)' }, // 90s - 180s
            { StartPositionTicks: 1800000000, Name: 'Episode Part A' },
            { StartPositionTicks: 13200000000, Name: 'Ending (Fly Me to the Moon)' }, // 1320s - 1410s
            { StartPositionTicks: 14100000000, Name: 'Preview' },
          ],
          UserData: { PlaybackPositionTicks: 0, Played: false, IsFavorite: true },
        }),
      });
    });

    // Mock Next Episode metadata
    await page.route('**/Users/*/Items/anime-ep-2', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Id: 'anime-ep-2',
          Name: 'Unfamiliar Ceiling',
          Type: 'Episode',
          SeriesName: 'Neon Genesis Evangelion',
          SeriesId: 'series-eva-1',
          SeasonId: 'season-eva-1',
          IndexNumber: 2,
          ParentIndexNumber: 1,
          ProductionYear: 1995,
          RunTimeTicks: 14400000000,
          Chapters: [],
          UserData: { PlaybackPositionTicks: 0, Played: false, IsFavorite: true },
        }),
      });
    });

    // Mock Season Episodes Query for Episode Navigation
    await page.route('**/Shows/series-eva-1/Episodes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Items: [
            {
              Id: 'anime-ep-1',
              Name: 'Cruel Angel Thesis',
              IndexNumber: 1,
              ParentIndexNumber: 1,
              SeriesName: 'Neon Genesis Evangelion',
            },
            {
              Id: 'anime-ep-2',
              Name: 'Unfamiliar Ceiling',
              IndexNumber: 2,
              ParentIndexNumber: 1,
              SeriesName: 'Neon Genesis Evangelion',
            },
          ],
          TotalRecordCount: 2,
        }),
      });
    });

    // Mock PlaybackInfo negotiation for anime episode
    await page.route('**/Items/anime-ep-*/PlaybackInfo**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          MediaSources: [
            {
              Id: 'source-anime-ep-1',
              Container: 'mkv',
              SupportsDirectPlay: true,
              SupportsDirectStream: true,
              SupportsTranscoding: true,
              RunTimeTicks: 14400000000,
              MediaStreams: [
                { Type: 'Video', Index: 0, Codec: 'h264', IsDefault: true },
                { Type: 'Audio', Index: 1, Codec: 'aac', Language: 'jpn', DisplayTitle: 'Japanese Stereo', IsDefault: true },
                { Type: 'Subtitle', Index: 2, Codec: 'ass', Language: 'eng', DisplayTitle: 'English (Styled)', DeliveryMethod: 'External', DeliveryUrl: '/Videos/anime-ep-1/source-anime-ep-1/Subtitles/2/Stream.ass' },
              ],
              MediaAttachments: [
                { Index: 1, FileName: 'AnimeFont.otf', MimeType: 'font/otf', DeliveryUrl: '/Videos/anime-ep-1/source-anime-ep-1/Attachments/1' },
              ],
              DefaultAudioStreamIndex: 1,
              DefaultSubtitleStreamIndex: 2,
            },
          ],
          PlaySessionId: 'e2e-anime-session-123',
        }),
      });
    });

    // Mock Trickplay Manifest
    await page.route('**/Items/anime-ep-1/Trickplay/**/GetManifest**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Width: 3200,
          Height: 1800,
          TileWidth: 10,
          TileHeight: 10,
          ThumbnailCount: 500,
          Interval: 10000,
        }),
      });
    });

    // Mock Telemetry
    await page.route('**/Sessions/Playing**', async (route) => {
      await route.fulfill({ status: 204 });
    });
  });

  test('displays episode context in HUD and renders Next Episode navigation button', async ({ page }) => {
    await page.goto('/player/anime-ep-1');

    // Video stream element is mounted
    await expect(page.getByLabel(/CineTheme Video Stream/i)).toBeVisible();

    // Verify Title and Subtitle in HUD
    await expect(page.getByText('Cruel Angel Thesis')).toBeVisible();
    await expect(page.getByText(/Neon Genesis Evangelion/i)).toBeVisible();

    // Next Episode button is present in HUD controls
    await expect(page.getByRole('button', { name: /Next Episode/i })).toBeVisible();
  });
});
