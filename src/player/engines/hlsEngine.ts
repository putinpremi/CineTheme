import type Hls from 'hls.js';
import type { ErrorData, Events } from 'hls.js';

export interface HlsEngineCallbacks {
  onManifestParsed?: () => void;
  onError?: (error: Error, isFatal: boolean) => void;
  onRecovering?: (attempt: number) => void;
}

export class HlsEngine {
  private hls: Hls | null = null;
  private video: HTMLVideoElement | null = null;
  private callbacks: HlsEngineCallbacks = {};
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryAttempts = 0;
  private isDestroyed = false;
  private readonly maxRecoveryAttempts = 3;
  private readonly backoffDelays = [500, 1500, 3000];

  public async attach(
    video: HTMLVideoElement,
    url: string,
    callbacks: HlsEngineCallbacks = {},
    startTimeSeconds = 0,
    token?: string
  ): Promise<void> {
    this.destroy();
    this.isDestroyed = false;
    this.video = video;
    this.callbacks = callbacks;
    this.recoveryAttempts = 0;

    try {
      // Dynamically load Hls.js on demand for MSE-based streaming (preferred for desktop, Chromium, Firefox, Android)
      const { default: HlsConstructor, Events: HlsEvents } = await import('hls.js');

      if (this.isDestroyed || !this.video) return;

      if (HlsConstructor.isSupported()) {
        this.initHlsJs(HlsConstructor, HlsEvents, url, startTimeSeconds, token);
        return;
      }
    } catch {
      // Fall through to native Apple HLS check below
    }

    // Fallback to Native Apple HLS (Safari on iOS where MSE is not supported)
    if (
      video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
      video.canPlayType('application/x-mpegURL') !== ''
    ) {
      video.src = url;
      if (startTimeSeconds > 0) {
        const onLoadedMetadata = () => {
          video.currentTime = startTimeSeconds;
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        video.addEventListener('loadedmetadata', onLoadedMetadata);
      }
      this.callbacks.onManifestParsed?.();
      return;
    }

    this.callbacks.onError?.(
      new Error('HLS streaming is not supported by this browser.'),
      true
    );
  }

  private initHlsJs(
    HlsConstructor: typeof Hls,
    HlsEvents: typeof Events,
    url: string,
    startTimeSeconds: number,
    token?: string
  ): void {
    if (!this.video) return;

    this.hls = new HlsConstructor({
      startPosition: startTimeSeconds > 0 ? startTimeSeconds : -1,
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 60,
      maxBufferLength: 60, // Maintain a healthy 60-second forward buffer to prevent transcode starvation
      maxMaxBufferLength: 120, // Buffer up to 120 seconds
      maxBufferSize: 128 * 1000 * 1000, // 128 MB max buffer memory
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 5,
      fragLoadingTimeOut: 30000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetryTimeout: 64000,
      xhrSetup: (xhr: XMLHttpRequest) => {
        if (token) {
          xhr.setRequestHeader('Authorization', `MediaBrowser Token="${token}"`);
          xhr.setRequestHeader('X-Emby-Token', token);
        }
      },
    });

    this.hls.attachMedia(this.video);

    this.hls.on(HlsEvents.MEDIA_ATTACHED, () => {
      this.hls?.loadSource(url);
    });

    this.hls.on(HlsEvents.MANIFEST_PARSED, () => {
      this.callbacks.onManifestParsed?.();
    });

    this.hls.on(HlsEvents.ERROR, (_event: Events.ERROR, data: ErrorData) => {
      if (data.fatal) {
        this.handleFatalHlsError(data);
      } else if (data.details === 'bufferStalledError') {
        // Non-fatal buffer stall: attempt stream nudge past timestamp micro-gap
        try {
          if (this.video && !this.video.paused) {
            this.video.currentTime += 0.1;
          }
        } catch {
          // Ignore
        }
      }
    });
  }

  private handleFatalHlsError(data: ErrorData): void {
    if (!this.hls) return;

    // Distinguish network vs media errors based on details
    if (data.details.includes('buffer') || data.details.includes('media')) {
      this.attemptMediaRecovery(data);
    } else {
      this.attemptNetworkRecovery(data);
    }
  }

  private attemptNetworkRecovery(data: ErrorData): void {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      this.destroy();
      this.callbacks.onError?.(
        new Error(`Exceeded maximum network recovery attempts (${data.details})`),
        true
      );
      return;
    }

    const delay = this.backoffDelays[this.recoveryAttempts] ?? 3000;
    this.recoveryAttempts++;
    this.callbacks.onRecovering?.(this.recoveryAttempts);

    this.clearTimer();
    this.recoveryTimer = setTimeout(() => {
      this.hls?.startLoad();
    }, delay);
  }

  private attemptMediaRecovery(data: ErrorData): void {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      this.destroy();
      this.callbacks.onError?.(
        new Error(`Exceeded maximum media error recovery attempts (${data.details})`),
        true
      );
      return;
    }

    this.recoveryAttempts++;
    this.callbacks.onRecovering?.(this.recoveryAttempts);

    try {
      this.hls?.recoverMediaError();
    } catch {
      this.destroy();
      this.callbacks.onError?.(
        new Error(`Failed to recover media decoder error (${data.details})`),
        true
      );
    }
  }

  private clearTimer(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clearTimer();
    if (this.hls) {
      try {
        this.hls.destroy();
      } catch {
        // Ignore Hls destruction error
      }
      this.hls = null;
    }
    this.video = null;
    this.callbacks = {};
    this.recoveryAttempts = 0;
  }
}
