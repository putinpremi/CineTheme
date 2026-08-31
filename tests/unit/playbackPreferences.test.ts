import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackPreferencesStore } from '../../src/state/stores/usePlaybackPreferencesStore';
import { selectMediaSource } from '../../src/player/mediaSourceSelector';
import type { PlaybackInfoResponseDto } from '../../src/api/types/jellyfinDto';

describe('Playback Preferences Store & Language Matching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates preferences and persists state to local storage', () => {
    const store = usePlaybackPreferencesStore.getState();

    store.setAutoSkipIntro(true);
    store.setAutoPlayNext(true);
    store.setPreferredAudioLanguage('jpn');
    store.setPreferredSubtitleLanguage('eng');
    store.setSubtitleMode('Always');

    const updated = usePlaybackPreferencesStore.getState();
    expect(updated.autoSkipIntro).toBe(true);
    expect(updated.preferredAudioLanguage).toBe('jpn');
    expect(updated.preferredSubtitleLanguage).toBe('eng');

    const storedRaw = localStorage.getItem('cinetheme_playback_prefs');
    expect(storedRaw).not.toBeNull();
    const stored = JSON.parse(storedRaw!);
    expect(stored.autoSkipIntro).toBe(true);
    expect(stored.preferredAudioLanguage).toBe('jpn');
  });

  it('selects preferred Japanese audio and English subtitles during source negotiation', () => {
    const mockPlaybackInfo: PlaybackInfoResponseDto = {
      PlaySessionId: 'sess-123',
      MediaSources: [
        {
          Id: 'source-1',
          Container: 'mkv',
          SupportsDirectPlay: true,
          RunTimeTicks: 14400000000,
          MediaStreams: [
            { Type: 'Video', Index: 0, Codec: 'h264' },
            { Type: 'Audio', Index: 1, Language: 'eng', DisplayTitle: 'English 5.1', IsDefault: true },
            { Type: 'Audio', Index: 2, Language: 'jpn', DisplayTitle: 'Japanese Stereo' },
            { Type: 'Subtitle', Index: 3, Language: 'fre', DisplayTitle: 'French' },
            { Type: 'Subtitle', Index: 4, Language: 'eng', DisplayTitle: 'English (ASS)', Codec: 'ass' },
          ],
        },
      ],
    };

    const source = selectMediaSource({
      serverUrl: 'http://127.0.0.1:8096',
      itemId: 'anime-ep-1',
      token: 'tok-1',
      playbackInfo: mockPlaybackInfo,
      preferences: {
        preferredAudioLanguage: 'jpn',
        preferredSubtitleLanguage: 'eng',
        subtitleMode: 'Always',
      },
    });

    expect(source.currentAudioIndex).toBe(2); // Matched Japanese track (index 2) instead of default English (index 1)
    expect(source.currentSubtitleIndex).toBe(4); // Matched English subtitle track (index 4)
  });
});
