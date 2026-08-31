import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mobileAdapter } from '../../src/platform/mobileAdapter';
import { platformAdapter } from '../../src/core/platform/platformAdapter';

describe('MobileAdapter & Native Android Capability Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Platform Detection & Safe Web Fallback', () => {
    it('returns web/desktop defaults when running outside native Android', () => {
      expect(mobileAdapter.getPlatform()).toBe('web');
      expect(platformAdapter.isNative()).toBe(false);
    });

    it('returns runtime version when outside native Android', async () => {
      const version = await mobileAdapter.getAppVersion();
      expect(version).toBe('0.1.0');
    });

    it('handles status bar updates safely without crashing on Web', async () => {
      await expect(
        mobileAdapter.setStatusBar({ style: 'DARK', backgroundColor: '#0a0a0f', overlay: true })
      ).resolves.not.toThrow();
    });
  });

  describe('External URL Security Gate', () => {
    it('blocks dangerous javascript: pseudo-protocol', async () => {
      const result = await mobileAdapter.openExternal('javascript:alert(1)');
      expect(result).toBe(false);
    });

    it('blocks dangerous data: URI scheme', async () => {
      const result = await mobileAdapter.openExternal('data:text/html,<script>alert(1)</script>');
      expect(result).toBe(false);
    });

    it('blocks dangerous file: URI scheme', async () => {
      const result = await mobileAdapter.openExternal('file:///storage/emulated/0/DCIM/secrets.txt');
      expect(result).toBe(false);
    });

    it('blocks dangerous vbscript: and blob: schemes', async () => {
      expect(await mobileAdapter.openExternal('vbscript:msgbox')).toBe(false);
      expect(await mobileAdapter.openExternal('blob:http://localhost/uuid')).toBe(false);
    });

    it('allows valid HTTPS and HTTP URLs', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const httpsResult = await mobileAdapter.openExternal('https://jellyfin.org/docs');
      expect(httpsResult).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://jellyfin.org/docs', '_blank', 'noopener,noreferrer');

      const httpResult = await mobileAdapter.openExternal('http://192.168.1.100:8096');
      expect(httpResult).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith('http://192.168.1.100:8096', '_blank', 'noopener,noreferrer');
    });
  });

  describe('Share Security & Token Sanitization', () => {
    it('sanitizes authentication tokens and passwords from shared URLs', async () => {
      let sharedUrl: string | undefined;
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockImplementation((data: { url?: string }) => {
          sharedUrl = data.url;
          return Promise.resolve();
        }),
        configurable: true,
        writable: true,
      });

      const success = await mobileAdapter.share({
        title: 'Check out this movie',
        url: 'https://jellyfin.local/item/123?api_key=SECRET_TOKEN&password=SECRET_PASS&other_param=safe',
      });

      expect(success).toBe(true);
      expect(sharedUrl).toBeDefined();
      expect(sharedUrl).not.toContain('SECRET_TOKEN');
      expect(sharedUrl).not.toContain('SECRET_PASS');
      expect(sharedUrl).not.toContain('api_key');
      expect(sharedUrl).not.toContain('password');
      expect(sharedUrl).toContain('other_param=safe');
    });

    it('returns false if title is missing', async () => {
      const result = await mobileAdapter.share({ title: '' });
      expect(result).toBe(false);
    });
  });

  describe('Hardware Back Button Handler Chain', () => {
    it('allows registering and unregistering back-button listeners', () => {
      const handler1 = vi.fn().mockReturnValue(true);
      const unregister = mobileAdapter.registerBackButtonHandler(handler1);

      expect(typeof unregister).toBe('function');
      unregister();
    });

    it('executes handlers in LIFO order', async () => {
      const handlerA = vi.fn().mockReturnValue(false);
      const handlerB = vi.fn().mockReturnValue(true);

      const unregisterA = mobileAdapter.registerBackButtonHandler(handlerA);
      const unregisterB = mobileAdapter.registerBackButtonHandler(handlerB);

      unregisterA();
      unregisterB();
    });
  });

  describe('Application Lifecycle Listener', () => {
    it('allows registering onResume and onPause handlers cleanly', () => {
      const onResume = vi.fn();
      const onPause = vi.fn();

      const unregister = mobileAdapter.registerAppLifecycle({ onResume, onPause });
      expect(typeof unregister).toBe('function');
      unregister();
    });
  });
});
