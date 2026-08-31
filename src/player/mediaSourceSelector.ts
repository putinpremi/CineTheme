import { AppError } from '../core/errors/AppError';
import type {
  MediaSourceInfoDto,
  MediaStreamDto,
  PlaybackInfoResponseDto,
} from '../api/types/jellyfinDto';
import type {
  AudioTrack,
  PlaybackMode,
  PlaybackSource,
  PlayMethod,
  SubtitleDeliveryMethod,
  SubtitleTrack,
} from '../domain/player/types';
import type { PlaybackPreferences } from '../domain/anime/types';
import {
  buildDirectPlayUrl,
  buildHlsStreamUrl,
  buildSubtitleStreamUrl,
  redactMediaUrl,
} from './streamUrlBuilder';
import { fontManager } from './subtitles/fontManager';
import { ticksToSeconds } from '../utils/timeUtils';

export interface SelectMediaSourceOptions {
  serverUrl: string;
  itemId: string;
  token: string;
  playbackInfo: PlaybackInfoResponseDto;
  preferredMediaSourceId?: string;
  preferredAudioStreamIndex?: number;
  preferredSubtitleStreamIndex?: number;
  preferences?: Partial<PlaybackPreferences>;
  startPositionSeconds?: number;
}

function parseAudioTracks(mediaStreams: MediaStreamDto[] = []): AudioTrack[] {
  return mediaStreams
    .filter((s) => s.Type === 'Audio' && typeof s.Index === 'number')
    .map((s) => ({
      index: s.Index!,
      language: s.Language,
      title: s.Title,
      displayTitle: s.DisplayTitle || s.Title || s.Language || `Audio Track ${s.Index}`,
      codec: (s.Codec || 'unknown').toLowerCase(),
      channels: s.Channels,
      sampleRate: s.SampleRate,
      bitRate: s.BitRate,
      isDefault: s.IsDefault ?? false,
      isForced: s.IsForced ?? false,
      isExternal: s.IsExternal ?? false,
    }));
}

function parseSubtitleTracks(
  serverUrl: string,
  itemId: string,
  mediaSourceId: string,
  token: string,
  mediaStreams: MediaStreamDto[] = []
): SubtitleTrack[] {
  return mediaStreams
    .filter((s) => s.Type === 'Subtitle' && typeof s.Index === 'number')
    .map((s) => {
      const deliveryMethod: SubtitleDeliveryMethod =
        s.DeliveryMethod === 'Encode' ? 'Encode' : s.DeliveryMethod === 'Embed' ? 'Embed' : 'External';

      let deliveryUrl: string | undefined = undefined;
      if (deliveryMethod === 'External') {
        const codecLower = (s.Codec || 'vtt').toLowerCase();
        const format =
          codecLower.includes('ass') || codecLower.includes('ssa')
            ? 'ass'
            : codecLower.includes('subrip') || codecLower.includes('srt')
            ? 'srt'
            : 'vtt';

        deliveryUrl = buildSubtitleStreamUrl({
          serverUrl,
          itemId,
          mediaSourceId,
          subtitleIndex: s.Index!,
          format,
          token,
        });
      }

      return {
        index: s.Index!,
        language: s.Language,
        title: s.Title,
        displayTitle: s.DisplayTitle || s.Title || s.Language || `Subtitle Track ${s.Index}`,
        codec: (s.Codec || 'unknown').toLowerCase(),
        deliveryMethod,
        deliveryUrl,
        isDefault: s.IsDefault ?? false,
        isForced: s.IsForced ?? false,
        isExternal: s.IsExternal ?? false,
      };
    });
}

/**
 * Selects the authoritative playback source from a Jellyfin PlaybackInfo response.
 * Consumes the server's negotiated result without reverse-engineering or inventing URLs.
 */
