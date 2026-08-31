import { describe, it, expect, beforeEach } from 'vitest';
import { platformAdapter } from '../../src/core/platform/platformAdapter';

describe('Android TV & Platform Detection', () => {
  beforeEach(() => {
    localStorage.clear();
    platformAdapter.setTvModeOverride(null);
    delete (window as unknown as { __CINETHEME_TV_MODE__?: boolean }).__CINETHEME_TV_MODE__;
  });

  it('detects standard Web environment by default', () => {
    expect(platformAdapter.getPlatformType()).toBe('web');
    expect(platformAdapter.isTVMode()).toBe(false);
    expect(platformAdapter.isDesktop()).toBe(false);
  });

  it('detects Android TV from user-agent signatures', () => {
    const originalUA = navigator.userAgent;

    // Test Android TV user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; BRAVIA 4K Build/URG2) AppleWebKit/537.36 Android TV Large Screen',
      configurable: true,
    });

    expect(platformAdapter.isTVMode()).toBe(true);
    expect(platformAdapter.getPlatformType()).toBe('android-tv');
    expect(platformAdapter.getDeviceName()).toBe('CineTheme Android TV');

    // Restore
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('detects NVIDIA SHIELD Android TV signature', () => {
    const originalUA = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 11; SHIELD Android TV Build/RQ1A) AppleWebKit/537.36',
      configurable: true,
    });

    expect(platformAdapter.isTVMode()).toBe(true);
    expect(platformAdapter.getPlatformType()).toBe('android-tv');

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('distinguishes standard Android mobile from Android TV', () => {
    const originalUA = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 Mobile Safari/537.36',
      configurable: true,
    });

    expect(platformAdapter.isTVMode()).toBe(false);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('supports explicit TV mode overrides via settings', () => {
    platformAdapter.setTvModeOverride(true);
    expect(platformAdapter.isTVMode()).toBe(true);
    expect(platformAdapter.getPlatformType()).toBe('android-tv');

    platformAdapter.setTvModeOverride(false);
    expect(platformAdapter.isTVMode()).toBe(false);
    expect(platformAdapter.getPlatformType()).toBe('web');

    platformAdapter.setTvModeOverride(null);
  });

  it('detects global window TV flag', () => {
    (window as unknown as { __CINETHEME_TV_MODE__?: boolean }).__CINETHEME_TV_MODE__ = true;
    expect(platformAdapter.isTVMode()).toBe(true);
    expect(platformAdapter.getPlatformType()).toBe('android-tv');
  });
});
