import { create } from 'zustand';
import type { PlaybackPreferences } from '../../domain/anime/types';

const STORAGE_KEY = 'cinetheme_playback_prefs';

function loadSavedPreferences(): PlaybackPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }

  return {
    autoPlayNextEpisode: true,
    autoSkipIntro: false,
    autoSkipOutro: false,
    preferredAudioLanguage: undefined,
    preferredSubtitleLanguage: undefined,
    subtitleMode: 'Default',
  };
}

export interface PlaybackPreferencesStoreState extends PlaybackPreferences {
  setAutoPlayNext: (enabled: boolean) => void;
  setAutoSkipIntro: (enabled: boolean) => void;
  setAutoSkipOutro: (enabled: boolean) => void;
  setPreferredAudioLanguage: (lang?: string) => void;
  setPreferredSubtitleLanguage: (lang?: string) => void;
  setSubtitleMode: (mode: PlaybackPreferences['subtitleMode']) => void;
}

export const usePlaybackPreferencesStore = create<PlaybackPreferencesStoreState>((set, get) => {
  const initial = loadSavedPreferences();

  const persist = () => {
    try {
      const state = get();
      const prefs: PlaybackPreferences = {
        autoPlayNextEpisode: state.autoPlayNextEpisode,
        autoSkipIntro: state.autoSkipIntro,
        autoSkipOutro: state.autoSkipOutro,
        preferredAudioLanguage: state.preferredAudioLanguage,
        preferredSubtitleLanguage: state.preferredSubtitleLanguage,
        subtitleMode: state.subtitleMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage quota or restriction
    }
  };

  return {
    ...initial,

    setAutoPlayNext: (enabled) => {
      set({ autoPlayNextEpisode: enabled });
      persist();
    },

    setAutoSkipIntro: (enabled) => {
      set({ autoSkipIntro: enabled });
      persist();
    },

    setAutoSkipOutro: (enabled) => {
      set({ autoSkipOutro: enabled });
      persist();
    },

    setPreferredAudioLanguage: (lang) => {
      set({ preferredAudioLanguage: lang });
      persist();
    },

    setPreferredSubtitleLanguage: (lang) => {
      set({ preferredSubtitleLanguage: lang });
      persist();
    },

    setSubtitleMode: (mode) => {
      set({ subtitleMode: mode });
      persist();
    },
  };
});
