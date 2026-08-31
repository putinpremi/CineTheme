import { describe, it, expect } from 'vitest';
import { detectDeviceCapabilities } from '../../src/player/capabilities/deviceCapabilities';
import { buildDeviceProfile } from '../../src/player/capabilities/deviceProfile';

describe('Device Capabilities & DeviceProfile Generation', () => {
  it('detects runtime playback capabilities without throwing errors', () => {
    const caps = detectDeviceCapabilities();
    expect(caps).toBeDefined();
    expect(typeof caps.isMp4Supported).toBe('boolean');
    expect(Array.isArray(caps.directAudioCodecs)).toBe(true);
    expect(Array.isArray(caps.directVideoCodecs)).toBe(true);
    expect(Array.isArray(caps.directPlayContainers)).toBe(true);
  });

  it('builds a conservative DeviceProfile with direct play and subtitle profiles', () => {
    const profile = buildDeviceProfile({
      capabilities: {
        isMp4Supported: true,
        isWebmSupported: true,
        isMkvSupported: false,
        isHlsSupported: true,
        isNativeHlsSupported: false,
        isHevcSupported: false,
        isAv1Supported: false,
        isVp9Supported: true,
        isH264Supported: true,
        directAudioCodecs: ['aac', 'mp3'],
        directVideoCodecs: ['h264', 'vp9'],
        directPlayContainers: ['mp4', 'webm'],
      },
      maxStreamingBitrate: 60_000_000,
    });

    expect(profile.Name).toBe('CineTheme Web Player');
    expect(profile.MaxStreamingBitrate).toBe(60_000_000);
    expect(profile.DirectPlayProfiles.length).toBeGreaterThanOrEqual(1);

    const videoDirectProfile = profile.DirectPlayProfiles.find((p) => p.Type === 'Video');
    expect(videoDirectProfile?.Container).toContain('mp4');
    expect(videoDirectProfile?.VideoCodec).toContain('h264');
    expect(videoDirectProfile?.VideoCodec).not.toContain('hevc');

    expect(profile.SubtitleProfiles.length).toBe(4);
    expect(profile.SubtitleProfiles.some((s) => s.Format === 'ass' && s.Method === 'External')).toBe(true);
  });
});
