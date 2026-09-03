import { playbackService } from '../../api/services/playbackService';
import { secondsToTicks } from '../../utils/timeUtils';
import type { PlayMethod } from '../../domain/player/types';

export interface TelemetrySessionConfig {
  serverUrl: string;
  token: string;
  itemId: string;
  mediaSourceId?: string;
  playSessionId?: string;
  playMethod: PlayMethod;
  audioIndex?: number;
  subtitleIndex?: number;
  initialPositionSeconds?: number;
  isMuted?: boolean;
  volume?: number;
  onUnauthorized?: () => void;
}

export class PlaybackTelemetry {
  private config: TelemetrySessionConfig | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private seekDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPositionSeconds = 0;
  private isPaused = true;
  private isMuted = false;
  private volumeLevel = 100;
  private isStarted = false;
  private isStopped = false;

  public async startSession(config: TelemetrySessionConfig): Promise<void> {
    this.stopSession();
    this.config = config;
    this.currentPositionSeconds = config.initialPositionSeconds || 0;
    this.isPaused = false;
    this.isMuted = config.isMuted || false;
    this.volumeLevel = typeof config.volume === 'number' ? Math.round(config.volume * 100) : 100;
    this.isStarted = false;
    this.isStopped = false;

    try {
      await playbackService.reportPlaybackStart(config.serverUrl, config.token, {
        ItemId: config.itemId,
        MediaSourceId: config.mediaSourceId,
        AudioStreamIndex: config.audioIndex,
        SubtitleStreamIndex: config.subtitleIndex,
        PlaySessionId: config.playSessionId,
        PlayMethod: config.playMethod,
        PositionTicks: secondsToTicks(this.currentPositionSeconds),
        CanSeek: true,
        IsMuted: this.isMuted,
        VolumeLevel: this.volumeLevel,
      });
      this.isStarted = true;
      this.startHeartbeat();
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  public reportProgress(
    currentTimeSeconds: number,
    isPaused: boolean,
    isMuted: boolean,
    volume: number
  ): void {
    this.currentPositionSeconds = currentTimeSeconds;
    this.isMuted = isMuted;
    this.volumeLevel = Math.round(volume * 100);

    // Immediate progress dispatch on pause transition
    if (!this.isPaused && isPaused && this.isStarted && !this.isStopped) {
      this.isPaused = true;
      this.dispatchProgress('Pause');
      return;
    }

    this.isPaused = isPaused;
  }

  public reportSeek(
    targetPositionSeconds: number,
    isPaused: boolean,
    isMuted: boolean,
    volume: number
  ): void {
    this.currentPositionSeconds = targetPositionSeconds;
    this.isPaused = isPaused;
    this.isMuted = isMuted;
    this.volumeLevel = Math.round(volume * 100);

    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer);
    }

    // 500ms trailing debounce after scrubbing ends
    this.seekDebounceTimer = setTimeout(() => {
      if (this.isStarted && !this.isStopped) {
        this.dispatchProgress('Seek');
      }
    }, 500);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // 10-second periodic heartbeat while actively playing
    this.heartbeatInterval = setInterval(() => {
      if (this.isStarted && !this.isStopped && !this.isPaused) {
        this.dispatchProgress('TimeUpdate');
      }
    }, 10_000);
  }

  private async dispatchProgress(eventName: 'TimeUpdate' | 'Seek' | 'Pause'): Promise<void> {
    if (!this.config || !this.isStarted || this.isStopped) return;

    try {
      await playbackService.reportPlaybackProgress(this.config.serverUrl, this.config.token, {
        ItemId: this.config.itemId,
        MediaSourceId: this.config.mediaSourceId,
        AudioStreamIndex: this.config.audioIndex,
        SubtitleStreamIndex: this.config.subtitleIndex,
        PlaySessionId: this.config.playSessionId,
        PlayMethod: this.config.playMethod,
        PositionTicks: secondsToTicks(this.currentPositionSeconds),
        IsPaused: this.isPaused,
        IsMuted: this.isMuted,
        VolumeLevel: this.volumeLevel,
        EventName: eventName,
      });
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  public async stopSession(finalPositionSeconds?: number): Promise<void> {
    this.stopHeartbeat();
    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer);
      this.seekDebounceTimer = null;
    }

    if (!this.config || !this.isStarted || this.isStopped) {
      this.config = null;
      return;
    }

    this.isStopped = true;
    const stopPos =
      typeof finalPositionSeconds === 'number' ? finalPositionSeconds : this.currentPositionSeconds;

    try {
      await playbackService.reportPlaybackStopped(this.config.serverUrl, this.config.token, {
        ItemId: this.config.itemId,
        MediaSourceId: this.config.mediaSourceId,
        PlaySessionId: this.config.playSessionId,
        PositionTicks: secondsToTicks(stopPos),
      });
    } catch (err: unknown) {
      this.handleError(err);
    } finally {
      this.config = null;
      this.isStarted = false;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleError(err: unknown): void {
    if (
      err &&
      typeof err === 'object' &&
      (('statusCode' in err && (err as { statusCode: number }).statusCode === 401) ||
        ('status' in err && (err as { status: number }).status === 401) ||
        ('code' in err && (err as { code: string }).code === 'AUTH_UNAUTHORIZED'))
    ) {
      this.config?.onUnauthorized?.();
    }
  }
}
