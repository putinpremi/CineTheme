import * as React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PlayerController } from '../player/playerController';
import { useAuthStore } from '../state/stores/useAuthStore';
import { useItemDetails } from '../hooks/useMediaQueries';
import {
  useAnimeSegments,
  useAdjacentEpisodes,
  useTrickplayManifest,
} from '../hooks/useAnimeQueries';
import { PlayerHUD } from '../components/player/PlayerHUD';
import { BufferingOverlay } from '../components/player/BufferingOverlay';
import { ErrorOverlay } from '../components/player/ErrorOverlay';
import { ResumeDialog } from '../components/player/ResumeDialog';
import { SkipButtonOverlay } from '../components/player/SkipButtonOverlay';
import { NextEpisodeCountdownOverlay } from '../components/player/NextEpisodeCountdownOverlay';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { usePlayerHotkeys } from '../hooks/usePlayerHotkeys';
import { setMediaSessionMetadata, setMediaSessionHandlers } from '../utils/mediaSessionUtils';
import { buildItemImageUrl } from '../api/client/imageUtils';
import { mobileAdapter } from '../platform/mobileAdapter';

export function PlayerView() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const controllerRef = React.useRef<PlayerController | null>(null);

  const [resumePromptTime, setResumePromptTime] = React.useState<number | null>(null);
  const [hasResolvedResume, setHasResolvedResume] = React.useState(false);

  // Fetch item metadata for title, season/episode numbering, and backdrop poster
  const { data: item, isSuccess, isError } = useItemDetails(itemId || '');

  // Anime Intelligence & Episode Navigation Hooks
  const segments = useAnimeSegments(itemId);
  const { data: episodeInfo } = useAdjacentEpisodes(
    item?.seriesId,
    item?.seasonId,
    itemId
  );
  const { data: trickplayManifest } = useTrickplayManifest(itemId);

  const { isVisible, showControls, toggleControls, resetTimer } = usePlayerControls({
    hideTimeoutMs: 3500,
  });

  const handleExit = React.useCallback(() => {
    controllerRef.current?.destroy();
    navigate(-1);
  }, [navigate]);

  usePlayerHotkeys({
    controllerRef,
    containerRef,
    onCloseMenu: () => resetTimer(),
  });

  // Hardware / Remote Back Button Handler (LIFO)
  React.useEffect(() => {
    const unregister = mobileAdapter.registerBackButtonHandler(() => {
      if (resumePromptTime !== null) {
        setResumePromptTime(null);
        return true;
      }
      handleExit();
      return true;
    });

    return () => {
      unregister();
    };
  }, [resumePromptTime, handleExit]);

  const handleLogin = React.useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Initial playback negotiation
  const startPlayback = React.useCallback(
    async (startSeconds = 0) => {
      if (!videoRef.current || !session || !itemId) return;

      if (!controllerRef.current) {
        const controller = new PlayerController();
        controllerRef.current = controller;

        controller.initialize(videoRef.current, {
          serverUrl: session.serverUrl,
          userId: session.user.id,
          token: session.accessToken,
          onUnauthorized: handleLogin,
        });
      }

      await controllerRef.current.loadMedia(itemId, {
        startTimeSeconds: startSeconds,
        autoPlay: true,
      });
    },
    [itemId, session, handleLogin]
  );

  // Reset resume resolution state when switching episodes
  React.useEffect(() => {
    setHasResolvedResume(false);
    setResumePromptTime(null);
  }, [itemId]);

  // Check resume status once item details load
  React.useEffect(() => {
    if (hasResolvedResume) return;

    if (isSuccess && item) {
      const startParam = searchParams.get('start');
      const resumeParam = searchParams.get('resume');

      if (startParam !== null) {
        setHasResolvedResume(true);
        const targetSeconds = Math.max(0, parseFloat(startParam) || 0);
        startPlayback(targetSeconds);
      } else if (resumeParam === 'false') {
        setHasResolvedResume(true);
        startPlayback(0);
      } else if ((item.playbackPositionSeconds || 0) > 10) {
        setResumePromptTime(item.playbackPositionSeconds || 0);
      } else {
        setHasResolvedResume(true);
        startPlayback(0);
      }
    } else if (isError) {
      setHasResolvedResume(true);
      startPlayback(0);
    }
  }, [item, isSuccess, isError, hasResolvedResume, searchParams, startPlayback]);

  const handleResume = () => {
    setHasResolvedResume(true);
    const startSecs = resumePromptTime || 0;
    setResumePromptTime(null);
    startPlayback(startSecs);
  };

  const handleStartOver = () => {
    setHasResolvedResume(true);
    setResumePromptTime(null);
    startPlayback(0);
  };

  // Next / Previous episode transitions
  const handleNextEpisode = React.useCallback(() => {
    if (episodeInfo?.nextEpisodeId) {
      navigate(`/player/${episodeInfo.nextEpisodeId}`);
    }
  }, [episodeInfo, navigate]);

  const handlePrevEpisode = React.useCallback(() => {
    if (episodeInfo?.previousEpisodeId) {
      navigate(`/player/${episodeInfo.previousEpisodeId}`);
    }
  }, [episodeInfo, navigate]);

  // MediaSession metadata integration
  React.useEffect(() => {
    if (!item || !session) return;

    const posterUrl = item.primaryImageTag
      ? buildItemImageUrl(session.serverUrl, item.id, 'Primary', { maxWidth: 512, tag: item.primaryImageTag })
      : undefined;

    const title = item.name || 'CineTheme Stream';
    const subtitle = item.seriesName
      ? `${item.seriesName} • S${item.parentIndexNumber || 1}:E${item.indexNumber || 1}`
      : item.productionYear?.toString();

    setMediaSessionMetadata({
      title,
      artist: subtitle,
      album: item.seriesName,
      artworkUrl: posterUrl,
    });

    const cleanupHandlers = setMediaSessionHandlers({
      onPlay: () => controllerRef.current?.play(),
      onPause: () => controllerRef.current?.pause(),
      onSeekBackward: () => controllerRef.current?.seekRelative(-10),
      onSeekForward: () => controllerRef.current?.seekRelative(10),
      onNextTrack: episodeInfo?.nextEpisodeId ? handleNextEpisode : undefined,
      onPreviousTrack: episodeInfo?.previousEpisodeId ? handlePrevEpisode : undefined,
    });

    return () => cleanupHandlers();
  }, [item, session, episodeInfo, handleNextEpisode, handlePrevEpisode]);

  // Teardown on unmount
  React.useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  const displayTitle = item?.name || 'CineTheme Video Stream';
  const displaySubtitle = item?.seriesName
    ? `${item.seriesName} — Season ${item.parentIndexNumber || 1}, Episode ${item.indexNumber || 1}`
    : item?.productionYear?.toString();

  // Double tap gesture for mobile seeking
  const lastTapRef = React.useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const isDoubleTap = now - lastTapRef.current.time < 300 && Math.abs(touchX - lastTapRef.current.x) < 50;

    if (isDoubleTap) {
      if (touchX < rect.width * 0.35) {
        controllerRef.current?.seekRelative(-10);
      } else if (touchX > rect.width * 0.65) {
        controllerRef.current?.seekRelative(10);
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: touchX };
      toggleControls();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black overflow-hidden flex items-center justify-center select-none"
      onMouseMove={showControls}
    >
      {/* Video Viewport Container */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black pointer-events-none"
          playsInline
          aria-label="CineTheme Video Stream"
        />

        {/* Buffering & Recovery Overlay */}
        <BufferingOverlay />

        {/* Actionable Error Overlay */}
        <ErrorOverlay
          onRetry={() => startPlayback(0)}
          onExit={handleExit}
          onLogin={handleLogin}
        />

        {/* Resume Modal */}
        <ResumeDialog
          isOpen={resumePromptTime !== null}
          resumePositionSeconds={resumePromptTime || 0}
          onResume={handleResume}
          onStartOver={handleStartOver}
        />

        {/* Skip Intro / Outro Floating Button Overlay */}
        <SkipButtonOverlay
          controller={controllerRef.current}
          segments={segments}
        />

        {/* Auto Next Episode Countdown Overlay */}
        <NextEpisodeCountdownOverlay
          nextEpisodeId={episodeInfo?.nextEpisodeId}
          nextEpisodeTitle={episodeInfo?.nextEpisodeTitle}
          nextEpisodeNumber={episodeInfo?.nextEpisodeNumber}
          seriesName={episodeInfo?.seriesName}
          onPlayNext={handleNextEpisode}
        />
      </div>

      {/* Cinematic HUD Overlay */}
      <PlayerHUD
        controller={controllerRef.current}
        containerRef={containerRef}
        videoRef={videoRef}
        title={displayTitle}
        subtitle={displaySubtitle}
        episodeInfo={episodeInfo}
        trickplayManifest={trickplayManifest}
        serverUrl={session?.serverUrl}
        itemId={itemId}
        token={session?.accessToken}
        isVisible={isVisible}
        onExit={handleExit}
        onUserActivity={showControls}
        onNextEpisode={handleNextEpisode}
        onPrevEpisode={handlePrevEpisode}
      />
    </div>
  );
}
