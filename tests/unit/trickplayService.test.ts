import { describe, it, expect, vi } from 'vitest';
import { trickplayService } from '../../src/api/services/trickplayService';
import { httpClient } from '../../src/api/client/httpClient';
import type { TrickplayManifest } from '../../src/domain/anime/types';

describe('TrickplayService Manifest & Tile Coordinate Calculations', () => {
  const mockManifest: TrickplayManifest = {
    width: 3200,
    height: 1800,
    tileWidth: 10,
    tileHeight: 10,
    thumbnailCount: 500,
    intervalMs: 10000, // 10s per frame
  };

  it('fetches and converts Trickplay manifest from Jellyfin 10.9+', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      Version: 1,
      Width: 3200,
      Height: 1800,
      TileWidth: 10,
      TileHeight: 10,
      ThumbnailCount: 500,
      Interval: 10000,
      Bandwidth: 128000,
    });

    const manifest = await trickplayService.getTrickplayManifest(
      'http://127.0.0.1:8096',
      'item-1',
      320,
      'token-xyz'
    );

    expect(manifest).not.toBeNull();
    expect(manifest?.tileWidth).toBe(10);
    expect(manifest?.tileHeight).toBe(10);
    expect(manifest?.intervalMs).toBe(10000);
  });

  it('computes exact sheet index and pixel offsets for thumbnail scrubbing', () => {
    // 0 seconds -> frame 0 (sheet 0, col 0, row 0)
    const tile0 = trickplayService.getTileForTime(
      'http://127.0.0.1:8096',
      'item-1',
      320,
      'token-xyz',
      mockManifest,
      0
    );
    expect(tile0.tileIndex).toBe(0);
    expect(tile0.x).toBe(0);
    expect(tile0.y).toBe(0);
    expect(tile0.width).toBe(320); // 3200 / 10
    expect(tile0.height).toBe(180); // 1800 / 10
    expect(tile0.imageUrl).toContain('/Items/item-1/Trickplay/320/0.jpg');

    // 25 seconds -> frame index 2 (sheet 0, col 2, row 0)
    const tile25 = trickplayService.getTileForTime(
      'http://127.0.0.1:8096',
      'item-1',
      320,
      'token-xyz',
      mockManifest,
      25
    );
    expect(tile25.tileIndex).toBe(0);
    expect(tile25.x).toBe(640); // 2 * 320
    expect(tile25.y).toBe(0);

    // 1050 seconds -> frame index 105 (sheet 1, col 5, row 0 on second sheet)
    const tile1050 = trickplayService.getTileForTime(
      'http://127.0.0.1:8096',
      'item-1',
      320,
      'token-xyz',
      mockManifest,
      1050
    );
    expect(tile1050.tileIndex).toBe(1); // Sheet 1
    expect(tile1050.x).toBe(1600); // 5 * 320
    expect(tile1050.y).toBe(0);
    expect(tile1050.imageUrl).toContain('/Items/item-1/Trickplay/320/1.jpg');
  });

  it('handles missing trickplay endpoints safely without throwing', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce(new Error('404 Not Found'));

    const manifest = await trickplayService.getTrickplayManifest(
      'http://127.0.0.1:8096',
      'item-1',
      320,
      'token-xyz'
    );

    expect(manifest).toBeNull();
  });
});
