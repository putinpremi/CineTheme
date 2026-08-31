import type { FontAttachmentInfo } from '../../player/subtitles/fontManager';

export type PlayerState =
  | 'IDLE'
  | 'NEGOTIATING'
  | 'READY'
  | 'BUFFERING'
  | 'PLAYING'
  | 'PAUSED'
  | 'SEEKING'
  | 'RECOVERING'
  | 'ENDED'
  | 'AUTONEXT'
  | 'ERROR'
  | 'STOPPED';

export type PlaybackMode = 'DIRECT_PLAY' | 'REMUX' | 'DIRECT_STREAM' | 'TRANSCODE';

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode';

export interface AudioTrack {
  index: number;
  language?: string;
  title?: string;
  displayTitle?: string;
  codec: string;
  channels?: number;
  sampleRate?: number;
  bitRate?: number;
  isDefault: boolean;
  isForced: boolean;
  isExternal: boolean;
}

export type SubtitleDeliveryMethod = 'External' | 'Embed' | 'Encode';

export interface SubtitleTrack {
  index: number;
  language?: string;
  title?: string;
  displayTitle?: string;
  codec: string;
  deliveryMethod: SubtitleDeliveryMethod;
  deliveryUrl?: string;
  isDefault: boolean;
  isForced: boolean;
  isExternal: boolean;
}

export interface PlaybackSource {
  url: string;
  redactedUrl: string;
  playMethod: PlayMethod;
  playbackMode: PlaybackMode;
  mediaSourceId: string;
  playSessionId: string;
  container: string;
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  fontAttachments?: FontAttachmentInfo[];
  currentAudioIndex?: number;
  currentSubtitleIndex?: number;
  startPositionSeconds: number;
  totalDurationSeconds: number;
  canSeek: boolean;
}

export interface PlaybackError {
  code: string;
  message: string;
  isFatal: boolean;
  details?: unknown;
}

export interface PlaybackQuality {
  id: string;
  label: string;
  maxBitrate?: number;
  height?: number;
}

export const QUALITY_PRESETS: PlaybackQuality[] = [
  { id: 'auto', label: 'Auto (Source / Unrestricted)', maxBitrate: undefined },
  { id: '20m', label: '20 Mbps Max Bitrate Cap', maxBitrate: 20_000_000, height: 1080 },
  { id: '10m', label: '10 Mbps Max Bitrate Cap', maxBitrate: 10_000_000, height: 1080 },
  { id: '4m', label: '4 Mbps Max Bitrate Cap', maxBitrate: 4_000_000, height: 720 },
  { id: '1.5m', label: '1.5 Mbps Max Bitrate Cap', maxBitrate: 1_500_000, height: 480 },
  { id: '800k', label: '800 Kbps Max Bitrate Cap', maxBitrate: 800_000, height: 360 },
];

export interface PlaybackCapabilities {
  isMp4Supported: boolean;
  isWebmSupported: boolean;
  isMkvSupported: boolean;
  isHlsSupported: boolean;
  isNativeHlsSupported: boolean;
  isHevcSupported: boolean;
  isAv1Supported: boolean;
  isVp9Supported: boolean;
  isH264Supported: boolean;
  directAudioCodecs: string[];
  directVideoCodecs: string[];
  directPlayContainers: string[];
}
