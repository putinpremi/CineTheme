import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { desktopAdapter } from '../../src/platform/desktopAdapter';
import { platformAdapter } from '../../src/core/platform/platformAdapter';

describe('DesktopAdapter & Native Capability Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Platform Detection & Safe Fallback', () => {
    it('correctly reports desktop false in standard browser environment', () => {
      expect(desktopAdapter.isDesktop()).toBe(false);
      expect(platformAdapter.isDesktop()).toBe(false);
    });

    it('returns runtime version when outside Tauri', async () => {
      const version = await desktopAdapter.getAppVersion();
      expect(version).toBe('0.1.0');
    });

    it('falls back to web Fullscreen API when outside Tauri', async () => {
      const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: requestFullscreenMock,
        configurable: true,
        writable: true,
      });

      await desktopAdapter.toggleFullscreen();
      expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('External URL Security Gate', () => {
    it('blocks dangerous javascript: pseudo-protocol', async () => {
      const result = await desktopAdapter.openExternal('javascript:alert(1)');
      expect(result).toBe(false);
    });

    it('blocks dangerous data: URI scheme', async () => {
      const result = await desktopAdapter.openExternal('data:text/html,<script>alert(1)</script>');
      expect(result).toBe(false);
    });

    it('blocks dangerous file: URI scheme', async () => {
      const result = await desktopAdapter.openExternal('file:///C:/Windows/System32/calc.exe');
      expect(result).toBe(false);
    });

    it('blocks dangerous vbscript: and blob: schemes', async () => {
      expect(await desktopAdapter.openExternal('vbscript:msgbox')).toBe(false);
      expect(await desktopAdapter.openExternal('blob:http://localhost/uuid')).toBe(false);
    });

    it('allows valid HTTPS and HTTP URLs', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const httpsResult = await desktopAdapter.openExternal('https://jellyfin.org/docs');
      expect(httpsResult).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://jellyfin.org/docs', '_blank', 'noopener,noreferrer');

      const httpResult = await desktopAdapter.openExternal('http://192.168.1.50:8096');
      expect(httpResult).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.50:8096', '_blank', 'noopener,noreferrer');
    });
  });

  describe('Deep Link Security Validation', () => {
    it('parses valid item deep link with alphanumeric ID', () => {
      const route = desktopAdapter.validateDeepLink('cinetheme://item/movie-guid-12345');
      expect(route).toEqual({
        action: 'item',
        id: 'movie-guid-12345',
        targetPath: '/item/movie-guid-12345',
      });
    });

    it('parses valid player deep link', () => {
      const route = desktopAdapter.validateDeepLink('cinetheme://player/ep_999');
      expect(route).toEqual({
        action: 'player',
        id: 'ep_999',
        targetPath: '/player/ep_999',
      });
    });

    it('parses home, search, and login deep links', () => {
      expect(desktopAdapter.validateDeepLink('cinetheme://home')).toEqual({
        action: 'home',
        targetPath: '/home',
      });
      expect(desktopAdapter.validateDeepLink('cinetheme://search')).toEqual({
        action: 'search',
        targetPath: '/search',
      });
      expect(desktopAdapter.validateDeepLink('cinetheme://login')).toEqual({
        action: 'login',
        targetPath: '/login',
      });
    });

    it('rejects path traversal or illegal characters in item ID', () => {
      expect(desktopAdapter.validateDeepLink('cinetheme://item/../../etc/passwd')).toBeNull();
      expect(desktopAdapter.validateDeepLink('cinetheme://item/<script>')).toBeNull();
      expect(desktopAdapter.validateDeepLink('cinetheme://item/id with spaces')).toBeNull();
    });

    it('rejects non-cinetheme schemes', () => {
      expect(desktopAdapter.validateDeepLink('http://jellyfin.org')).toBeNull();
      expect(desktopAdapter.validateDeepLink('file:///path/to/file')).toBeNull();
      expect(desktopAdapter.validateDeepLink('')).toBeNull();
    });
  });
});
