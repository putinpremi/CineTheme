import { VideoEngine } from './engines/videoEngine';
import { HlsEngine } from './engines/hlsEngine';
import { WebVttEngine } from './subtitles/webVttEngine';
import { JassubEngine } from './subtitles/jassubEngine';
import { PlaybackTelemetry } from './telemetry/playbackTelemetry';
import { playbackService } from '../api/services/playbackService';
import { selectMediaSource } from './mediaSourceSelector';
import { usePlayerStore } from '../state/stores/usePlayerStore';
import { usePlaybackPreferencesStore } from '../state/stores/usePlaybackPreferencesStore';
import { AppError } from '../core/errors/AppError';
import type { PlaybackQuality, PlaybackSource } from '../domain/player/types';

export interface PlayerControllerInitOptions {
  serverUrl: string;
  userId: string;
  token: string;
  onUnauthorized?: () => void;
}

export interface LoadMediaOptions {
  startTimeSeconds?: number;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  maxStreamingBitrate?: number;
  autoPlay?: boolean;
}

export class PlayerController {
  private videoEngine = new VideoEngine();
  private hlsEngine = new HlsEngine();
  private webVttEngine = new WebVttEngine();
  private jassubEngine = new JassubEngine();
  private telemetry = new PlaybackTelemetry();

  private videoElement: HTMLVideoElement | null = null;
  private config: PlayerControllerInitOptions | null = null;
  private currentSource: PlaybackSource | null = null;
  private abortController: AbortController | null = null;
  private audioContext: AudioContext | null = null;
  private delayNode: DelayNode | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;

  public initialize(videoElement: HTMLVideoElement, config: PlayerControllerInitOptions): void {
    this.destroy();
    this.videoElement = videoElement;
    this.config = config;

    this.videoEngine.attach(videoElement, {
      onTimeUpdate: (currentTime, duration, buffered) => {
        usePlayerStore.getState().setTime(currentTime, duration, buffered);
        this.telemetry.reportProgress(
          currentTime,
          this.videoEngine.isPaused(),
          videoElement.muted,
          videoElement.volume
        );
      },
      onStateChange: (isPlaying, isPaused, isBuffering) => {
        if (isBuffering) {
          usePlayerStore.getState().setPlayerState('BUFFERING');
        } else if (isPlaying) {
          usePlayerStore.getState().setPlayerState('PLAYING');
        } else if (isPaused) {
          usePlayerStore.getState().setPlayerState('PAUSED');
        }
      },
      onSeeking: () => {
        usePlayerStore.getState().setPlayerState('SEEKING');
      },
      onSeeked: (currentTime) => {
        this.telemetry.reportSeek(
          currentTime,
          this.videoEngine.isPaused(),
          videoElement.muted,
          videoElement.volume
        );
      },
      onEnded: () => {
        usePlayerStore.getState().setPlayerState('ENDED');
      },
      onError: (err) => {
        usePlayerStore.getState().setError({
          code: 'VIDEO_ELEMENT_ERROR',
          message: err.message || 'Media element error occurred during playback.',
          isFatal: true,
          details: err,
        });
      },
      onVolumeChange: (volume, isMuted) => {
        usePlayerStore.getState().setVolume(volume, isMuted);
      },
    });
  }

