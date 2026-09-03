import { httpClient } from '../client/httpClient';
import type {
  PlaybackInfoDto,
  PlaybackInfoResponseDto,
  PlaybackProgressDto,
  PlaybackStartDto,
  PlaybackStopDto,
} from '../types/jellyfinDto';
import { buildDeviceProfile } from '../../player/capabilities/deviceProfile';

export interface GetPlaybackInfoOptions {
  startTimeTicks?: number;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  mediaSourceId?: string;
  maxStreamingBitrate?: number;
}

export class PlaybackService {
  /**
   * Requests media playback information and stream negotiation from Jellyfin.
   */
  public async getPlaybackInfo(
    serverUrl: string,
    userId: string,
    token: string,
    itemId: string,
    options: GetPlaybackInfoOptions = {},
    signal?: AbortSignal
  ): Promise<PlaybackInfoResponseDto> {
    const deviceProfile = buildDeviceProfile({
      maxStreamingBitrate: options.maxStreamingBitrate,
    });

    const payload: PlaybackInfoDto = {
      UserId: userId || undefined,
      DeviceProfile: deviceProfile,
      StartTimeTicks: options.startTimeTicks,
      AudioStreamIndex: options.audioStreamIndex,
      SubtitleStreamIndex: options.subtitleStreamIndex,
      MediaSourceId: options.mediaSourceId,
      MaxStreamingBitrate: options.maxStreamingBitrate,
      EnableDirectPlay: true,
      EnableDirectStream: true,
      EnableTranscoding: true,
      AllowVideoStreamCopy: true,
      AllowAudioStreamCopy: true,
      AutoOpenLiveStream: true,
    };

    const queryParams: Record<string, string | undefined> = {};
    if (userId) {
      queryParams.userId = userId;
    }

    return httpClient.post<PlaybackInfoResponseDto>(
      serverUrl,
      `/Items/${encodeURIComponent(itemId)}/PlaybackInfo`,
      payload,
      {
        token,
        queryParams,
        signal,
      }
    );
  }

  /**
   * Reports playback start event to the Jellyfin active session.
   */
  public async reportPlaybackStart(
    serverUrl: string,
    token: string,
    payload: PlaybackStartDto,
    signal?: AbortSignal
  ): Promise<void> {
    await httpClient.post<void>(serverUrl, '/Sessions/Playing', payload, {
      token,
      signal,
    });
  }

  /**
   * Reports periodic and event-driven playback progress updates to the Jellyfin server.
   */
  public async reportPlaybackProgress(
    serverUrl: string,
    token: string,
    payload: PlaybackProgressDto,
    signal?: AbortSignal
  ): Promise<void> {
    await httpClient.post<void>(serverUrl, '/Sessions/Playing/Progress', payload, {
      token,
      signal,
    });
  }

  /**
   * Reports playback stopped / exit event to update UserData and destroy the active play session.
   */
  public async reportPlaybackStopped(
    serverUrl: string,
    token: string,
    payload: PlaybackStopDto,
    signal?: AbortSignal
  ): Promise<void> {
    await httpClient.post<void>(serverUrl, '/Sessions/Playing/Stopped', payload, {
      token,
      signal,
    });
  }
}

export const playbackService = new PlaybackService();
