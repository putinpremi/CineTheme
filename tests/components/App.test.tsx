import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/app/App';
import { useAuthStore } from '../../src/state/stores/useAuthStore';

describe('Application Boot', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    useAuthStore.setState({
      status: 'anonymous',
      session: null,
      serverInfo: null,
    });
  });

  it('renders application brand and flagship header', async () => {
    render(<App />);

    await waitFor(() => {
      const brandElements = screen.getAllByText(/Cine/i);
      expect(brandElements.length).toBeGreaterThanOrEqual(1);
      expect(brandElements[0]).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated root visit to login card', async () => {
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Connect to Jellyfin/i })
      ).toBeInTheDocument();
    });
  });

  it('renders home hero banner when authenticated and visiting root', async () => {
    window.history.pushState({}, '', '/home');

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

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Cinematic Media Hub/i, level: 1 })
      ).toBeInTheDocument();
    });
  });
});
