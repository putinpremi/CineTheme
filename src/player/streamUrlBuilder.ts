import { normalizeServerUrl } from '../api/client/urlUtils';

export interface BuildDirectPlayUrlOptions {
  serverUrl: string;
  itemId: string;
  mediaSourceId: string;
  playSessionId?: string;
  container?: string;
  token: string;
}

export interface BuildHlsUrlOptions {
  serverUrl: string;
  transcodingUrl: string;
  token: string;
}

export interface BuildSubtitleUrlOptions {
  serverUrl: string;
  itemId: string;
  mediaSourceId: string;
  subtitleIndex: number;
  format?: 'vtt' | 'srt' | 'ass' | 'ssa';
  token: string;
}

/**
 * Builds a progressive direct play media stream URL.
 */
export function buildDirectPlayUrl(options: BuildDirectPlayUrlOptions): string {
  const base = normalizeServerUrl(options.serverUrl);
  const container = options.container || 'mp4';
  const query = new URLSearchParams({
    static: 'true',
    mediaSourceId: options.mediaSourceId,
    api_key: options.token,
  });

  if (options.playSessionId) {
    query.set('playSessionId', options.playSessionId);
  }

  return `${base}/Videos/${encodeURIComponent(options.itemId)}/stream.${encodeURIComponent(container)}?${query.toString()}`;
}

/**
 * Builds an authenticated HLS master playlist URL from the server-provided TranscodingUrl.
 */
export function buildHlsStreamUrl(options: BuildHlsUrlOptions): string {
  const base = normalizeServerUrl(options.serverUrl);
  let url = options.transcodingUrl;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${base}${cleanPath}`;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}api_key=${encodeURIComponent(options.token)}`;
}

/**
 * Builds an authenticated subtitle stream extraction URL.
 */
export function buildSubtitleStreamUrl(options: BuildSubtitleUrlOptions): string {
  const base = normalizeServerUrl(options.serverUrl);
  const format = options.format || 'vtt';
  return `${base}/Videos/${encodeURIComponent(options.itemId)}/${encodeURIComponent(options.mediaSourceId)}/Subtitles/${encodeURIComponent(String(options.subtitleIndex))}/Stream.${encodeURIComponent(format)}?api_key=${encodeURIComponent(options.token)}`;
}

/**
 * Redacts authentication tokens and API keys from media URLs for safe error rendering and logging.
 */
export function redactMediaUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/([?&]api_key=)[^&]+/gi, '$1[REDACTED]')
    .replace(/([?&]Token=)[^&]+/gi, '$1[REDACTED]')
    .replace(/([?&]password=)[^&]+/gi, '$1[REDACTED]');
}
