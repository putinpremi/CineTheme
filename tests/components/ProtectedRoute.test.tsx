import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../src/app/ProtectedRoute';
import { useAuthStore } from '../../src/state/stores/useAuthStore';

function DummyProtected() {
  return <div>Protected Content Visible</div>;
}

function DummyLogin() {
  return <div>Login Page Reached</div>;
}

describe('ProtectedRoute Authentication Gating', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'anonymous',
      session: null,
      serverInfo: null,
    });
  });

  it('redirects unauthenticated user to /login', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DummyProtected />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<DummyLogin />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content Visible')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Reached')).toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'valid-token',
        serverId: 'server-1',
        serverUrl: 'https://jellyfin.local',
        user: { id: 'u1', name: 'User', isAdmin: false, isDisabled: false },
        lastConnected: Date.now(),
      },
    });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DummyProtected />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<DummyLogin />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content Visible')).toBeInTheDocument();
  });
});
