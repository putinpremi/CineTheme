import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Web & PWA Production Distribution Assets & Configuration', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const publicDir = path.join(rootDir, 'public');
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');
  const swPath = path.join(publicDir, 'sw.js');
  const robotsPath = path.join(publicDir, 'robots.txt');
  const redirectsPath = path.join(publicDir, '_redirects');
  const headersPath = path.join(publicDir, '_headers');
  const indexHtmlPath = path.join(rootDir, 'index.html');

  it('provides a valid PWA Web App Manifest', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('CineTheme');
    expect(manifest.short_name).toBe('CineTheme');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('configures Service Worker with strict Jellyfin bypass and asset caching rules', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Caching strategies
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('PRECACHE_ASSETS');
    expect(swContent).toContain('SKIP_WAITING');

    // Jellyfin auth/media bypass
    expect(swContent).toContain('/Users/');
    expect(swContent).toContain('/Items/');
    expect(swContent).toContain('.m3u8');
    expect(swContent).toContain('.wasm');
  });

  it('provides robots.txt protecting private authenticated media routes', () => {
    expect(fs.existsSync(robotsPath)).toBe(true);
    const robots = fs.readFileSync(robotsPath, 'utf-8');

    expect(robots).toContain('Disallow: /player/');
    expect(robots).toContain('Disallow: /item/');
    expect(robots).toContain('Allow: /');
  });

  it('provides SPA fallback routing in _redirects', () => {
    expect(fs.existsSync(redirectsPath)).toBe(true);
    const redirects = fs.readFileSync(redirectsPath, 'utf-8');

    expect(redirects).toContain('/index.html');
    expect(redirects).toContain('200');
  });

  it('specifies production security and caching headers in _headers', () => {
    expect(fs.existsSync(headersPath)).toBe(true);
    const headers = fs.readFileSync(headersPath, 'utf-8');

    expect(headers).toContain('Content-Security-Policy');
    expect(headers).toContain('wasm-unsafe-eval');
    expect(headers).toContain('Cross-Origin-Opener-Policy');
    expect(headers).toContain('Cross-Origin-Embedder-Policy');
    expect(headers).toContain('max-age=31536000');
    expect(headers).toContain('/sw.js');
  });

  it('configures index.html with meta tags and manifest links', () => {
    expect(fs.existsSync(indexHtmlPath)).toBe(true);
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('rel="icon"');
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('name="viewport"');
  });
});
