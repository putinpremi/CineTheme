import { httpClient } from '../client/httpClient';
import { buildApiUrl } from '../client/urlUtils';
import type { TrickplayManifestDto } from '../types/jellyfinDto';
import type { TrickplayManifest, TrickplayTile } from '../../domain/anime/types';

export class TrickplayService {
  /**
   * Probes and fetches the Trickplay sprite sheet manifest from Jellyfin 10.9+.
   */
  public async getTrickplayManifest(
    serverUrl: string,
    itemId: string,
    width = 320,
    token: string,
    signal?: AbortSignal
  ): Promise<TrickplayManifest | null> {
    try {
      const dto = await httpClient.get<TrickplayManifestDto>(
        serverUrl,
        `/Items/${itemId}/Trickplay/${width}/GetManifest`,
        { token, signal }
      );

      if (dto && dto.TileWidth > 0 && dto.TileHeight > 0) {
        return {
          width: dto.Width,
          height: dto.Height,
          tileWidth: dto.TileWidth,
          tileHeight: dto.TileHeight,
          thumbnailCount: dto.ThumbnailCount,
          intervalMs: dto.Interval || 10000,
          bandwidth: dto.Bandwidth,
        };
      }
    } catch {
      // Trickplay not generated or unsupported on server version
    }

    return null;
  }

  /**
   * Computes the exact tile sheet index, image URL, and CSS sprite background offsets for a timestamp.
   */
  public getTileForTime(
    serverUrl: string,
    itemId: string,
    width: number,
    token: string,
    manifest: TrickplayManifest,
    timestampSeconds: number
  ): TrickplayTile {
    const singleThumbWidth = manifest.width / manifest.tileWidth;
    const singleThumbHeight = manifest.height / manifest.tileHeight;

    const frameIndex = Math.max(
      0,
      Math.min(
        manifest.thumbnailCount - 1,
        Math.floor((timestampSeconds * 1000) / manifest.intervalMs)
      )
    );

    const tilesPerSheet = manifest.tileWidth * manifest.tileHeight;
    const sheetIndex = Math.floor(frameIndex / tilesPerSheet);
    const localIndex = frameIndex % tilesPerSheet;

    const col = localIndex % manifest.tileWidth;
    const row = Math.floor(localIndex / manifest.tileWidth);

    const offsetX = col * singleThumbWidth;
    const offsetY = row * singleThumbHeight;

    const imageUrl = buildApiUrl(
      serverUrl,
      `/Items/${itemId}/Trickplay/${width}/${sheetIndex}.jpg`,
      { api_key: token }
    );

    return {
      tileIndex: sheetIndex,
      x: offsetX,
      y: offsetY,
      width: singleThumbWidth,
      height: singleThumbHeight,
      imageUrl,
    };
  }
}

export const trickplayService = new TrickplayService();
