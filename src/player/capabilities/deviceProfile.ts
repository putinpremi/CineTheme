import { detectDeviceCapabilities } from './deviceCapabilities';
import type { PlaybackCapabilities } from '../../domain/player/types';

export interface JellyfinDirectPlayProfile {
  Container: string;
  Type: 'Video' | 'Audio';
  VideoCodec?: string;
  AudioCodec?: string;
}

export interface JellyfinTranscodingProfile {
  Container: string;
  Type: 'Video' | 'Audio';
  VideoCodec?: string;
  AudioCodec?: string;
  Protocol?: 'hls' | 'http';
  Context?: 'Streaming' | 'Static';
  BreakOnNonKeyFrames?: boolean;
}

export interface JellyfinSubtitleProfile {
  Format: string;
  Method: 'External' | 'Embed' | 'Encode';
}

export interface JellyfinDeviceProfile {
  Name?: string;
  Id?: string;
  MaxStreamingBitrate: number;
  MaxStaticBitrate: number;
  DirectPlayProfiles: JellyfinDirectPlayProfile[];
  TranscodingProfiles: JellyfinTranscodingProfile[];
  ContainerProfiles: unknown[];
  CodecProfiles: unknown[];
  SubtitleProfiles: JellyfinSubtitleProfile[];
}

export interface BuildDeviceProfileOptions {
  capabilities?: PlaybackCapabilities;
  maxStreamingBitrate?: number;
}

/**
 * Constructs a verified Jellyfin DeviceProfile based on runtime browser capability detection.
 * Conservative by design: adheres strictly to Jellyfin OpenAPI schema without invalid properties or UUIDs.
 */
export function buildDeviceProfile(options: BuildDeviceProfileOptions = {}): JellyfinDeviceProfile {
  const caps = options.capabilities ?? detectDeviceCapabilities();
  const maxBitrate = options.maxStreamingBitrate ?? 120_000_000;

  const directPlayProfiles: JellyfinDirectPlayProfile[] = [];

  // Video Direct Play Profile
  if (caps.directPlayContainers.length > 0 && caps.directVideoCodecs.length > 0) {
    directPlayProfiles.push({
      Container: caps.directPlayContainers.join(','),
      Type: 'Video',
      VideoCodec: caps.directVideoCodecs.join(','),
      AudioCodec: caps.directAudioCodecs.length > 0 ? caps.directAudioCodecs.join(',') : 'aac,mp3',
    });
  }

  // HLS Direct Play Profile
  if (caps.isHlsSupported && caps.directVideoCodecs.length > 0) {
    directPlayProfiles.push({
      Container: 'hls',
      Type: 'Video',
      VideoCodec: caps.directVideoCodecs.join(','),
      AudioCodec: caps.directAudioCodecs.length > 0 ? caps.directAudioCodecs.join(',') : 'aac,mp3',
    });
  }

  // Audio Direct Play Profile
  if (caps.directAudioCodecs.length > 0) {
    directPlayProfiles.push({
      Container: 'mp3,aac,flac,opus,ogg,wav',
      Type: 'Audio',
      AudioCodec: caps.directAudioCodecs.join(','),
    });
  }

  // Transcoding Profiles (HLS via TS or fragmented MP4)
  const transcodingProfiles: JellyfinTranscodingProfile[] = [];
  if (caps.isHlsSupported) {
    transcodingProfiles.push({
      Container: 'ts',
      Type: 'Video',
      VideoCodec: 'h264',
      AudioCodec: 'aac,mp3,opus',
      Protocol: 'hls',
      Context: 'Streaming',
      BreakOnNonKeyFrames: true,
    });
    transcodingProfiles.push({
      Container: 'mp4',
      Type: 'Video',
      VideoCodec: 'h264',
      AudioCodec: 'aac,mp3,opus',
      Protocol: 'hls',
      Context: 'Streaming',
      BreakOnNonKeyFrames: true,
    });
    transcodingProfiles.push({
      Container: 'ts',
      Type: 'Audio',
      AudioCodec: 'aac',
      Protocol: 'hls',
      Context: 'Streaming',
    });
  }

  // Subtitle Profiles (CineTheme client supports External VTT, SRT, ASS, and SSA)
  const subtitleProfiles: JellyfinSubtitleProfile[] = [
    { Format: 'vtt', Method: 'External' },
    { Format: 'srt', Method: 'External' },
    { Format: 'ass', Method: 'External' },
    { Format: 'ssa', Method: 'External' },
  ];

  return {
    Name: 'CineTheme Web Player',
    MaxStreamingBitrate: maxBitrate,
    MaxStaticBitrate: maxBitrate,
    DirectPlayProfiles: directPlayProfiles,
    TranscodingProfiles: transcodingProfiles,
    ContainerProfiles: [],
    CodecProfiles: [],
    SubtitleProfiles: subtitleProfiles,
  };
}
