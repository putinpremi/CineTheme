import { buildApiUrl, normalizeServerUrl } from './urlUtils';

export type JellyfinImageType = 'Primary' | 'Backdrop' | 'Logo' | 'Thumb' | 'Banner' | 'Art';

export interface ImageUrlOptions {
  tag?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpg' | 'png';
  token?: string;
  fillWidth?: number;
  fillHeight?: number;
}

/**
 * Builds a normalized, cache-friendly image URL for a Jellyfin media item.
 */
export function buildItemImageUrl(
  serverUrl: string,
  itemId: string,
  imageType: JellyfinImageType = 'Primary',
  options: ImageUrlOptions = {}
): string {
  if (!serverUrl || !itemId) {
    return '';
  }

  const normalizedServer = normalizeServerUrl(serverUrl);
  const endpoint = `/Items/${itemId}/Images/${imageType}`;

  const queryParams: Record<string, string | number | boolean | undefined> = {
    tag: options.tag,
    quality: options.quality ?? 90,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    fillWidth: options.fillWidth,
    fillHeight: options.fillHeight,
    format: options.format ?? 'webp',
  };

  if (options.token) {
    queryParams.api_key = options.token;
  }

  return buildApiUrl(normalizedServer, endpoint, queryParams);
}

/**
 * Builds a user avatar image URL.
 */
export function buildUserAvatarUrl(
  serverUrl: string,
  userId: string,
  options: ImageUrlOptions = {}
): string {
  if (!serverUrl || !userId) {
    return '';
  }

  const normalizedServer = normalizeServerUrl(serverUrl);
  const endpoint = `/Users/${userId}/Images/Primary`;

  const queryParams: Record<string, string | number | boolean | undefined> = {
    tag: options.tag,
    quality: options.quality ?? 90,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    format: options.format ?? 'webp',
  };

  if (options.token) {
    queryParams.api_key = options.token;
  }

  return buildApiUrl(normalizedServer, endpoint, queryParams);
}
