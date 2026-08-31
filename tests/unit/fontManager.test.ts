import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FontManager } from '../../src/player/subtitles/fontManager';
import type { MediaAttachmentDto } from '../../src/api/types/jellyfinDto';

describe('FontManager Subtitle Font Attachments', () => {
  let fontManager: FontManager;

  beforeEach(() => {
    fontManager = new FontManager();
  });

  afterEach(() => {
    fontManager.clear();
    vi.restoreAllMocks();
  });

  it('discovers and extracts font attachments matching mime types and file extensions', () => {
    const attachments: MediaAttachmentDto[] = [
      { Index: 0, Name: 'trebuchet.ttf', MimeType: 'font/ttf' },
      { Index: 1, Name: 'opensans.otf', MimeType: 'application/x-font-opentype' },
      { Index: 2, Name: 'cover.jpg', MimeType: 'image/jpeg' }, // non-font
      { Index: 3, Name: 'japanese-styled.woff2', MimeType: 'font/woff2' },
    ];

    const discovered = fontManager.discoverFontAttachments(
      'http://127.0.0.1:8096',
      'item-123',
      'source-abc',
      'test-token',
      attachments
    );

    expect(discovered).toHaveLength(3);
    expect(discovered[0]?.name).toBe('trebuchet.ttf');
    expect(discovered[0]?.url).toContain('/Videos/item-123/source-abc/Attachments/0');
    expect(discovered[0]?.url).toContain('api_key=test-token');
    expect(discovered[1]?.name).toBe('opensans.otf');
    expect(discovered[2]?.name).toBe('japanese-styled.woff2');
  });

  it('loads font attachments and caches them in memory as Object URLs', async () => {
    const mockBlob = new Blob(['mock-font-binary'], { type: 'font/ttf' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockBlob, { status: 200, headers: { 'Content-Type': 'font/ttf' } })
    );

    const fonts = [
      {
        index: 0,
        name: 'test-font.ttf',
        url: 'http://127.0.0.1:8096/Videos/item-1/source-1/Attachments/0?api_key=xyz',
      },
    ];

    const loadedUrls = await fontManager.loadFonts(fonts);
    expect(loadedUrls).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call for the same font must hit in-memory cache with zero network calls
    const cachedUrls = await fontManager.loadFonts(fonts);
    expect(cachedUrls).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles 404 or network errors during font fetch without crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 404, statusText: 'Not Found' })
    );

    const fonts = [
      {
        index: 99,
        name: 'missing-font.ttf',
        url: 'http://127.0.0.1:8096/Videos/item-1/source-1/Attachments/99?api_key=xyz',
      },
    ];

    const loadedUrls = await fontManager.loadFonts(fonts);
    expect(loadedUrls).toHaveLength(0);
  });

  it('cleans up in-flight abort controllers and revokes object URLs on clear', async () => {
    const mockBlob = new Blob(['mock-font-binary'], { type: 'font/ttf' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockBlob, { status: 200, headers: { 'Content-Type': 'font/ttf' } })
    );

    await fontManager.loadFonts([
      {
        index: 0,
        name: 'clear-test.ttf',
        url: 'http://127.0.0.1:8096/Videos/item-1/source-1/Attachments/0?api_key=xyz',
      },
    ]);

    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    fontManager.clear();
    expect(revokeSpy).toHaveBeenCalled();
  });
});
