import * as React from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Music,
  Subtitles,
  Sliders,
  Maximize,
  Minimize,
  PictureInPicture,
  Info,
  Gauge,
} from 'lucide-react';
import { usePlayerStore } from '../../state/stores/usePlayerStore';
import { PlayerTimeline } from './PlayerTimeline';
import { PlayerVolumeControl } from './PlayerVolumeControl';
import { AudioTrackMenu } from './AudioTrackMenu';
import { SubtitleTrackMenu } from './SubtitleTrackMenu';
import { QualityMenu } from './QualityMenu';
import { PlaybackSpeedMenu } from './PlaybackSpeedMenu';
import { PlaybackStatsModal } from './PlaybackStatsModal';
import { isFullscreen, toggleFullscreen } from '../../utils/fullscreenUtils';
import { isPipSupported, togglePip } from '../../utils/pipUtils';
import type { PlayerController } from '../../player/playerController';
import type { EpisodeNavigationInfo, TrickplayManifest } from '../../domain/anime/types';

export interface PlayerHUDProps {
  controller: PlayerController | null;
  containerRef: React.RefObject<HTMLElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  title?: string;
  subtitle?: string;
  episodeInfo?: EpisodeNavigationInfo | null;
  trickplayManifest?: TrickplayManifest | null;
  serverUrl?: string;
  itemId?: string;
  token?: string;
  isVisible: boolean;
  onExit: () => void;
  onUserActivity: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export function PlayerHUD({
  controller,
  containerRef,
  videoRef,
  title = 'CineTheme Stream',
  subtitle,
  episodeInfo,
  trickplayManifest,
  serverUrl,
  itemId,
  token,
  isVisible,
  onExit,
  onUserActivity,
  onNextEpisode,
  onPrevEpisode,
}: PlayerHUDProps) {
  const isPaused = usePlayerStore((s) => s.isPaused);
  const activeSubtitleIndex = usePlayerStore((s) => s.activeSubtitleIndex);
  const selectedQuality = usePlayerStore((s) => s.selectedQuality);
  const playbackRate = usePlayerStore((s) => s.playbackRate);

  const [isAudioMenuOpen, setIsAudioMenuOpen] = React.useState(false);
  const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = React.useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = React.useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = React.useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = React.useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = React.useState(false);

  const pipAvailable = React.useMemo(() => isPipSupported(), []);

  // Sync fullscreen state
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(isFullscreen());
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const closeAllMenus = React.useCallback(() => {
    setIsAudioMenuOpen(false);
    setIsSubtitleMenuOpen(false);
    setIsQualityMenuOpen(false);
    setIsSpeedMenuOpen(false);
  }, []);

  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      toggleFullscreen(containerRef.current);
    }
  };

  const handleTogglePip = () => {
    if (videoRef.current) {
      togglePip(videoRef.current);
    }
  };

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseMove={onUserActivity}
      onTouchStart={onUserActivity}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-2 pb-6 px-3 -mx-3 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit Player"
            className="p-2 rounded-xl bg-surface-900/60 hover:bg-surface-800 text-surface-200 hover:text-surface-50 backdrop-blur-md border border-surface-700/50 transition-colors focus-ring"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-bold text-surface-50 drop-shadow-md truncate max-w-xs sm:max-w-md md:max-w-xl">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs text-surface-300 drop-shadow truncate">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            aria-label="Playback Diagnostics"
            className="p-2 rounded-xl bg-surface-900/60 hover:bg-surface-800 text-surface-300 hover:text-surface-50 backdrop-blur-md border border-surface-700/50 transition-colors focus-ring"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Flyout Menus */}
      <div className="pointer-events-auto">
        <AudioTrackMenu
          controller={controller}
          isOpen={isAudioMenuOpen}
          onClose={() => setIsAudioMenuOpen(false)}
        />
        <SubtitleTrackMenu
          controller={controller}
          isOpen={isSubtitleMenuOpen}
          onClose={() => setIsSubtitleMenuOpen(false)}
        />
        <QualityMenu
          controller={controller}
          isOpen={isQualityMenuOpen}
          onClose={() => setIsQualityMenuOpen(false)}
        />
        <PlaybackSpeedMenu
          controller={controller}
          isOpen={isSpeedMenuOpen}
          onClose={() => setIsSpeedMenuOpen(false)}
        />
        <PlaybackStatsModal
          controller={controller}
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="pointer-events-auto flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-2 pt-8 px-4 -mx-4 rounded-b-2xl">
        {/* Scrubber Timeline with Trickplay Preview */}
        <PlayerTimeline
          controller={controller}
          trickplayManifest={trickplayManifest}
          serverUrl={serverUrl}
          itemId={itemId}
          token={token}
        />

        {/* Playback Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left: Playback & Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Previous Episode Button (if available) */}
            {episodeInfo?.previousEpisodeId && (
              <button
                type="button"
                onClick={onPrevEpisode}
                aria-label="Previous Episode"
                className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
              >
                <SkipBack className="h-5 w-5" />
              </button>
            )}

            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => controller?.togglePlay()}
              aria-label={isPaused ? 'Play' : 'Pause'}
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold shadow-lg transition-transform active:scale-95 focus-ring"
            >
              {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
            </button>

            {/* Next Episode Button (if available) */}
            {episodeInfo?.nextEpisodeId && (
              <button
                type="button"
                onClick={onNextEpisode}
                aria-label="Next Episode"
                className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}

            {/* Seek -10s */}
            <button
              type="button"
              onClick={() => controller?.seekRelative(-10)}
              aria-label="Seek backward 10 seconds"
              className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            {/* Seek +10s */}
            <button
              type="button"
              onClick={() => controller?.seekRelative(10)}
              aria-label="Seek forward 10 seconds"
              className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
            >
              <RotateCw className="h-5 w-5" />
            </button>

            {/* Volume Control */}
            <PlayerVolumeControl controller={controller} />
          </div>

          {/* Right: Audio, Subtitles, Quality, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Track Menu */}
            <button
              type="button"
              onClick={() => {
                closeAllMenus();
                setIsAudioMenuOpen((prev) => !prev);
              }}
              aria-label="Audio Track"
              className={`p-2 rounded-lg transition-colors focus-ring ${
                isAudioMenuOpen
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-surface-300 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <Music className="h-5 w-5" />
            </button>

            {/* Subtitle Track Menu */}
            <button
              type="button"
              onClick={() => {
                closeAllMenus();
                setIsSubtitleMenuOpen((prev) => !prev);
              }}
              aria-label="Subtitles"
              className={`p-2 rounded-lg transition-colors focus-ring relative ${
                isSubtitleMenuOpen || activeSubtitleIndex !== null
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-surface-300 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <Subtitles className="h-5 w-5" />
              {activeSubtitleIndex !== null && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </button>

            {/* Quality Menu */}
            <button
              type="button"
              onClick={() => {
                closeAllMenus();
                setIsQualityMenuOpen((prev) => !prev);
              }}
              aria-label="Stream Quality"
              className={`p-2 rounded-lg transition-colors focus-ring flex items-center gap-1 text-xs ${
                isQualityMenuOpen
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-surface-300 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <Sliders className="h-5 w-5" />
              {selectedQuality && (
                <span className="hidden md:inline font-mono text-[10px] text-brand-300 font-semibold">
                  {selectedQuality.height ? `${selectedQuality.height}p` : 'Auto'}
                </span>
              )}
            </button>

            {/* Playback Speed Menu */}
            <button
              type="button"
              onClick={() => {
                closeAllMenus();
                setIsSpeedMenuOpen((prev) => !prev);
              }}
              aria-label="Playback Speed"
              className={`p-2 rounded-lg transition-colors focus-ring flex items-center gap-1 text-xs ${
                isSpeedMenuOpen || playbackRate !== 1.0
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold'
                  : 'text-surface-300 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <Gauge className="h-5 w-5" />
              {playbackRate !== 1.0 && (
                <span className="font-mono text-[10px] text-brand-300 font-semibold">
                  {playbackRate}x
                </span>
              )}
            </button>

            {/* Picture-in-Picture */}
            {pipAvailable && (
              <button
                type="button"
                onClick={handleTogglePip}
                aria-label="Picture in Picture"
                className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
              >
                <PictureInPicture className="h-5 w-5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
            >
              {isFullscreenActive ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
