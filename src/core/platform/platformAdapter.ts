import { Capacitor } from '@capacitor/core';

export type PlatformType = 'web' | 'pwa' | 'windows' | 'android' | 'android-tv';

export interface IPlatformAdapter {
  getPlatformType: () => PlatformType;
  getDeviceId: () => string;
  getDeviceName: () => string;
  isTouchDevice: () => boolean;
  isTVMode: () => boolean;
  isDesktop: () => boolean;
  isMobile: () => boolean;
  isNative: () => boolean;
  setTvModeOverride: (enabled: boolean | null) => void;
  getTvModeOverride: () => boolean | null;
}

const TV_UA_REGEX = /Android TV|Large Screen|GoogleTV|BRAVIA|AFT|Nexus Player|SHIELD Android TV|SmartTV|Tizen|Web0S/i;
const STORAGE_KEY_TV_OVERRIDE = 'cinetheme_tv_mode_override';

class UniversalPlatformAdapter implements IPlatformAdapter {
  private deviceId: string;
  private tvOverride: boolean | null = null;

  constructor() {
    this.deviceId = this.initDeviceId();
    this.tvOverride = this.initTvOverride();
  }

  private initDeviceId(): string {
    const KEY = 'cinetheme_device_id';
    try {
      const existing = localStorage.getItem(KEY);
      if (existing) return existing;
      const newId = `ct-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(KEY, newId);
      return newId;
    } catch {
      return `ct-${Math.random().toString(36).substring(2, 11)}`;
    }
  }

  private initTvOverride(): boolean | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TV_OVERRIDE);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
    } catch {
      // Storage unavailable
    }
    return null;
  }

  setTvModeOverride(enabled: boolean | null): void {
    this.tvOverride = enabled;
    try {
      if (enabled === null) {
        localStorage.removeItem(STORAGE_KEY_TV_OVERRIDE);
      } else {
        localStorage.setItem(STORAGE_KEY_TV_OVERRIDE, String(enabled));
      }
    } catch {
      // Ignore
    }
  }

  getTvModeOverride(): boolean | null {
    return this.tvOverride;
  }

  isTVMode(): boolean {
    if (this.tvOverride !== null) {
      return this.tvOverride;
    }

    if (typeof window === 'undefined') return false;

    // Check window flag
    if ((window as unknown as { __CINETHEME_TV_MODE__?: boolean }).__CINETHEME_TV_MODE__ === true) {
      return true;
    }

    // Check User-Agent for Android TV signatures
    if (typeof navigator !== 'undefined' && TV_UA_REGEX.test(navigator.userAgent)) {
      return true;
    }

    // Check 10-foot remote media query (no hover, no coarse/fine pointer on landscape display)
    if (
      window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: none) and (min-width: 960px)').matches
    ) {
      return true;
    }

    return false;
  }

  getPlatformType(): PlatformType {
    if (typeof window === 'undefined') return 'web';

    if (this.isTVMode()) {
      return 'android-tv';
    }

    // Capacitor Native Android Detection
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') return 'android';
    }

    // Tauri 2 Desktop Windows Detection
    if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
      return 'windows';
    }

    // Standalone PWA Detection
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return 'pwa';
    }

    return 'web';
  }

  isDesktop(): boolean {
    return this.getPlatformType() === 'windows';
  }

  isMobile(): boolean {
    const platform = this.getPlatformType();
    if (platform === 'android') return true;
    if (platform === 'android-tv') return false;
    return this.isTouchDevice();
  }

  isNative(): boolean {
    const platform = this.getPlatformType();
    return platform === 'windows' || platform === 'android' || platform === 'android-tv';
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Web Client';
    const platform = this.getPlatformType();
    if (platform === 'android-tv') return 'CineTheme Android TV';
    if (platform === 'android') return 'CineTheme Android Mobile';
    if (platform === 'windows') return 'CineTheme Windows Desktop';
    if (platform === 'pwa') return 'CineTheme PWA';
    return `${navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'}`;
  }

  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isTVMode()) return false;
    return 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  }
}

export const platformAdapter: IPlatformAdapter = new UniversalPlatformAdapter();
