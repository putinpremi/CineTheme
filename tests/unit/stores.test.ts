import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/state/stores/useUIStore';
import { useSettingsStore } from '../../src/state/stores/useSettingsStore';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';

describe('Zustand State Stores Foundation', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({ isSidebarOpen: true, activeModal: null, toasts: [] });
    useSettingsStore.getState().resetSettings();
    useAuthStore.setState({ status: 'anonymous', session: null, serverInfo: null, savedServers: [], error: null });
    usePlayerStore.getState().reset();
  });

  describe('useUIStore', () => {
    it('manages sidebar and toast states', () => {
      const { toggleSidebar, addToast, removeToast } = useUIStore.getState();

      toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);

      const toastId = addToast({ title: 'Server Connected', type: 'success', duration: 0 });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0]?.title).toBe('Server Connected');

      removeToast(toastId);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('useSettingsStore', () => {
    it('updates user settings and persists changes', () => {
      const { updateSettings } = useSettingsStore.getState();

      updateSettings({ preferredAudioLanguage: 'fre', autoSkipIntro: true });

      expect(useSettingsStore.getState().preferredAudioLanguage).toBe('fre');
      expect(useSettingsStore.getState().autoSkipIntro).toBe(true);

      const stored = JSON.parse(localStorage.getItem('cinetheme_user_settings') || '{}');
      expect(stored.preferredAudioLanguage).toBe('fre');
    });
  });

  describe('useAuthStore', () => {
    it('manages server profiles and session expiry on 401', () => {
      const { saveServerProfile, handleSessionExpired } = useAuthStore.getState();

      const mockServer = {
        id: 'server-1',
        name: 'Home Media',
        url: 'https://jellyfin.home',
        accessToken: 'token-abc-123',
        lastConnected: Date.now(),
      };

      saveServerProfile(mockServer);
      expect(useAuthStore.getState().savedServers).toHaveLength(1);
      expect(useAuthStore.getState().savedServers[0]?.name).toBe('Home Media');

      // Set active session
      useAuthStore.setState({
        status: 'authenticated',
        session: {
          accessToken: 'token-abc-123',
          serverId: 'server-1',
          serverUrl: 'https://jellyfin.home',
          user: { id: 'u1', name: 'Admin', isAdmin: true, isDisabled: false },
          lastConnected: Date.now(),
        },
      });

      expect(useAuthStore.getState().status).toBe('authenticated');
      expect(useAuthStore.getState().session?.serverId).toBe('server-1');

      // 401 Session Expiration
      handleSessionExpired();
      expect(useAuthStore.getState().status).toBe('anonymous');
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  describe('usePlayerStore', () => {
    it('manages player volume, sync offsets, and state resets', () => {
      const { setVolume, setAudioDelayMs, setSubtitleDelayMs, reset } = usePlayerStore.getState();

      setVolume(0.75);
      setAudioDelayMs(200);
      setSubtitleDelayMs(-150);

      expect(usePlayerStore.getState().volume).toBe(0.75);
      expect(usePlayerStore.getState().audioDelayMs).toBe(200);
      expect(usePlayerStore.getState().subtitleDelayMs).toBe(-150);

      reset();
      // Volume preference is preserved, transient time & delays are reset
      expect(usePlayerStore.getState().volume).toBe(0.75);
      expect(usePlayerStore.getState().audioDelayMs).toBe(0);
      expect(usePlayerStore.getState().subtitleDelayMs).toBe(0);
      expect(usePlayerStore.getState().currentTime).toBe(0);
      expect(usePlayerStore.getState().state).toBe('IDLE');
    });
  });
});
