import { create } from 'zustand';
import type {
  AudioTrack,
  PlaybackError,
  PlaybackMode,
  PlaybackQuality,
  PlayerState,
  SubtitleTrack,
} from '../../domain/player/types';

export interface PlayerStoreState {
  itemId: string | null;
  mediaSourceId: string | null;
  playSessionId: string | null;
  playbackMode: PlaybackMode | null;
  playerState: PlayerState;
  state: PlayerState; // Alias for backwards-compatibility
  currentTime: number;
  duration: number;
  bufferedTime: number;
  isPaused: boolean;
  isMuted: boolean;
  volume: number;
  audioDelayMs: number;
  subtitleDelayMs: number;
  activeAudioIndex: number | null;
  activeSubtitleIndex: number | null;
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  selectedQuality: PlaybackQuality | null;
  playbackRate: number;
  error: PlaybackError | null;
  recoveryAttempt: number;

  // Actions
  setSession: (params: {
    itemId: string;
    mediaSourceId: string;
    playSessionId: string;
    playbackMode: PlaybackMode;
    duration: number;
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
    activeAudioIndex?: number | null;
    activeSubtitleIndex?: number | null;
    initialTime?: number;
  }) => void;
  setPlayerState: (playerState: PlayerState) => void;
  setTime: (currentTime: number, duration?: number, bufferedTime?: number) => void;
  setPaused: (isPaused: boolean) => void;
  setVolume: (volume: number, isMuted?: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setPlaybackRate: (playbackRate: number) => void;
  setAudioDelayMs: (audioDelayMs: number) => void;
  setSubtitleDelayMs: (subtitleDelayMs: number) => void;
  setActiveAudioIndex: (index: number | null) => void;
  setActiveSubtitleIndex: (index: number | null) => void;
  setSelectedQuality: (quality: PlaybackQuality | null) => void;
  setError: (error: PlaybackError | null) => void;
  incrementRecoveryAttempt: () => number;
  resetRecovery: () => void;
  reset: () => void;
}

const initialState = {
  itemId: null,
  mediaSourceId: null,
  playSessionId: null,
  playbackMode: null,
  playerState: 'IDLE' as PlayerState,
  state: 'IDLE' as PlayerState,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  isPaused: true,
  isMuted: false,
  volume: 1,
  playbackRate: 1.0,
  audioDelayMs: 0,
  subtitleDelayMs: 0,
  activeAudioIndex: null,
  activeSubtitleIndex: null,
  audioTracks: [],
  subtitleTracks: [],
  selectedQuality: null,
  error: null,
  recoveryAttempt: 0,
};

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  ...initialState,

  setSession: (params) =>
    set({
      itemId: params.itemId,
      mediaSourceId: params.mediaSourceId,
      playSessionId: params.playSessionId,
      playbackMode: params.playbackMode,
      duration: params.duration,
      audioTracks: params.audioTracks,
      subtitleTracks: params.subtitleTracks,
      activeAudioIndex: params.activeAudioIndex ?? null,
      activeSubtitleIndex: params.activeSubtitleIndex ?? null,
      currentTime: params.initialTime ?? 0,
      playerState: 'READY',
      state: 'READY',
      isPaused: true,
      error: null,
      recoveryAttempt: 0,
    }),

  setPlayerState: (playerState) => set({ playerState, state: playerState }),

  setTime: (currentTime, duration, bufferedTime) =>
    set((state) => ({
      currentTime,
      duration: typeof duration === 'number' && duration > 0 ? duration : state.duration,
      bufferedTime: typeof bufferedTime === 'number' ? bufferedTime : state.bufferedTime,
    })),

  setPaused: (isPaused) =>
    set((state) => {
      const nextState: PlayerState =
        state.playerState === 'PLAYING' && isPaused
          ? 'PAUSED'
          : state.playerState === 'PAUSED' && !isPaused
          ? 'PLAYING'
          : state.playerState;
      return {
        isPaused,
        playerState: nextState,
        state: nextState,
      };
    }),

  setVolume: (volume, isMuted) =>
    set({
      volume: Math.max(0, Math.min(1, volume)),
      isMuted: typeof isMuted === 'boolean' ? isMuted : volume === 0,
    }),

  setMuted: (isMuted) => set({ isMuted }),

  setPlaybackRate: (playbackRate) => set({ playbackRate }),

  setAudioDelayMs: (audioDelayMs) => set({ audioDelayMs }),

  setSubtitleDelayMs: (subtitleDelayMs) => set({ subtitleDelayMs }),

  setActiveAudioIndex: (activeAudioIndex) => set({ activeAudioIndex }),

  setActiveSubtitleIndex: (activeSubtitleIndex) => set({ activeSubtitleIndex }),

  setSelectedQuality: (selectedQuality) => set({ selectedQuality }),

  setError: (error) => {
    const nextState: PlayerState = error ? 'ERROR' : get().playerState;
    set({
      error,
      playerState: nextState,
      state: nextState,
    });
  },

  incrementRecoveryAttempt: () => {
    const nextAttempt = get().recoveryAttempt + 1;
    set({ recoveryAttempt: nextAttempt, playerState: 'RECOVERING', state: 'RECOVERING' });
    return nextAttempt;
  },

  resetRecovery: () => set({ recoveryAttempt: 0 }),

  reset: () =>
    set((state) => ({
      ...initialState,
      volume: state.volume,
    })),
}));
