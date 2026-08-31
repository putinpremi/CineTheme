import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from '../../src/views/HomeView';
import { AppProviders } from '../../src/app/providers';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

describe('HomeView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();

    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'test-valid-access-token-xyz',
        serverId: 'server-guid-12345',
        serverUrl: 'http://127.0.0.1:8096',
        user: { id: 'user-guid-67890', name: 'TestCinematicUser', isAdmin: true, isDisabled: false },
        lastConnected: Date.now(),
      },
    });
  });

  it('renders home hero title and sections with real data', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <HomeView />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Cinematic Media Hub/i)).toBeInTheDocument();

    // Wait for libraries and shelves to load
    await waitFor(() => expect(screen.getByText('Movies')).toBeInTheDocument());
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();

    // Verify continue watching section heading and item
    expect(
      screen.getByRole('heading', { level: 2, name: /Continue Watching/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();

    // Verify recently added section heading and item
    expect(
      screen.getByRole('heading', { level: 2, name: /Recently Added/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Cinematic Film 1')).toBeInTheDocument();
  });
});
