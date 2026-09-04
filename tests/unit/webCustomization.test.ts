import { describe, it, expect, beforeEach } from 'vitest';
import {
  useWebCustomizationStore,
  ACCENT_PRESETS,
} from '../../src/state/stores/useWebCustomizationStore';

describe('Web Customization System', () => {
  beforeEach(() => {
    localStorage.clear();
    useWebCustomizationStore.getState().resetDefaults();
  });

  it('initializes with default branding and appearance values', () => {
    const state = useWebCustomizationStore.getState();
    expect(state.appName).toBe('CineTheme');
    expect(state.accentPreset).toBe('indigo');
    expect(state.backgroundStyle).toBe('default');
    expect(state.uiDensity).toBe('normal');
  });

  it('updates appName and persists to localStorage', () => {
    useWebCustomizationStore.getState().setAppName('My Cinema');
    expect(useWebCustomizationStore.getState().appName).toBe('My Cinema');

    const stored = JSON.parse(localStorage.getItem('cinetheme_web_customization') || '{}');
    expect(stored.appName).toBe('My Cinema');
  });

  it('switches accent presets and applies CSS variables to DOM', () => {
    useWebCustomizationStore.getState().setAccentPreset('amber');
    expect(useWebCustomizationStore.getState().accentPreset).toBe('amber');

    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue('--color-brand-500')).toBe(ACCENT_PRESETS.amber.hex[500]);
  });

  it('supports custom hex colors for brand accent', () => {
    useWebCustomizationStore.getState().setAccentPreset('custom', '#ff00ff');
    expect(useWebCustomizationStore.getState().accentPreset).toBe('custom');
    expect(useWebCustomizationStore.getState().customAccentColor).toBe('#ff00ff');

    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue('--color-brand-500')).toBe('#ff00ff');
  });

  it('updates background style and sets data attribute on documentElement', () => {
    useWebCustomizationStore.getState().setBackgroundStyle('oled');
    expect(document.documentElement.getAttribute('data-bg-style')).toBe('oled');
    expect(document.documentElement.style.getPropertyValue('--color-surface-950')).toBe('#000000');

    useWebCustomizationStore.getState().setBackgroundStyle('default');
    expect(document.documentElement.getAttribute('data-bg-style')).toBe('default');
    expect(document.documentElement.style.getPropertyValue('--color-surface-950')).toBe('');
  });

  it('updates UI density attribute', () => {
    useWebCustomizationStore.getState().setUiDensity('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');

    useWebCustomizationStore.getState().setUiDensity('relaxed');
    expect(document.documentElement.getAttribute('data-density')).toBe('relaxed');
  });

  it('resets all customization to defaults cleanly', () => {
    useWebCustomizationStore.getState().setAppName('Custom');
    useWebCustomizationStore.getState().setAccentPreset('emerald');
    useWebCustomizationStore.getState().setUiDensity('compact');

    useWebCustomizationStore.getState().resetDefaults();
    const state = useWebCustomizationStore.getState();
    expect(state.appName).toBe('CineTheme');
    expect(state.accentPreset).toBe('indigo');
    expect(state.uiDensity).toBe('normal');
  });
});
