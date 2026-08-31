import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../state/stores/useAuthStore';
import { queryKeys } from '../state/query/queryKeys';
import { chapterService } from '../api/services/chapterService';
import { introSkipperService } from '../api/services/introSkipperService';
import { episodeService } from '../api/services/episodeService';
import { trickplayService } from '../api/services/trickplayService';
import { introDetector } from '../player/anime/introDetector';
import type { Chapter, AnimeSegment, EpisodeNavigationInfo, TrickplayManifest } from '../domain/anime/types';

export function useItemChapters(itemId?: string) {
  const session = useAuthStore((s) => s.session);

  return useQuery<Chapter[]>({
    queryKey: session && itemId
      ? queryKeys.server(session.serverId).user(session.user.id).chapters(itemId)
      : ['chapters', itemId],
    queryFn: ({ signal }) => {
      if (!session || !itemId) return [];
      return chapterService.getItemChapters(
        session.serverUrl,
        session.user.id,
        session.accessToken,
        itemId,
        signal
      );
    },
    enabled: Boolean(session && itemId),
    staleTime: 1000 * 60 * 15,
  });
}

export function useIntroSkipperTimestamps(itemId?: string) {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: session && itemId
      ? queryKeys.server(session.serverId).user(session.user.id).introSkipper(itemId)
      : ['introskipper', itemId],
    queryFn: ({ signal }) => {
      if (!session || !itemId) return null;
      return introSkipperService.getIntroTimestamps(
        session.serverUrl,
        session.accessToken,
        itemId,
        signal
      );
    },
    enabled: Boolean(session && itemId),
    staleTime: 1000 * 60 * 30,
    retry: false, // Do not retry if plugin is absent
  });
}

export function useAnimeSegments(itemId?: string) {
  const { data: chapters } = useItemChapters(itemId);
  const { data: pluginTimestamps } = useIntroSkipperTimestamps(itemId);

  return React.useMemo<AnimeSegment[]>(() => {
    return introDetector.detectSegments(chapters || [], pluginTimestamps);
  }, [chapters, pluginTimestamps]);
}

export function useAdjacentEpisodes(
  seriesId?: string,
  seasonId?: string,
  currentEpisodeId?: string
) {
  const session = useAuthStore((s) => s.session);

  return useQuery<EpisodeNavigationInfo | null>({
    queryKey: session && seriesId && currentEpisodeId
      ? queryKeys.server(session.serverId).user(session.user.id).adjacentEpisodes(seriesId, seasonId, currentEpisodeId)
      : ['adjacentEpisodes', seriesId, seasonId, currentEpisodeId],
    queryFn: ({ signal }) => {
      if (!session || !seriesId || !currentEpisodeId) return null;
      return episodeService.getAdjacentEpisodes(
        session.serverUrl,
        session.user.id,
        session.accessToken,
        seriesId,
        seasonId,
        currentEpisodeId,
        signal
      );
    },
    enabled: Boolean(session && seriesId && currentEpisodeId),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTrickplayManifest(itemId?: string, width = 320) {
  const session = useAuthStore((s) => s.session);

  return useQuery<TrickplayManifest | null>({
    queryKey: session && itemId
      ? queryKeys.server(session.serverId).user(session.user.id).trickplay(itemId, width)
      : ['trickplay', itemId, width],
    queryFn: ({ signal }) => {
      if (!session || !itemId) return null;
      return trickplayService.getTrickplayManifest(
        session.serverUrl,
        itemId,
        width,
        session.accessToken,
        signal
      );
    },
    enabled: Boolean(session && itemId),
    staleTime: 1000 * 60 * 60, // Trickplay manifests are immutable
    retry: false,
  });
}
