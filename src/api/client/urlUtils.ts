import { ConfigurationError } from '../../core/errors/AppError';

/**
 * Normalizes a user-entered Jellyfin server URL:
 * - Trims whitespace
 * - Ensures valid http/https protocol
 * - Strips trailing slashes
 * - Preserves subpaths (e.g. /jellyfin)
 */
export function normalizeServerUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new ConfigurationError('Server URL cannot be empty.');
  }

  // Check if string contains an explicit protocol scheme (e.g. https://, http://, ftp://, javascript:)
  const hasExplicitScheme =
    /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed) ||
    /^(javascript|data|mailto|blob|file|about):/i.test(trimmed);

  let withProtocol = trimmed;
  if (!hasExplicitScheme) {
    // If it looks like a local IP or localhost, default to http://, otherwise https://
    const isLocal =
      /^(localhost|127\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?(\/.*)?$/i.test(
        trimmed
      );
    withProtocol = isLocal ? `http://${trimmed}` : `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new ConfigurationError(`Invalid server URL: "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigurationError(
      `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are supported.`
    );
  }

  // Construct normalized URL without trailing slash
  let normalized = `${parsed.protocol}//${parsed.host}`;
  if (parsed.pathname && parsed.pathname !== '/') {
    // Remove trailing slashes from path
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    normalized += cleanPath;
  }

  return normalized;
}

/**
 * Safely constructs an absolute endpoint URL from a normalized server base URL and endpoint path.
 */
export function buildApiUrl(
  baseUrl: string,
  endpointPath: string,
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  const url = new URL(`${normalizedBase}${cleanEndpoint}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  return url.toString();
}

/**
 * Checks whether connecting to the given server URL from the current browser origin
 * would trigger a Mixed Content security block.
 */
export function isMixedContentRisk(serverUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const isPageHttps = window.location.protocol === 'https:';
  const isServerHttp = serverUrl.toLowerCase().startsWith('http://');
  const isServerLocalhost = serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1');

  // In browsers, HTTPS pages connecting to HTTP non-localhost triggers Mixed Content block
  return isPageHttps && isServerHttp && !isServerLocalhost;
}