export function selectMediaSource(options: SelectMediaSourceOptions): PlaybackSource {
  const {
    serverUrl,
    itemId,
    token,
    playbackInfo,
    preferredMediaSourceId,
    preferredAudioStreamIndex,
    preferredSubtitleStreamIndex,
    preferences,
    startPositionSeconds = 0,
  } = options;

  if (!playbackInfo.MediaSources || playbackInfo.MediaSources.length === 0) {
    throw new AppError(
      'No playable media sources returned by server.',
      { code: 'NOT_FOUND', statusCode: 404 }
    );
  }

  const selectedSource: MediaSourceInfoDto =
    (preferredMediaSourceId
      ? playbackInfo.MediaSources.find((s) => s.Id === preferredMediaSourceId)
      : undefined) ||
    playbackInfo.MediaSources.find((s) => s.SupportsDirectPlay) ||
    playbackInfo.MediaSources.find((s) => s.SupportsDirectStream) ||
    playbackInfo.MediaSources[0]!;

  const playSessionId = playbackInfo.PlaySessionId || `session-${Date.now()}`;
  const mediaSourceId = selectedSource.Id;
  const container = (selectedSource.Container || 'mp4').toLowerCase();

  const audioTracks = parseAudioTracks(selectedSource.MediaStreams);
  const subtitleTracks = parseSubtitleTracks(
    serverUrl,
    itemId,
    mediaSourceId,
    token,
    selectedSource.MediaStreams
  );

  const fontAttachments = fontManager.discoverFontAttachments(
    serverUrl,
    itemId,
    mediaSourceId,
    token,
    selectedSource.MediaAttachments
  );

  // Audio stream resolution with language preference fallback
  let resolvedAudioIndex = preferredAudioStreamIndex;
  if (typeof resolvedAudioIndex !== 'number' && preferences?.preferredAudioLanguage) {
    const langMatch = audioTracks.find(
      (a) => a.language?.toLowerCase() === preferences.preferredAudioLanguage?.toLowerCase()
    );
    if (langMatch) {
      resolvedAudioIndex = langMatch.index;
    }
  }

  const defaultAudio = audioTracks.find((a) => a.isDefault) || audioTracks[0];
  const finalAudioIndex =
    typeof resolvedAudioIndex === 'number'
      ? resolvedAudioIndex
      : defaultAudio?.index ?? selectedSource.DefaultAudioStreamIndex;

  // Subtitle stream resolution with language preference & mode fallback
  let resolvedSubtitleIndex = preferredSubtitleStreamIndex;
  if (typeof resolvedSubtitleIndex !== 'number' && preferences?.subtitleMode === 'None') {
    resolvedSubtitleIndex = undefined;
  } else if (typeof resolvedSubtitleIndex !== 'number' && preferences?.preferredSubtitleLanguage) {
    const subMatch = subtitleTracks.find(
      (s) =>
        s.language?.toLowerCase() === preferences.preferredSubtitleLanguage?.toLowerCase() &&
        (preferences.subtitleMode === 'OnlyForced' ? s.isForced : true)
    );
    if (subMatch) {
      resolvedSubtitleIndex = subMatch.index;
    }
  }

  const defaultSubtitle = subtitleTracks.find((s) => s.isDefault);
  const finalSubtitleIndex =
    typeof resolvedSubtitleIndex === 'number'
      ? resolvedSubtitleIndex
      : preferences?.subtitleMode === 'None'
      ? undefined
      : defaultSubtitle?.index ?? selectedSource.DefaultSubtitleStreamIndex;

  let playMethod: PlayMethod;
  let playbackMode: PlaybackMode;
  let rawUrl: string;

  if (selectedSource.SupportsDirectPlay) {
    playMethod = 'DirectPlay';
    playbackMode = 'DIRECT_PLAY';
    rawUrl = buildDirectPlayUrl({
      serverUrl,
      itemId,
      mediaSourceId,
      playSessionId,
      container,
      token,
    });
  } else if (selectedSource.SupportsDirectStream && selectedSource.TranscodingUrl) {
    playMethod = 'DirectStream';
    playbackMode = 'DIRECT_STREAM';
    rawUrl = buildHlsStreamUrl({
      serverUrl,
      transcodingUrl: selectedSource.TranscodingUrl,
      token,
    });
  } else if (selectedSource.TranscodingUrl) {
    playMethod = 'Transcode';
    playbackMode = 'TRANSCODE';
    rawUrl = buildHlsStreamUrl({
      serverUrl,
      transcodingUrl: selectedSource.TranscodingUrl,
      token,
    });
  } else {
    throw new AppError(
      'Media source contains no usable direct or transcoding delivery URL.',
      { code: 'PLAYBACK_ERROR', statusCode: 400 }
    );
  }

  const totalDurationSeconds = ticksToSeconds(selectedSource.RunTimeTicks);

  return {
    url: rawUrl,
    redactedUrl: redactMediaUrl(rawUrl),
    playMethod,
    playbackMode,
    mediaSourceId,
    playSessionId,
    container,
    audioTracks,
    subtitleTracks,
    fontAttachments,
    currentAudioIndex: finalAudioIndex,
    currentSubtitleIndex: finalSubtitleIndex,
    startPositionSeconds,
    totalDurationSeconds,
    canSeek: true,
  };
}
