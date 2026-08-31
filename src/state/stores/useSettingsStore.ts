import { create } from 'zustand';

export interface UserSettings {
  preferredAudioLanguage: string;
  preferredSubtitleLanguage: string;
  subtitleFontScale: number;
  subtitleBackgroundOpacity: number;
  autoSkipIntro: boolean;
  autoPlayNextEpisode: boolean;
  maxStreamingBitrate: number;
  theme: 'dark' | 'cinematic';
}

const DEFAULT_SETTINGS: UserSettings = {
  preferredAudioLanguage: 'jpn',
  preferredSubtitleLanguage: 'eng',
  subtitleFontScale: 1.0,
  subtitleBackgroundOpacity: 0.0,
  autoSkipIntro: false,
  autoPlayNextEpisode: true,
  maxStreamingBitrate: 120_000_000,
  theme: 'cinematic',
};

const STORAGE_KEY = 'cinetheme_user_settings';

function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_SETTINGS;
}

interface SettingsStore extends UserSettings {
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadStoredSettings(),

  updateSettings: (partial) =>
    set((state) => {
      const updated = { ...state, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    }),

  resetSettings: () =>
    set(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      return DEFAULT_SETTINGS;
    }),
}));
