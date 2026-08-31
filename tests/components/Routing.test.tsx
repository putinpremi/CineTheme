import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/app/providers';
import { AppShell } from '../../src/components/layout/AppShell';
import { AppRoutes } from '../../src/app/routes';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

function renderWithRoute(initialRoute: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </MemoryRouter>
    </AppProviders>
  );
}

describe('Routing & Authentication Gating Foundation', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    useAuthStore.setState({
      status: 'anonymous',
      session: null,
      serverInfo: null,
    });
  });

  it('renders login view on /login route', async () => {
    renderWithRoute('/login');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeInTheDocument()
    );
  });

  it('redirects unauthenticated user from protected routes to /login', async () => {
    renderWithRoute('/library');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeInTheDocument()
    );
  });

  it('renders protected routes when user is authenticated', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: false, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    renderWithRoute('/library');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Media Libraries/i, level: 1 })).toBeInTheDocument()
    );
  });

  it('renders search view when authenticated on /search route', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: false, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    renderWithRoute('/search');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Explore & Search/i, level: 1 })).toBeInTheDocument()
    );
  });

  it('renders item details when authenticated on /item/:itemId route', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: false, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    renderWithRoute('/item/movie-item-1');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Inception/i, level: 1 })).toBeInTheDocument()
    );
  });

  it('renders player viewport when authenticated on /player/:itemId route', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: false, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    renderWithRoute('/player/test-item-123');
    await waitFor(() =>
      expect(screen.getByLabelText(/CineTheme Video Stream/i)).toBeInTheDocument()
    );
  });

  it('renders 404 page on unknown route', async () => {
    renderWithRoute('/non-existent-route');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /404 - Page Not Found/i })).toBeInTheDocument()
    );
  });
});
