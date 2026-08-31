import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';
import { AuthenticationError } from '../../src/core/errors/AppError';

describe('Authentication Integration Flow (MSW)', () => {
  const serverUrl = 'http://127.0.0.1:8096';

  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    useAuthStore.setState({
      status: 'anonymous',
      session: null,
      serverInfo: null,
      savedServers: [],
      error: null,
    });
  });

  it('completes successful login flow and does NOT persist password', async () => {
    const { login } = useAuthStore.getState();

    const session = await login(serverUrl, 'demo', 'password123');

    expect(session.accessToken).toBe('test-valid-access-token-xyz');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session?.user.name).toBe('TestCinematicUser');

    // Verify localStorage NEVER contains plaintext password
    const rawSavedServers = localStorage.getItem('cinetheme_saved_servers') || '';
    const rawActiveSession = localStorage.getItem('cinetheme_active_session') || '';

    expect(rawSavedServers).not.toContain('password123');
    expect(rawActiveSession).not.toContain('password123');
  });

  it('rejects invalid credentials with AuthenticationError and remains anonymous', async () => {
    const { login } = useAuthStore.getState();

    await expect(login(serverUrl, 'wrong_user', 'wrong_pass')).rejects.toThrow(AuthenticationError);

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().error).toBeInstanceOf(AuthenticationError);
  });

  it('handles multi-server profile storage and credential isolation', async () => {
    const { saveServerProfile, removeSavedServer } = useAuthStore.getState();

    saveServerProfile({
      id: 'server-alpha',
      name: 'Alpha Server',
      url: 'https://alpha.example.com',
      accessToken: 'token-alpha-123',
      lastConnected: 1000,
    });

    saveServerProfile({
      id: 'server-beta',
      name: 'Beta Server',
      url: 'https://beta.example.com',
      accessToken: 'token-beta-456',
      lastConnected: 2000,
    });

    const servers = useAuthStore.getState().savedServers;
    expect(servers).toHaveLength(2);
    expect(servers.find((s) => s.id === 'server-alpha')?.accessToken).toBe('token-alpha-123');
    expect(servers.find((s) => s.id === 'server-beta')?.accessToken).toBe('token-beta-456');

    removeSavedServer('server-alpha');
    expect(useAuthStore.getState().savedServers).toHaveLength(1);
    expect(useAuthStore.getState().savedServers[0]?.id).toBe('server-beta');
  });

  it('clears active session and query cache on logout', async () => {
    const { login, logout } = useAuthStore.getState();

    await login(serverUrl, 'demo', 'password123');
    expect(useAuthStore.getState().status).toBe('authenticated');

    // Populate mock query cache entry
    queryClient.setQueryData(['test-data'], { value: 'cached' });
    expect(queryClient.getQueryData(['test-data'])).toBeDefined();

    await logout();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem('cinetheme_active_session')).toBeNull();
    expect(queryClient.getQueryData(['test-data'])).toBeUndefined();
  });

  it('clears active session immediately upon 401 session expiration', async () => {
    const { login, handleSessionExpired } = useAuthStore.getState();

    await login(serverUrl, 'demo', 'password123');
    expect(useAuthStore.getState().status).toBe('authenticated');

    handleSessionExpired();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().error?.message).toContain('expired');
  });
});
