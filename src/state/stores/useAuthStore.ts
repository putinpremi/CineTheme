import { create } from 'zustand';
import type { ServerInfo, AuthSession, AuthStatus } from '../../domain/auth/models';
import type { ServerProfile } from '../../domain/auth/types';
import { authService } from '../../api/services/authService';
import { systemService } from '../../api/services/systemService';
import { httpClient } from '../../api/client/httpClient';
import { queryClient } from '../query/queryClient';
import { AppError, UnauthorizedError } from '../../core/errors/AppError';
import { normalizeServerUrl } from '../../api/client/urlUtils';

const STORAGE_KEY_SAVED_SERVERS = 'cinetheme_saved_servers';
const STORAGE_KEY_ACTIVE_SESSION = 'cinetheme_active_session';

function loadSavedServers(): ServerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_SERVERS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return [];
}

function loadSavedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return null;
}

export interface AuthStoreState {
  status: AuthStatus;
  session: AuthSession | null;
  serverInfo: ServerInfo | null;
  savedServers: ServerProfile[];
  error: AppError | null;

  login: (serverUrl: string, username: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  handleSessionExpired: () => void;
  clearError: () => void;
  saveServerProfile: (server: ServerProfile) => void;
  removeSavedServer: (serverId: string) => void;
}

const initialSession = loadSavedSession();

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: initialSession ? 'authenticated' : 'anonymous',
  session: initialSession,
  serverInfo: initialSession
    ? {
        id: initialSession.serverId,
        name: 'Jellyfin Server',
        version: 'Unknown',
        url: initialSession.serverUrl,
        isUsable: true,
      }
    : null,
  savedServers: loadSavedServers(),
  error: null,

  login: async (rawServerUrl: string, username: string, password: string) => {
    set({ status: 'authenticating', error: null });

    try {
      const normalizedUrl = normalizeServerUrl(rawServerUrl);

      // Step 1: Validate server connectivity and usability
      const serverInfo = await systemService.getPublicServerInfo(normalizedUrl);
      if (!serverInfo.isUsable) {
        throw new AppError('Jellyfin server setup is not completed.', { isRecoverable: false });
      }

      // Step 2: Authenticate by name and password
      const session = await authService.authenticateByName(normalizedUrl, {
        Username: username.trim(),
        Pw: password,
      });

      // Step 3: Save profile to multi-server list (NEVER save password)
      const newProfile: ServerProfile = {
        id: session.serverId,
        name: serverInfo.name,
        url: normalizedUrl,
        userId: session.user.id,
        userName: session.user.name,
        accessToken: session.accessToken,
        lastConnected: Date.now(),
      };

      const existingServers = get().savedServers.filter((s) => s.id !== session.serverId);
      const updatedServers = [...existingServers, newProfile];

      try {
        localStorage.setItem(STORAGE_KEY_SAVED_SERVERS, JSON.stringify(updatedServers));
        localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(session));
      } catch {
        // Storage quota or restriction
      }

      set({
        status: 'authenticated',
        session,
        serverInfo,
        savedServers: updatedServers,
        error: null,
      });

      return session;
    } catch (err: unknown) {
      const appErr =
        err instanceof AppError
          ? err
          : new AppError(err instanceof Error ? err.message : 'Authentication failed.');

      set({ status: 'anonymous', error: appErr, session: null });
      throw appErr;
    }
  },

  logout: async () => {
    const currentSession = get().session;
    set({ status: 'invalidating' });

    try {
      if (currentSession) {
        await authService.logout(currentSession.serverUrl, currentSession.accessToken).catch(() => {});
      }
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
      } catch {
        // Ignore
      }

      // Invalidate and clear all server query caches
      queryClient.clear();

      set({
        status: 'anonymous',
        session: null,
        serverInfo: null,
        error: null,
      });
    }
  },

  handleSessionExpired: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch {
      // Ignore
    }

    queryClient.clear();

    set({
      status: 'anonymous',
      session: null,
      serverInfo: null,
      error: new UnauthorizedError('Your session has expired or was revoked. Please log in again.'),
    });
  },

  clearError: () => set({ error: null }),

  saveServerProfile: (server: ServerProfile) => {
    const existingServers = get().savedServers.filter((s) => s.id !== server.id);
    const updated = [...existingServers, server];
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SERVERS, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    set({ savedServers: updated });
  },

  removeSavedServer: (serverId: string) => {
    const updated = get().savedServers.filter((s) => s.id !== serverId);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SERVERS, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    set({ savedServers: updated });
  },
}));

// Connect HTTP client 401 callback to auth store session invalidation
httpClient.setOnUnauthorized(() => {
  useAuthStore.getState().handleSessionExpired();
});
