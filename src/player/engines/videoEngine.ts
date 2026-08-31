export interface VideoEngineCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number, buffered: number) => void;
  onStateChange?: (isPlaying: boolean, isPaused: boolean, isBuffering: boolean) => void;
  onSeeking?: () => void;
  onSeeked?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onVolumeChange?: (volume: number, isMuted: boolean) => void;
}

export class VideoEngine {
  private video: HTMLVideoElement | null = null;
  private callbacks: VideoEngineCallbacks = {};
  private pendingStartTime = 0;

  public attach(video: HTMLVideoElement, callbacks: VideoEngineCallbacks = {}): void {
    this.detach();
    this.video = video;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  public detach(): void {
    if (this.video) {
      this.unbindEvents();
      this.video = null;
    }
  }

  public setSource(url: string, startTimeSeconds = 0): void {
    if (!this.video) return;

    this.pendingStartTime = startTimeSeconds;
    this.video.src = url;
    if (typeof this.video.load === 'function') {
      this.video.load();
    }
  }

  public async play(): Promise<void> {
    if (!this.video) return;
    try {
      const promise = this.video.play();
      if (promise && typeof promise.then === 'function') {
        await promise;
      }
    } catch (err) {
      // Browsers reject play() if user has not interacted, or in headless JSDOM environments
      if (
        err instanceof Error &&
        err.name !== 'AbortError' &&
        err.name !== 'NotSupportedError' &&
        !err.message.includes('Not implemented')
      ) {
        this.callbacks.onError?.(err);
      }
    }
  }

  public pause(): void {
    if (!this.video) return;
    try {
      this.video.pause();
    } catch {
      // Ignore pause failure
    }
  }

  public seek(seconds: number): void {
    if (!this.video) return;
    const target = Math.max(0, Math.min(this.video.duration || Infinity, seconds));
    this.video.currentTime = target;
  }

  public setVolume(volume: number): void {
    if (!this.video) return;
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  public setMuted(muted: boolean): void {
    if (!this.video) return;
    this.video.muted = muted;
  }

  public getCurrentTime(): number {
    return this.video?.currentTime ?? 0;
  }

  public getDuration(): number {
    return this.video?.duration ?? 0;
  }

  public isPaused(): boolean {
    return this.video?.paused ?? true;
  }

  private handleTimeUpdate = (): void => {
    if (!this.video) return;

    const currentTime = this.video.currentTime;
    const duration = this.video.duration || 0;
    let buffered = 0;

    if (this.video.buffered && this.video.buffered.length > 0) {
      for (let i = 0; i < this.video.buffered.length; i++) {
        if (
          this.video.buffered.start(i) <= currentTime &&
          currentTime <= this.video.buffered.end(i)
        ) {
          buffered = this.video.buffered.end(i);
          break;
        }
      }
    }

    this.callbacks.onTimeUpdate?.(currentTime, duration, buffered);
  };

  private handleCanPlay = (): void => {
    if (this.pendingStartTime > 0 && this.video) {
      this.video.currentTime = this.pendingStartTime;
      this.pendingStartTime = 0;
    }
    this.callbacks.onStateChange?.(true, false, false);
  };

  private handlePlaying = (): void => {
    this.callbacks.onStateChange?.(true, false, false);
  };

  private handleWaiting = (): void => {
    this.callbacks.onStateChange?.(false, this.video?.paused ?? true, true);
  };

  private handlePause = (): void => {
    this.callbacks.onStateChange?.(false, true, false);
  };

  private handleSeeking = (): void => {
    this.callbacks.onSeeking?.();
  };

  private handleSeeked = (): void => {
    if (this.video) {
      this.callbacks.onSeeked?.(this.video.currentTime);
    }
  };

  private handleEnded = (): void => {
    this.callbacks.onEnded?.();
  };

  private handleError = (): void => {
    const mediaError = this.video?.error;
    const message = mediaError?.message || `HTML5 Video Error code: ${mediaError?.code || 'unknown'}`;
    this.callbacks.onError?.(new Error(message));
  };

  private handleVolumeChange = (): void => {
    if (this.video) {
      this.callbacks.onVolumeChange?.(this.video.volume, this.video.muted);
    }
  };

  private bindEvents(): void {
    if (!this.video) return;
    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
    this.video.addEventListener('canplay', this.handleCanPlay);
    this.video.addEventListener('playing', this.handlePlaying);
    this.video.addEventListener('waiting', this.handleWaiting);
    this.video.addEventListener('stalled', this.handleWaiting);
    this.video.addEventListener('pause', this.handlePause);
    this.video.addEventListener('seeking', this.handleSeeking);
    this.video.addEventListener('seeked', this.handleSeeked);
    this.video.addEventListener('ended', this.handleEnded);
    this.video.addEventListener('error', this.handleError);
    this.video.addEventListener('volumechange', this.handleVolumeChange);
  }

  private unbindEvents(): void {
    if (!this.video) return;
    this.video.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.video.removeEventListener('canplay', this.handleCanPlay);
    this.video.removeEventListener('playing', this.handlePlaying);
    this.video.removeEventListener('waiting', this.handleWaiting);
    this.video.removeEventListener('stalled', this.handleWaiting);
    this.video.removeEventListener('pause', this.handlePause);
    this.video.removeEventListener('seeking', this.handleSeeking);
    this.video.removeEventListener('seeked', this.handleSeeked);
    this.video.removeEventListener('ended', this.handleEnded);
    this.video.removeEventListener('error', this.handleError);
    this.video.removeEventListener('volumechange', this.handleVolumeChange);
  }

  public destroy(): void {
    this.detach();
    this.callbacks = {};
  }
}
