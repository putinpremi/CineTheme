import { describe, it, expect } from 'vitest';
import { normalizeServerUrl, buildApiUrl, isMixedContentRisk } from '../../src/api/client/urlUtils';
import { ConfigurationError } from '../../src/core/errors/AppError';

describe('URL Normalization & Construction', () => {
  it('strips trailing slashes from domain root', () => {
    expect(normalizeServerUrl('https://jellyfin.example.com/')).toBe('https://jellyfin.example.com');
    expect(normalizeServerUrl('https://jellyfin.example.com///')).toBe('https://jellyfin.example.com');
  });

  it('preserves and normalizes subpaths', () => {
    expect(normalizeServerUrl('https://example.com/jellyfin/')).toBe('https://example.com/jellyfin');
    expect(normalizeServerUrl('https://example.com/media/jellyfin/')).toBe('https://example.com/media/jellyfin');
  });

  it('prepends protocol if missing', () => {
    expect(normalizeServerUrl('jellyfin.example.com')).toBe('https://jellyfin.example.com');
    expect(normalizeServerUrl('192.168.1.100:8096')).toBe('http://192.168.1.100:8096');
    expect(normalizeServerUrl('localhost:8096')).toBe('http://localhost:8096');
  });

  it('throws ConfigurationError for invalid or unsupported schemes', () => {
    expect(() => normalizeServerUrl('')).toThrow(ConfigurationError);
    expect(() => normalizeServerUrl('   ')).toThrow(ConfigurationError);
    expect(() => normalizeServerUrl('ftp://jellyfin.example.com')).toThrow(ConfigurationError);
    expect(() => normalizeServerUrl('javascript:alert(1)')).toThrow(ConfigurationError);
  });

  it('builds API URLs with path and query parameters', () => {
    const url = buildApiUrl('https://jellyfin.example.com/subpath', '/Users/AuthenticateByName', {
      format: 'json',
      limit: 10,
    });

    expect(url).toBe('https://jellyfin.example.com/subpath/Users/AuthenticateByName?format=json&limit=10');
  });

  it('detects mixed content risks when page is HTTPS and server is HTTP non-localhost', () => {
    // Under test environment (jsdom origin http://localhost:3000), simulate https
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:', href: 'https://cinetheme.app' },
      writable: true,
    });

    expect(isMixedContentRisk('http://192.168.1.50:8096')).toBe(true);
    expect(isMixedContentRisk('https://jellyfin.domain.com')).toBe(false);
    expect(isMixedContentRisk('http://localhost:8096')).toBe(false);
  });
});
