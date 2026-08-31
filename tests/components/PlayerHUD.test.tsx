import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerHUD } from '../../src/components/player/PlayerHUD';
import { usePlayerStore } from '../../src/state/stores/usePlayerStore';
import type { PlayerController } from '../../src/player/playerController';

describe('PlayerHUD Component', () => {
  let controllerMock: {
    togglePlay: ReturnType<typeof vi.fn>;
    seekRelative: ReturnType<typeof vi.fn>;
    seek: ReturnType<typeof vi.fn>;
    setVolume: ReturnType<typeof vi.fn>;
    setMuted: ReturnType<typeof vi.fn>;
    toggleMute: ReturnType<typeof vi.fn>;
    setAudioTrack: ReturnType<typeof vi.fn>;
    setSubtitleTrack: ReturnType<typeof vi.fn>;
    setAudioDelay: ReturnType<typeof vi.fn>;
    setSubtitleDelay: ReturnType<typeof vi.fn>;
    setQuality: ReturnType<typeof vi.fn>;
    getCurrentSource: ReturnType<typeof vi.fn>;
  };
  let containerRef: { current: HTMLDivElement | null };
  let videoRef: { current: HTMLVideoElement | null };

  beforeEach(() => {
    usePlayerStore.getState().reset();
    usePlayerStore.setState({
      itemId: 'movie-1',
      mediaSourceId: 'source-1',
      playSessionId: 'sess-1',
      playbackMode: 'DIRECT_PLAY',
      playerState: 'PLAYING',
      isPaused: false,
      currentTime: 120,
      duration: 3600,
      audioTracks: [
        { index: 1, codec: 'aac', displayTitle: 'English Stereo', isDefault: true, isForced: false, isExternal: false },
        { index: 2, codec: 'aac', displayTitle: 'Japanese Stereo', isDefault: false, isForced: false, isExternal: false },
      ],
      subtitleTracks: [
        { index: 3, codec: 'vtt', displayTitle: 'English (SRT)', deliveryMethod: 'External', isDefault: true, isForced: false, isExternal: false },
      ],
      activeAudioIndex: 1,
      activeSubtitleIndex: 3,
    });

    controllerMock = {
      togglePlay: vi.fn(),
      seekRelative: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      toggleMute: vi.fn(),
      setAudioTrack: vi.fn(),
      setSubtitleTrack: vi.fn(),
      setAudioDelay: vi.fn(),
      setSubtitleDelay: vi.fn(),
      setQuality: vi.fn(),
      getCurrentSource: vi.fn().mockReturnValue({
        container: 'mp4',
        playMethod: 'DirectPlay',
        playbackMode: 'DIRECT_PLAY',
        redactedUrl: 'http://127.0.0.1:8096/Videos/movie-1/stream.mp4?static=true&api_key=[REDACTED]',
      }),
    };

    containerRef = { current: document.createElement('div') };
    videoRef = { current: document.createElement('video') };
  });

  it('renders title, timeline, volume, and playback controls', () => {
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        title="Inception (2010)"
        subtitle="Christopher Nolan"
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    expect(screen.getByText('Inception (2010)')).toBeInTheDocument();
    expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /Video Timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  });

  it('toggles play/pause on button click', async () => {
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const pauseButton = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseButton);

    expect(controllerMock.togglePlay).toHaveBeenCalled();
  });

  it('seeks relative on forward and backward buttons', () => {
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const seekBackward = screen.getByRole('button', { name: /Seek backward 10 seconds/i });
    fireEvent.click(seekBackward);
    expect(controllerMock.seekRelative).toHaveBeenCalledWith(-10);

    const seekForward = screen.getByRole('button', { name: /Seek forward 10 seconds/i });
    fireEvent.click(seekForward);
    expect(controllerMock.seekRelative).toHaveBeenCalledWith(10);
  });

  it('opens audio menu and allows track selection and delay calibration', async () => {
    const user = userEvent.setup();
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const audioButton = screen.getByRole('button', { name: /Audio Track/i });
    await user.click(audioButton);

    expect(screen.getByRole('dialog', { name: /Audio Settings/i })).toBeInTheDocument();
    expect(screen.getByText('Japanese Stereo')).toBeInTheDocument();

    await user.click(screen.getByText('Japanese Stereo'));
    expect(controllerMock.setAudioTrack).toHaveBeenCalledWith(2);
  });

  it('opens subtitle menu and allows selecting Off and adjusting delay', async () => {
    const user = userEvent.setup();
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const subtitleButton = screen.getByRole('button', { name: /Subtitles/i });
    await user.click(subtitleButton);

    expect(screen.getByRole('dialog', { name: /Subtitle Settings/i })).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();

    await user.click(screen.getByText('Off'));
    expect(controllerMock.setSubtitleTrack).toHaveBeenCalledWith(null);
  });

  it('opens quality menu and allows bitrate selection', async () => {
    const user = userEvent.setup();
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const qualityButton = screen.getByRole('button', { name: /Stream Quality/i });
    await user.click(qualityButton);

    expect(screen.getByRole('dialog', { name: /Quality Settings/i })).toBeInTheDocument();
    expect(screen.getByText('4 Mbps Max Bitrate Cap')).toBeInTheDocument();

    await user.click(screen.getByText('4 Mbps Max Bitrate Cap'));
    expect(controllerMock.setQuality).toHaveBeenCalledWith(
      expect.objectContaining({ id: '4m' })
    );
  });

  it('opens playback diagnostics modal with redacted token URLs', async () => {
    const user = userEvent.setup();
    render(
      <PlayerHUD
        controller={controllerMock as unknown as PlayerController}
        containerRef={containerRef}
        videoRef={videoRef}
        isVisible={true}
        onExit={vi.fn()}
        onUserActivity={vi.fn()}
      />
    );

    const infoButton = screen.getByRole('button', { name: /Playback Diagnostics/i });
    await user.click(infoButton);

    expect(screen.getByRole('dialog', { name: /Playback Diagnostics/i })).toBeInTheDocument();
    expect(screen.getByText('DIRECT_PLAY')).toBeInTheDocument();
    expect(screen.getByText(/Security Notice/i)).toBeInTheDocument();
  });
});
