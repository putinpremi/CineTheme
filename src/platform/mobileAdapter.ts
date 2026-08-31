import { platformAdapter, type PlatformType } from '../core/platform/platformAdapter';
import { runtimeConfig } from '../core/config/runtimeConfig';

export interface StatusBarOptions {
  style?: 'DARK' | 'LIGHT';
  backgroundColor?: string;
  overlay?: boolean;
}

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
}

export class MobileAdapter {
  private backButtonListeners: Array<() => boolean | Promise<boolean>> = [];
  private isBackButtonBound = false;

  public isMobile(): boolean {
    return platformAdapter.isMobile();
  }

  public isNative(): boolean {
    return platformAdapter.isNative();
  }

  public isTV(): boolean {
    return platformAdapter.isTVMode();
  }

  public getPlatform(): PlatformType {
    return platformAdapter.getPlatformType();
  }

  public async getAppVersion(): Promise<string> {
    const platform = this.getPlatform();
    if (platform === 'android' || platform === 'android-tv') {
      try {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        return info.version || runtimeConfig.appVersion;
      } catch {
        return runtimeConfig.appVersion;
      }
    }
    return runtimeConfig.appVersion;
  }

  /**
   * Configures status bar styling and full-bleed overlay in native Android.
   */
  public async setStatusBar(options: StatusBarOptions): Promise<void> {
    const platform = this.getPlatform();
    if (platform === 'android' || platform === 'android-tv') {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        if (options.style) {
          await StatusBar.setStyle({
            style: options.style === 'LIGHT' ? Style.Light : Style.Dark,
          });
        }
        if (options.backgroundColor) {
          await StatusBar.setBackgroundColor({
            color: options.backgroundColor,
          });
        }
        if (options.overlay !== undefined) {
          await StatusBar.setOverlaysWebView({
            overlay: options.overlay,
          });
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  /**
   * Triggers native sharing or Web Share API.
   * Ensures tokens or authenticated URLs are never leaked.
   */
  public async share(options: ShareOptions): Promise<boolean> {
    if (!options.title) return false;

    // Security Gate: Sanitize URL to ensure no credentials or tokens are embedded
    let sanitizedUrl = options.url;
    if (sanitizedUrl) {
      try {
        const parsed = new URL(sanitizedUrl);
        parsed.searchParams.delete('api_key');
        parsed.searchParams.delete('token');
        parsed.searchParams.delete('Token');
        parsed.searchParams.delete('password');
        sanitizedUrl = parsed.toString();
      } catch {
        // Not a URL or invalid
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: sanitizedUrl,
        });
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Registers a hardware back-button handler.
   * Handlers are executed in reverse registration order (most recently registered first).
   */
  public registerBackButtonHandler(handler: () => boolean | Promise<boolean>): () => void {
    this.backButtonListeners.push(handler);
    this.ensureBackButtonListener();

    return () => {
      this.backButtonListeners = this.backButtonListeners.filter((h) => h !== handler);
    };
  }

  private async ensureBackButtonListener() {
    const platform = this.getPlatform();
    const isAndroid = platform === 'android' || platform === 'android-tv';
    if (this.isBackButtonBound || !isAndroid) return;
    this.isBackButtonBound = true;

    try {
      const { App } = await import('@capacitor/app');
      App.addListener('backButton', async (event) => {
        // Iterate through registered handlers in LIFO order
        for (let i = this.backButtonListeners.length - 1; i >= 0; i--) {
          const handler = this.backButtonListeners[i];
          if (handler) {
            const handled = await handler();
            if (handled) return;
          }
        }

        // Default navigation fallback
        if (event.canGoBack && typeof window !== 'undefined') {
          window.history.back();
        } else {
          // If no route history to pop, exit application cleanly
          await App.exitApp();
        }
      });
    } catch {
      // Fallback
    }
  }

  /**
   * Registers application lifecycle listeners (pause, resume).
   */
  public registerAppLifecycle(handlers: { onResume?: () => void; onPause?: () => void }): () => void {
    let cleanup: (() => void) | null = null;
    const platform = this.getPlatform();

    if (platform === 'android' || platform === 'android-tv') {
      import('@capacitor/app')
        .then(({ App }) => {
          const listener = App.addListener('appStateChange', (state) => {
            if (state.isActive) {
              handlers.onResume?.();
            } else {
              handlers.onPause?.();
            }
          });

          cleanup = () => {
            listener.then((handle) => handle.remove()).catch(() => {});
          };
        })
        .catch(() => {});
    }

    return () => {
      cleanup?.();
    };
  }

  /**
   * Safely opens an external URL in the system browser.
   * Only http:// and https:// URLs are allowed.
   */
  public async openExternal(rawUrl: string): Promise<boolean> {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
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
}

export const mobileAdapter = new MobileAdapter();
