import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ItemDetailsView } from '../../src/views/ItemDetailsView';
import { AppProviders } from '../../src/app/providers';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

describe('ItemDetailsView Component', () => {
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

  it('renders item metadata, cast list, genres, and overview', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/item/movie-item-1']}>
          <Routes>
            <Route path="/item/:itemId" element={<ItemDetailsView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Inception' })).toBeInTheDocument()
    );

    expect(screen.getByText(/Original Title: Inception \(Original\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2010/i)).toBeInTheDocument();
    expect(screen.getByText(/2h 28m/i)).toBeInTheDocument();
    expect(screen.getByText('8.8')).toBeInTheDocument();
    expect(screen.getByText('PG-13')).toBeInTheDocument();

    // Verify overview
    expect(screen.getByText(/A thief who steals corporate secrets/i)).toBeInTheDocument();

    // Verify genres
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();

    // Verify cast
    expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
    expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();

    // Verify play button
    expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
  });
});
