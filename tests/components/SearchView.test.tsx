import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SearchView } from '../../src/views/SearchView';
import { AppProviders } from '../../src/app/providers';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { queryClient } from '../../src/state/query/queryClient';

describe('SearchView Component', () => {
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

  it('renders initial search prompt when no query is present', () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/search']}>
          <Routes>
            <Route path="/search" element={<SearchView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Explore & Search/i })).toBeInTheDocument();
    expect(screen.getByText(/Discover Your Media/i)).toBeInTheDocument();
  });

  it('searches for items when input is provided and renders results', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/search?q=Inception']}>
          <Routes>
            <Route path="/search" element={<SearchView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument());
    expect(screen.getByText(/Found/i)).toBeInTheDocument();
  });

  it('filters by media type using filter buttons', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/search?q=Film']}>
          <Routes>
            <Route path="/search" element={<SearchView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getAllByText(/Cinematic Film/i).length).toBeGreaterThan(0));

    const moviesBtn = screen.getByRole('button', { name: /Movies/i });
    await user.click(moviesBtn);
  });

  it('displays empty state when search returns zero results', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/search?q=NonExistentQueryXYZ123']}>
          <Routes>
            <Route path="/search" element={<SearchView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getByText(/No Results Found/i)).toBeInTheDocument());
  });

  it('clears search input when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/search?q=Inception']}>
          <Routes>
            <Route path="/search" element={<SearchView />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Inception')).toBeInTheDocument());

    const clearBtn = screen.getByRole('button', { name: /Clear search input/i });
    await user.click(clearBtn);

    expect(screen.getByPlaceholderText(/Search by title/i)).toHaveValue('');
  });
});
