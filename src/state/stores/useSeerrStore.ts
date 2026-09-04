import { create } from 'zustand';
import { seerrService } from '../../api/services/seerrService';

export interface SeerrSettings {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
}

export interface SeerrStoreState extends SeerrSettings {
  status: 'idle' | 'testing' | 'connected' | 'error';
  version: string | null;
  errorMessage: string | null;

  setServerUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setEnabled: (enabled: boolean) => void;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
}

const STORAGE_KEY = 'cinetheme_seerr_config';

function loadStoredSeerr(): SeerrSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        serverUrl: parsed.serverUrl || '',
        apiKey: parsed.apiKey || '',
      };
    }
  } catch {
    // Ignore storage errors
  }
  return {
    enabled: false,
    serverUrl: '',
    apiKey: '',
  };
}

function persistSettings(settings: SeerrSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export const useSeerrStore = create<SeerrStoreState>((set, get) => {
  const initial = loadStoredSeerr();

  return {
    ...initial,
    status: 'idle',
    version: null,
    errorMessage: null,

    setServerUrl: (url: string) => {
      set({ serverUrl: url, status: 'idle', errorMessage: null });
      const { enabled, apiKey } = get();
      persistSettings({ enabled, serverUrl: url, apiKey });
    },

    setApiKey: (apiKey: string) => {
      set({ apiKey, status: 'idle', errorMessage: null });
      const { enabled, serverUrl } = get();
      persistSettings({ enabled, serverUrl, apiKey });
    },

    setEnabled: (enabled: boolean) => {
      set({ enabled });
      const { serverUrl, apiKey } = get();
      persistSettings({ enabled, serverUrl, apiKey });
    },

    testConnection: async () => {
      const { serverUrl, apiKey } = get();
      if (!serverUrl.trim() || !apiKey.trim()) {
        set({
          status: 'error',
          errorMessage: 'Server URL and API Key cannot be empty',
          version: null,
        });
        return false;
      }

      set({ status: 'testing', errorMessage: null });
      try {
        const result = await seerrService.testConnection(serverUrl, apiKey);
        set({
          status: 'connected',
          version: result.version,
          errorMessage: null,
        });
        return true;
      } catch (err: unknown) {
        set({
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Failed to connect to Seerr server',
          version: null,
        });
        return false;
      }
    },

    disconnect: () => {
      const reset = { enabled: false, serverUrl: '', apiKey: '' };
      persistSettings(reset);
      set({
        ...reset,
        status: 'idle',
        version: null,
        errorMessage: null,
      });
    },
  };
});
