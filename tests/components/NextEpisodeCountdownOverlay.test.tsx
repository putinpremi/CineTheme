import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextEpisodeCountdownOverlay } from '../../src/components/player/NextEpisodeCountdownOverlay';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { usePlaybackPreferencesStore } from '../../src/state/stores/usePlaybackPreferencesStore';

describe('NextEpisodeCountdownOverlay Component', () => {
  const mockOnPlayNext = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    usePlayerStore.getState().reset();
    usePlaybackPreferencesStore.setState({ autoPlayNextEpisode: true });
  });

  it('renders nothing when episode is not near completion', () => {
    usePlayerStore.getState().setTime(100, 1400, 200); // 1300s remaining

    const { container } = render(
      <NextEpisodeCountdownOverlay
        nextEpisodeId="ep-2"
        nextEpisodeTitle="The Beast"
        nextEpisodeNumber={2}
        seriesName="Evangelion"
        onPlayNext={mockOnPlayNext}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders countdown overlay when remaining duration <= 25 seconds', () => {
    usePlayerStore.getState().setTime(1385, 1400, 1400); // 15s remaining

    render(
      <NextEpisodeCountdownOverlay
        nextEpisodeId="ep-2"
        nextEpisodeTitle="The Beast"
        nextEpisodeNumber={2}
        seriesName="Evangelion"
        onPlayNext={mockOnPlayNext}
      />
    );

    expect(screen.getByRole('dialog', { name: /Next Episode Countdown/i })).toBeInTheDocument();
    expect(screen.getByText(/Episode 2: The Beast/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Now/i })).toBeInTheDocument();
  });

  it('triggers onPlayNext immediately when Play Now is clicked', () => {
    usePlayerStore.getState().setTime(1390, 1400, 1400);

    render(
      <NextEpisodeCountdownOverlay
        nextEpisodeId="ep-2"
        nextEpisodeTitle="The Beast"
        nextEpisodeNumber={2}
        seriesName="Evangelion"
        onPlayNext={mockOnPlayNext}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Play Now/i }));
    expect(mockOnPlayNext).toHaveBeenCalledTimes(1);
  });

  it('auto-advances when countdown timer expires', () => {
    usePlayerStore.getState().setTime(1390, 1400, 1400);

    render(
      <NextEpisodeCountdownOverlay
        nextEpisodeId="ep-2"
        nextEpisodeTitle="The Beast"
        nextEpisodeNumber={2}
        seriesName="Evangelion"
        onPlayNext={mockOnPlayNext}
      />
    );

    act(() => {
      vi.advanceTimersByTime(11000);
    });

    expect(mockOnPlayNext).toHaveBeenCalledTimes(1);
  });

  it('dismisses overlay and prevents auto-advancing when dismissed', () => {
    usePlayerStore.getState().setTime(1390, 1400, 1400);

    render(
      <NextEpisodeCountdownOverlay
        nextEpisodeId="ep-2"
        nextEpisodeTitle="The Beast"
        nextEpisodeNumber={2}
        seriesName="Evangelion"
        onPlayNext={mockOnPlayNext}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));

    act(() => {
      vi.advanceTimersByTime(11000);
    });

    expect(mockOnPlayNext).not.toHaveBeenCalled();
  });
});
