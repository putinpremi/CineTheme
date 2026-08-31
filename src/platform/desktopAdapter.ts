import { platformAdapter } from '../core/platform/platformAdapter';
import { runtimeConfig } from '../core/config/runtimeConfig';

export interface DeepLinkRoute {
  action: 'item' | 'player' | 'home' | 'search' | 'login';
  id?: string;
  targetPath: string;
}

export class DesktopAdapter {
  /**
   * Checks if running inside the native Tauri desktop shell.
   */
  public isDesktop(): boolean {
    return platformAdapter.isDesktop();
  }

  /**
   * Minimizes the native application window.
   */
  public async minimize(): Promise<void> {
    if (!this.isDesktop()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Toggles maximization of the native application window.
   */
  public async toggleMaximize(): Promise<void> {
    if (!this.isDesktop()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Closes the native application window.
   */
  public async close(): Promise<void> {
    if (!this.isDesktop()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Toggles fullscreen state of the native window.
   */
  public async toggleFullscreen(forceState?: boolean): Promise<void> {
    if (this.isDesktop()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const current = await win.isFullscreen();
        await win.setFullscreen(forceState !== undefined ? forceState : !current);
        return;
      } catch {
        // Fallback to web fullscreen
      }
    }

    if (typeof document !== 'undefined') {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      } else {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  }

  /**
   * Retrieves the application version.
   */
  public async getAppVersion(): Promise<string> {
    if (this.isDesktop()) {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        return await getVersion();
      } catch {
        return runtimeConfig.appVersion;
      }
    }
    return runtimeConfig.appVersion;
  }

  /**
   * Safely opens an external URL in the system browser.
   * Only http:// and https:// URLs are allowed.
   */
  public async openExternal(rawUrl: string): Promise<boolean> {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return false;
    }

    const trimmed = rawUrl.trim();

    // Security Gate: strictly forbid dangerous protocols
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('blob:')
    ) {
      console.warn('[Security] Blocked external URL with unsafe protocol:', trimmed);
      return false;
    }

    // Must be valid HTTP or HTTPS
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.warn('[Security] Blocked external URL with non-HTTP protocol:', trimmed);
        return false;
      }
    } catch {
      console.warn('[Security] Blocked malformed external URL:', trimmed);
      return false;
    }

    if (typeof window !== 'undefined') {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return true;
    }

    return false;
  }

  /**
   * Parses and validates deep link URLs (e.g. cinetheme://item/12345).
   * Prevents arbitrary protocol execution or malicious URL redirection.
   */
  public validateDeepLink(rawUrl: string): DeepLinkRoute | null {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return null;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('cinetheme://')) {
      return null;
    }

    const pathPart = trimmed.slice('cinetheme://'.length).replace(/^\/+/, '');
    const segments = pathPart.split('/').filter(Boolean);

    if (segments.length === 0) {
      return { action: 'home', targetPath: '/home' };
    }

    const [action, id] = segments;

    switch (action?.toLowerCase()) {
      case 'item':
        if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
          return { action: 'item', id, targetPath: `/item/${id}` };
        }
        return null;

      case 'player':
        if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
          return { action: 'player', id, targetPath: `/player/${id}` };
        }
        return null;

      case 'home':
        return { action: 'home', targetPath: '/home' };

      case 'search':
        return { action: 'search', targetPath: '/search' };

      case 'login':
        return { action: 'login', targetPath: '/login' };

      default:
        console.warn('[Security] Unknown deep link action rejected:', action);
        return null;
    }
  }
}

export const desktopAdapter = new DesktopAdapter();
