import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginView } from '../../src/views/LoginView';
import { useAuthStore } from '../../src/state/stores/useAuthStore';

describe('LoginView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      status: 'anonymous',
      session: null,
      serverInfo: null,
      error: null,
    });
  });

  it('renders login form inputs and controls', () => {
    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Connect to Jellyfin/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Jellyfin Server URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /Show password/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('handles successful login submission', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    const serverInput = screen.getByLabelText(/Jellyfin Server URL/i);
    const userInput = screen.getByLabelText(/^Username$/i);
    const passInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.clear(serverInput);
    await user.type(serverInput, 'http://127.0.0.1:8096');
    await user.type(userInput, 'demo');
    await user.type(passInput, 'password123');

    await user.click(submitBtn);

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session?.user.name).toBe('TestCinematicUser');
  });

  it('displays error alert on invalid credentials', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    const serverInput = screen.getByLabelText(/Jellyfin Server URL/i);
    const userInput = screen.getByLabelText(/^Username$/i);
    const passInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.clear(serverInput);
    await user.type(serverInput, 'http://127.0.0.1:8096');
    await user.type(userInput, 'wrong_user');
    await user.type(passInput, 'wrong_pass');

    await user.click(submitBtn);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Invalid username or password/i)).toBeInTheDocument();
  });

  it('renders connected server status card when already authenticated', () => {
    useAuthStore.setState({
      status: 'authenticated',
      session: {
        accessToken: 'valid-token',
        serverId: 'server-12345',
        serverUrl: 'https://jellyfin.example.com',
        user: { id: 'u1', name: 'CinematicStreamer', isAdmin: true, isDisabled: false },
        lastConnected: Date.now(),
      },
      serverInfo: {
        id: 'server-12345',
        name: 'Home Jellyfin',
        version: '10.9.11',
        url: 'https://jellyfin.example.com',
        isUsable: true,
      },
    });

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Connected to Server/i)).toBeInTheDocument();
    expect(screen.getByText(/CinematicStreamer/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to CineTheme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disconnect \/ Sign Out/i })).toBeInTheDocument();
  });
});
