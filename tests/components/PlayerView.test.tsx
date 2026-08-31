import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '../../src/app/providers';
import { PlayerView } from '../../src/views/PlayerView';
import { useAuthStore } from '../../src/state/stores/useAuthStore';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { queryClient } from '../../src/state/query/queryClient';

function renderPlayerWithItem(itemId: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/player/${itemId}`]}>
        <Routes>
          <Route path="/player/:itemId" element={<PlayerView />} />
          <Route path="/library" element={<div>Library Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

describe('PlayerView Component & Workflow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    usePlayerStore.getState().reset();

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

  it('renders video viewport and HUD for media item', async () => {
    renderPlayerWithItem('movie-item-1');

    expect(screen.getByLabelText(/CineTheme Video Stream/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Inception/i)).toBeInTheDocument();
    });
  });

  it('displays resume prompt when item has saved playback position and handles Resume choice', async () => {
    const user = userEvent.setup();
    renderPlayerWithItem('movie-item-1');

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume Playback/i })).toBeInTheDocument();
    });

    const resumeBtn = screen.getByRole('button', { name: /Resume from 40:00/i });
    await user.click(resumeBtn);

    expect(screen.queryByRole('dialog', { name: /Resume Playback/i })).not.toBeInTheDocument();
  });

  it('displays resume prompt and handles Start Over choice', async () => {
    const user = userEvent.setup();
    renderPlayerWithItem('movie-item-1');

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume Playback/i })).toBeInTheDocument();
    });

    const startOverBtn = screen.getByRole('button', { name: /Start from Beginning/i });
    await user.click(startOverBtn);

    expect(screen.queryByRole('dialog', { name: /Resume Playback/i })).not.toBeInTheDocument();
  });

  it('renders error overlay when fatal playback error occurs and allows retry', async () => {
    const user = userEvent.setup();
    renderPlayerWithItem('error-item-trigger');

    // Handle resume prompt first if item metadata has ticks
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume Playback/i })).toBeInTheDocument();
    });

    const startOverBtn = screen.getByRole('button', { name: /Start from Beginning/i });
    await user.click(startOverBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: /Playback Error/i })).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Retry Playback/i });
    expect(retryBtn).toBeInTheDocument();
    await user.click(retryBtn);
  });
});
