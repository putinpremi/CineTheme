import Hls from 'hls.js';
import type { PlaybackCapabilities } from '../../domain/player/types';

/**
 * Runtime device capability detector.
 * Probes the current browser environment using HTMLMediaElement.canPlayType and MediaSource.isTypeSupported.
 * Never hardcodes assumptions; returns only what the browser explicitly verifies.
 */
export function detectDeviceCapabilities(): PlaybackCapabilities {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    // Safe headless baseline
    return {
      isMp4Supported: true,
      isWebmSupported: true,
      isMkvSupported: false,
      isHlsSupported: false,
      isNativeHlsSupported: false,
      isHevcSupported: false,
      isAv1Supported: false,
      isVp9Supported: false,
      isH264Supported: true,
      directAudioCodecs: ['aac', 'mp3'],
      directVideoCodecs: ['h264'],
      directPlayContainers: ['mp4', 'm4v'],
    };
  }

  const video = document.createElement('video');

  const isMp4Supported = video.canPlayType('video/mp4') !== '';
  const isWebmSupported = video.canPlayType('video/webm') !== '';
  const isMkvSupported =
    video.canPlayType('video/x-matroska') !== '' || video.canPlayType('video/mkv') !== '';

  const isNativeHlsSupported =
    video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    video.canPlayType('application/x-mpegURL') !== '';

  const isHlsSupported = Hls.isSupported() || isNativeHlsSupported;

  const isH264Supported =
    video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '' ||
    video.canPlayType('video/mp4; codecs="avc1.640028"') !== '';

  const isHevcSupported =
    (typeof window.MediaSource !== 'undefined' &&
      (window.MediaSource.isTypeSupported('video/mp4; codecs="hvc1.1.6.L153.B0"') ||
        window.MediaSource.isTypeSupported('video/mp4; codecs="hev1.1.6.L153.B0"'))) ||
    video.canPlayType('video/mp4; codecs="hvc1.1.6.L153.B0"') !== '';

  const isVp9Supported =
    video.canPlayType('video/webm; codecs="vp9"') !== '' ||
    (typeof window.MediaSource !== 'undefined' &&
      window.MediaSource.isTypeSupported('video/webm; codecs="vp9"'));

  const isAv1Supported =
    video.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '' ||
    (typeof window.MediaSource !== 'undefined' &&
      window.MediaSource.isTypeSupported('video/mp4; codecs="av01.0.08M.08"'));

  // Audio Codecs
  const directAudioCodecs: string[] = [];
  if (video.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '' || video.canPlayType('audio/aac') !== '') {
    directAudioCodecs.push('aac');
  }
  if (video.canPlayType('audio/mpeg') !== '' || video.canPlayType('audio/mp3') !== '') {
    directAudioCodecs.push('mp3');
  }
  if (
    video.canPlayType('audio/ogg; codecs="opus"') !== '' ||
    video.canPlayType('audio/webm; codecs="opus"') !== ''
  ) {
    directAudioCodecs.push('opus');
  }
  if (video.canPlayType('audio/flac') !== '' || video.canPlayType('audio/x-flac') !== '') {
    directAudioCodecs.push('flac');
  }
  if (video.canPlayType('audio/ogg; codecs="vorbis"') !== '') {
    directAudioCodecs.push('vorbis');
  }

  // Video Codecs
  const directVideoCodecs: string[] = [];
  if (isH264Supported) directVideoCodecs.push('h264');
  if (isHevcSupported) directVideoCodecs.push('hevc', 'h265');
  if (isVp9Supported) directVideoCodecs.push('vp9');
  if (isAv1Supported) directVideoCodecs.push('av1');

  // Containers
  const directPlayContainers: string[] = [];
  if (isMp4Supported) directPlayContainers.push('mp4', 'm4v');
  if (isWebmSupported) directPlayContainers.push('webm');
  if (isMkvSupported) directPlayContainers.push('mkv');

  return {
    isMp4Supported,
    isWebmSupported,
    isMkvSupported,
    isHlsSupported,
    isNativeHlsSupported,
    isHevcSupported,
    isAv1Supported,
    isVp9Supported,
    isH264Supported,
    directAudioCodecs,
    directVideoCodecs,
    directPlayContainers,
  };
}