  public async loadMedia(itemId: string, options: LoadMediaOptions = {}): Promise<void> {
    if (!this.config || !this.videoElement) {
      throw new AppError('PlayerController must be initialized before loading media.', {
        code: 'CONFIGURATION_ERROR',
        statusCode: 500,
      });
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    const store = usePlayerStore.getState();
    store.setPlayerState('NEGOTIATING');
    store.setError(null);

    const startTimeTicks =
      typeof options.startTimeSeconds === 'number' && options.startTimeSeconds > 0
        ? Math.round(options.startTimeSeconds * 10_000_000)
        : undefined;

    try {
      const playbackInfo = await playbackService.getPlaybackInfo(
        this.config.serverUrl,
        this.config.userId,
        this.config.token,
        itemId,
        {
          startTimeTicks,
          audioStreamIndex: options.audioStreamIndex,
          subtitleStreamIndex: options.subtitleStreamIndex,
          maxStreamingBitrate: options.maxStreamingBitrate,
        },
        this.abortController.signal
      );

      const prefs = usePlaybackPreferencesStore.getState();
      const source = selectMediaSource({
        serverUrl: this.config.serverUrl,
        itemId,
        token: this.config.token,
        playbackInfo,
        preferredAudioStreamIndex: options.audioStreamIndex,
        preferredSubtitleStreamIndex: options.subtitleStreamIndex,
        preferences: prefs,
        startPositionSeconds: options.startTimeSeconds || 0,
      });

      this.currentSource = source;

      store.setSession({
        itemId,
        mediaSourceId: source.mediaSourceId,
        playSessionId: source.playSessionId,
        playbackMode: source.playbackMode,
        duration: source.totalDurationSeconds,
        audioTracks: source.audioTracks,
        subtitleTracks: source.subtitleTracks,
        activeAudioIndex: source.currentAudioIndex,
        activeSubtitleIndex: source.currentSubtitleIndex,
        initialTime: options.startTimeSeconds || 0,
      });

      this.attachEnginesAndSource(source, options.startTimeSeconds || 0);

      await this.telemetry.startSession({
        serverUrl: this.config.serverUrl,
        token: this.config.token,
        itemId,
        mediaSourceId: source.mediaSourceId,
        playSessionId: source.playSessionId,
        playMethod: source.playMethod,
        audioIndex: source.currentAudioIndex,
        subtitleIndex: source.currentSubtitleIndex,
        initialPositionSeconds: options.startTimeSeconds || 0,
        isMuted: this.videoElement.muted,
        volume: this.videoElement.volume,
        onUnauthorized: this.config.onUnauthorized,
      });

      if (options.autoPlay) {
        await this.videoEngine.play();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const appError =
        err instanceof AppError
          ? err
          : new AppError(
              (err as Error)?.message || 'Failed to negotiate media playback.',
              { code: 'PLAYBACK_ERROR', statusCode: 500, details: err }
            );

      store.setError({
        code: appError.code,
        message: appError.message,
        isFatal: true,
        details: err,
      });

      if (appError.statusCode === 401 || appError.code === 'AUTH_UNAUTHORIZED') {
        this.config.onUnauthorized?.();
      }
    }
  }

  private attachEnginesAndSource(source: PlaybackSource, startTimeSeconds: number): void {
    if (!this.videoElement) return;

    this.hlsEngine.destroy();
    this.webVttEngine.detach();
    this.jassubEngine.destroy();

    if (source.playbackMode === 'DIRECT_PLAY') {
      this.videoEngine.setSource(source.url, startTimeSeconds);
    } else {
      this.hlsEngine.attach(
        this.videoElement,
        source.url,
        {
          onManifestParsed: () => {
            usePlayerStore.getState().setPlayerState('READY');
          },
          onRecovering: (_attempt) => {
            usePlayerStore.getState().setPlayerState('RECOVERING');
          },
          onError: (err, isFatal) => {
            if (isFatal) {
              usePlayerStore.getState().setError({
                code: 'HLS_STREAM_ERROR',
                message: err.message || 'Fatal HLS streaming error.',
                isFatal: true,
                details: err,
              });
            }
          },
        },
        startTimeSeconds,
        this.config?.token
      );
    }

    this.applyActiveSubtitle(source);
  }

  private applyActiveSubtitle(source: PlaybackSource): void {
    if (!this.videoElement || typeof source.currentSubtitleIndex !== 'number') {
      this.webVttEngine.detach();
      this.jassubEngine.destroy();
      return;
    }

    const subTrack = source.subtitleTracks.find((s) => s.index === source.currentSubtitleIndex);
    if (!subTrack || !subTrack.deliveryUrl) return;

    const offsetSeconds = usePlayerStore.getState().subtitleDelayMs / 1000;

    if (subTrack.codec.includes('ass') || subTrack.codec.includes('ssa')) {
      this.webVttEngine.detach();
      this.jassubEngine.attach({
        video: this.videoElement,
        subUrl: subTrack.deliveryUrl,
        timeOffset: offsetSeconds,
        fontAttachments: source.fontAttachments,
      });
    } else {
      this.jassubEngine.destroy();
      this.webVttEngine.attach(
        this.videoElement,
        subTrack.deliveryUrl,
        subTrack.language || 'en',
        subTrack.displayTitle || 'Subtitles',
        offsetSeconds
      );
    }
  }

  private applyAudioDelay(delayMs: number): void {
    if (!this.videoElement || typeof window === 'undefined') return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (!this.delayNode) {
        this.delayNode = this.audioContext.createDelay(5.0);
        if (!this.mediaElementSource) {
          this.mediaElementSource = this.audioContext.createMediaElementSource(this.videoElement);
        }
        this.mediaElementSource.connect(this.delayNode);
        this.delayNode.connect(this.audioContext.destination);
      }

      const delaySeconds = Math.max(0, delayMs / 1000);
      this.delayNode.delayTime.setValueAtTime(delaySeconds, this.audioContext.currentTime);
    } catch {
      // Graceful fallback if Web Audio is restricted or already routed
    }
  }

  public async play(): Promise<void> {
    await this.videoEngine.play();
  }

  public pause(): void {
    this.videoEngine.pause();
  }

  public togglePlay(): void {
    if (this.videoEngine.isPaused()) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seek(seconds: number): void {
    this.videoEngine.seek(seconds);
  }

  public seekRelative(deltaSeconds: number): void {
    const current = this.videoEngine.getCurrentTime();
    this.seek(current + deltaSeconds);
  }

  public setVolume(volume: number): void {
    this.videoEngine.setVolume(volume);
  }

  public adjustVolume(delta: number): void {
    const current = usePlayerStore.getState().volume;
    this.setVolume(Math.max(0, Math.min(1, current + delta)));
  }

  public setMuted(muted: boolean): void {
    this.videoEngine.setMuted(muted);
  }

  public toggleMute(): void {
    if (this.videoElement) {
      this.setMuted(!this.videoElement.muted);
    }
  }

  public setAudioDelay(ms: number): void {
    const clamped = Math.max(-5000, Math.min(5000, ms));
    usePlayerStore.getState().setAudioDelayMs(clamped);
    this.applyAudioDelay(clamped);
  }

  public setSubtitleDelay(ms: number): void {
    const clamped = Math.max(-5000, Math.min(5000, ms));
    usePlayerStore.getState().setSubtitleDelayMs(clamped);
    this.jassubEngine.setTimeOffset(clamped / 1000);
    this.webVttEngine.setTimeOffset(clamped / 1000);
  }

  public setPlaybackSpeed(rate: number): void {
    const clamped = Math.max(0.25, Math.min(3.0, rate));
    usePlayerStore.getState().setPlaybackRate(clamped);
    this.videoEngine.setPlaybackRate(clamped);
  }

  public async setQuality(quality: PlaybackQuality | null): Promise<void> {
    const itemId = usePlayerStore.getState().itemId;
    if (!itemId) return;

    usePlayerStore.getState().setSelectedQuality(quality);
    const currentTime = this.videoEngine.getCurrentTime();
    const isPaused = this.videoEngine.isPaused();

    await this.loadMedia(itemId, {
      startTimeSeconds: currentTime,
      audioStreamIndex: usePlayerStore.getState().activeAudioIndex ?? undefined,
      subtitleStreamIndex: usePlayerStore.getState().activeSubtitleIndex ?? undefined,
      maxStreamingBitrate: quality?.maxBitrate,
      autoPlay: !isPaused,
    });
  }

  public async setAudioTrack(index: number): Promise<void> {
    if (!this.currentSource || !this.currentSource.audioTracks.some((a) => a.index === index)) {
      return;
    }
    const currentTime = this.videoEngine.getCurrentTime();
    const isPaused = this.videoEngine.isPaused();

    usePlayerStore.getState().setActiveAudioIndex(index);
    if (this.currentSource) {
      await this.loadMedia(usePlayerStore.getState().itemId!, {
        startTimeSeconds: currentTime,
        audioStreamIndex: index,
        subtitleStreamIndex: usePlayerStore.getState().activeSubtitleIndex ?? undefined,
        maxStreamingBitrate: usePlayerStore.getState().selectedQuality?.maxBitrate,
        autoPlay: !isPaused,
      });
    }
  }

  public async setSubtitleTrack(index: number | null): Promise<void> {
    usePlayerStore.getState().setActiveSubtitleIndex(index);
    if (this.currentSource) {
      this.currentSource.currentSubtitleIndex = index ?? undefined;
      this.applyActiveSubtitle(this.currentSource);
    }
  }

  public getCurrentSource(): PlaybackSource | null {
    return this.currentSource;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public destroy(): void {
    this.abortController?.abort();
    this.telemetry.stopSession(this.videoEngine.getCurrentTime());
    this.hlsEngine.destroy();
    this.webVttEngine.detach();
    this.jassubEngine.destroy();
    this.videoEngine.destroy();
    if (this.audioContext) {
      try {
        this.audioContext.close().catch(() => {});
      } catch {
        // Ignore
      }
      this.audioContext = null;
      this.delayNode = null;
      this.mediaElementSource = null;
    }
    this.currentSource = null;
    this.videoElement = null;
    usePlayerStore.getState().reset();
  }
}
