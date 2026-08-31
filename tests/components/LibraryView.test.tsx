import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LibraryView } from '../../src/views/LibraryView';
import { AppProviders } from '../../src/app/providers';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

describe('LibraryView Component', () => {
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

  it('renders all library cards when no library is selected', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/library']}>
          <LibraryView />
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getAllByText('Movies').length).toBeGreaterThanOrEqual(1));
    expect(screen.getAllByText('TV Shows').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Anime').length).toBeGreaterThanOrEqual(1);
  });

  it('browses items and shows pagination when library is selected', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/library?id=lib-movies-1']}>
          <LibraryView />
        </MemoryRouter>
      </AppProviders>
    );

    // Verify library heading and items
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Movies' })).toBeInTheDocument());
    expect(await screen.findByText('Cinematic Film 1')).toBeInTheDocument();

    // Verify pagination controls
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next page/i })).toBeInTheDocument();
  });

  it('navigates pages using pagination controls', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/library?id=lib-movies-1&page=1']}>
          <LibraryView />
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getByText('Cinematic Film 1')).toBeInTheDocument());

    const nextBtn = screen.getByRole('button', { name: /Next page/i });
    await user.click(nextBtn);
  });
});
