import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipButtonOverlay } from '../../src/components/player/SkipButtonOverlay';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import { usePlaybackPreferencesStore } from '../../src/state/stores/usePlaybackPreferencesStore';
import type { AnimeSegment } from '../../src/domain/anime/types';
import type { PlayerController } from '../../src/player/playerController';

describe('SkipButtonOverlay Component', () => {
  const mockController = {
    seek: vi.fn(),
  } as unknown as PlayerController;

  const mockSegments: AnimeSegment[] = [
    {
      type: 'INTRO',
      title: 'Opening Theme',
      startTimeSeconds: 60,
      endTimeSeconds: 150,
      source: 'ChapterMetadata',
      confidence: 0.9,
    },
    {
      type: 'OUTRO',
      title: 'Ending Theme',
      startTimeSeconds: 1300,
      endTimeSeconds: 1390,
      source: 'ChapterMetadata',
      confidence: 0.9,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.getState().reset();
    usePlaybackPreferencesStore.setState({
      autoSkipIntro: false,
      autoSkipOutro: false,
    });
  });

  it('renders nothing when playback position is outside intro and outro segments', () => {
    usePlayerStore.getState().setTime(30, 1400, 100);

    const { container } = render(
      <SkipButtonOverlay controller={mockController} segments={mockSegments} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders Skip Intro button during intro timestamp and seeks to intro end on click', () => {
    usePlayerStore.getState().setTime(90, 1400, 200);

    render(<SkipButtonOverlay controller={mockController} segments={mockSegments} />);

    const skipButton = screen.getByRole('button', { name: /Skip Intro/i });
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);

    expect(mockController.seek).toHaveBeenCalledWith(150);
  });

  it('renders Skip Outro button during outro segment', () => {
    usePlayerStore.getState().setTime(1320, 1400, 1400);

    render(<SkipButtonOverlay controller={mockController} segments={mockSegments} />);

    const skipButton = screen.getByRole('button', { name: /Skip Outro/i });
    expect(skipButton).toBeInTheDocument();

    fireEvent.click(skipButton);

    expect(mockController.seek).toHaveBeenCalledWith(1390);
  });

  it('automatically seeks when autoSkipIntro preference is enabled', () => {
    usePlaybackPreferencesStore.setState({ autoSkipIntro: true });
    usePlayerStore.getState().setTime(80, 1400, 200);

    render(<SkipButtonOverlay controller={mockController} segments={mockSegments} />);

    expect(mockController.seek).toHaveBeenCalledWith(150);
  });
});
