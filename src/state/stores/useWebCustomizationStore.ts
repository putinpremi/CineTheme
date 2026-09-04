import { create } from 'zustand';

export type AccentPresetKey =
  | 'indigo'
  | 'amber'
  | 'emerald'
  | 'crimson'
  | 'violet'
  | 'cyan'
  | 'custom';

export type BackgroundStyle = 'default' | 'oled' | 'glass' | 'cinematic';
export type UiDensity = 'compact' | 'normal' | 'relaxed';

export interface WebCustomizationSettings {
  appName: string;
  accentPreset: AccentPresetKey;
  customAccentColor: string;
  backgroundStyle: BackgroundStyle;
  uiDensity: UiDensity;
  customLogoUrl: string;
}

export interface WebCustomizationStoreState extends WebCustomizationSettings {
  setAppName: (name: string) => void;
  setAccentPreset: (preset: AccentPresetKey, customColor?: string) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setUiDensity: (density: UiDensity) => void;
  setCustomLogoUrl: (url: string) => void;
  resetDefaults: () => void;
}

export const ACCENT_PRESETS: Record<
  Exclude<AccentPresetKey, 'custom'>,
  { label: string; primary: string; hex: { 600: string; 500: string; 400: string; 300: string } }
> = {
  indigo: {
    label: 'Indigo (Default)',
    primary: '#6366F1',
    hex: { 600: '#4338CA', 500: '#6366F1', 400: '#818CF8', 300: '#A5B4FC' },
  },
  amber: {
    label: 'Amber / Gold',
    primary: '#F59E0B',
    hex: { 600: '#D97706', 500: '#F59E0B', 400: '#FBBF24', 300: '#FCD34D' },
  },
  emerald: {
    label: 'Emerald',
    primary: '#10B981',
    hex: { 600: '#059669', 500: '#10B981', 400: '#34D399', 300: '#6EE7B7' },
  },
  crimson: {
    label: 'Crimson Rose',
    primary: '#F43F5E',
    hex: { 600: '#E11D48', 500: '#F43F5E', 400: '#FB7185', 300: '#FDA4AF' },
  },
  violet: {
    label: 'Deep Violet',
    primary: '#8B5CF6',
    hex: { 600: '#7C3AED', 500: '#8B5CF6', 400: '#A78BFA', 300: '#C4B5FD' },
  },
  cyan: {
    label: 'Cyan Wave',
    primary: '#06B6D4',
    hex: { 600: '#0891B2', 500: '#06B6D4', 400: '#22D3EE', 300: '#67E8F9' },
  },
};

const DEFAULT_CUSTOMIZATION: WebCustomizationSettings = {
  appName: 'CineTheme',
  accentPreset: 'indigo',
  customAccentColor: '#6366F1',
  backgroundStyle: 'default',
  uiDensity: 'normal',
  customLogoUrl: '',
};

const STORAGE_KEY = 'cinetheme_web_customization';

function loadStoredCustomization(): WebCustomizationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_CUSTOMIZATION;
}

function persistCustomization(state: WebCustomizationSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function applyCustomizationToDom(settings: WebCustomizationSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Accent colors
  if (settings.accentPreset !== 'custom' && ACCENT_PRESETS[settings.accentPreset]) {
    const colors = ACCENT_PRESETS[settings.accentPreset].hex;
    root.style.setProperty('--color-brand-600', colors[600]);
    root.style.setProperty('--color-brand-500', colors[500]);
    root.style.setProperty('--color-brand-400', colors[400]);
    root.style.setProperty('--color-brand-300', colors[300]);
  } else if (settings.customAccentColor) {
    root.style.setProperty('--color-brand-600', settings.customAccentColor);
    root.style.setProperty('--color-brand-500', settings.customAccentColor);
    root.style.setProperty('--color-brand-400', settings.customAccentColor);
    root.style.setProperty('--color-brand-300', settings.customAccentColor);
  }

  // 2. Background style
  root.setAttribute('data-bg-style', settings.backgroundStyle);
  if (settings.backgroundStyle === 'oled') {
    root.style.setProperty('--color-surface-950', '#000000');
    root.style.setProperty('--color-surface-900', '#050505');
  } else if (settings.backgroundStyle === 'cinematic') {
    root.style.setProperty('--color-surface-950', '#05070D');
    root.style.setProperty('--color-surface-900', '#0A0E18');
  } else {
    root.style.removeProperty('--color-surface-950');
    root.style.removeProperty('--color-surface-900');
  }

  // 3. UI Density
  root.setAttribute('data-density', settings.uiDensity);
}

export const useWebCustomizationStore = create<WebCustomizationStoreState>((set, get) => {
  const initial = loadStoredCustomization();

  // Apply on startup if in browser
  if (typeof window !== 'undefined') {
    applyCustomizationToDom(initial);
  }

  return {
    ...initial,

    setAppName: (appName: string) => {
      const trimmed = appName.trim() || 'CineTheme';
      set({ appName: trimmed });
      const current = get();
      persistCustomization(current);
      applyCustomizationToDom(current);
    },

    setAccentPreset: (preset: AccentPresetKey, customColor?: string) => {
      const updates: Partial<WebCustomizationSettings> = { accentPreset: preset };
      if (customColor) {
        updates.customAccentColor = customColor;
      }
      set(updates);
      const current = get();
      persistCustomization(current);
      applyCustomizationToDom(current);
    },

    setBackgroundStyle: (backgroundStyle: BackgroundStyle) => {
      set({ backgroundStyle });
      const current = get();
      persistCustomization(current);
      applyCustomizationToDom(current);
    },

    setUiDensity: (uiDensity: UiDensity) => {
      set({ uiDensity });
      const current = get();
      persistCustomization(current);
      applyCustomizationToDom(current);
    },

    setCustomLogoUrl: (customLogoUrl: string) => {
      set({ customLogoUrl: customLogoUrl.trim() });
      const current = get();
      persistCustomization(current);
      applyCustomizationToDom(current);
    },

    resetDefaults: () => {
      persistCustomization(DEFAULT_CUSTOMIZATION);
      set(DEFAULT_CUSTOMIZATION);
      applyCustomizationToDom(DEFAULT_CUSTOMIZATION);
    },
  };
});
