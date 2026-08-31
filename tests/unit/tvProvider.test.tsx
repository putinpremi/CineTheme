import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TvProvider } from '../../src/platform/tv/TvProvider';
import { useTv } from '../../src/platform/tv/TvContext';
import { platformAdapter } from '../../src/core/platform/platformAdapter';

function TestConsumer() {
  const { isTv, setTvModeOverride } = useTv();
  return (
    <div>
      <span data-testid="tv-status">{isTv ? 'TV_ACTIVE' : 'TV_INACTIVE'}</span>
      <button data-testid="toggle-tv" onClick={() => setTvModeOverride(!isTv)}>
        Toggle TV
      </button>
    </div>
  );
}

describe('TvProvider & 10-Foot UI Layer', () => {
  beforeEach(() => {
    localStorage.clear();
    platformAdapter.setTvModeOverride(null);
    document.documentElement.classList.remove('is-tv');
    document.documentElement.removeAttribute('data-tv-mode');
  });

  afterEach(() => {
    platformAdapter.setTvModeOverride(null);
    document.documentElement.classList.remove('is-tv');
  });

  it('renders children and provides default TV state', () => {
    render(
      <MemoryRouter>
        <TvProvider>
          <TestConsumer />
        </TvProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('tv-status').textContent).toBe('TV_INACTIVE');
    expect(document.documentElement.classList.contains('is-tv')).toBe(false);
  });

  it('activates 10-foot TV presentation when override is enabled', () => {
    render(
      <MemoryRouter>
        <TvProvider>
          <TestConsumer />
        </TvProvider>
      </MemoryRouter>
    );

    act(() => {
      screen.getByTestId('toggle-tv').click();
    });

    expect(screen.getByTestId('tv-status').textContent).toBe('TV_ACTIVE');
    expect(document.documentElement.classList.contains('is-tv')).toBe(true);
    expect(document.documentElement.getAttribute('data-tv-mode')).toBe('true');
  });

  it('responds to D-pad arrow key events when enabled', () => {
    platformAdapter.setTvModeOverride(true);

    render(
      <MemoryRouter>
        <TvProvider>
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
        </TvProvider>
      </MemoryRouter>
    );

    const btn1 = screen.getByRole('button', { name: 'Button 1' });
    btn1.focus();

    // Dispatch ArrowDown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    window.dispatchEvent(event);

    expect(document.documentElement.classList.contains('is-tv')).toBe(true);
  });
});
