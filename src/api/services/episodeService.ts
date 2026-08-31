import { httpClient } from '../client/httpClient';
import type { BaseItemDto, QueryResultDto } from '../types/jellyfinDto';
import { mapBaseItemDtoToDomain } from '../../domain/media/mappers';
import type { MediaItem } from '../../domain/media/types';
import type { EpisodeNavigationInfo } from '../../domain/anime/types';

export class EpisodeService {
  /**
   * Fetches all episodes belonging to a specific series and season.
   */
  public async getSeasonEpisodes(
    serverUrl: string,
    userId: string,
    token: string,
    seriesId: string,
    seasonId?: string,
    signal?: AbortSignal
  ): Promise<MediaItem[]> {
    const response = await httpClient.get<QueryResultDto<BaseItemDto>>(
      serverUrl,
      `/Shows/${seriesId}/Episodes`,
      {
        queryParams: {
          userId,
          seasonId,
          Fields: 'ItemCounts,PrimaryImageAspectRatio,UserData,RunTimeTicks,Chapters',
        },
        token,
        signal,
      }
    );

    return (response.Items || []).map((dto) => mapBaseItemDtoToDomain(dto, serverUrl));
  }

  /**
   * Resolves preceding and succeeding episodes in the season sequence.
   */
  public async getAdjacentEpisodes(
    serverUrl: string,
    userId: string,
    token: string,
    seriesId: string,
    seasonId: string | undefined,
    currentEpisodeId: string,
    signal?: AbortSignal
  ): Promise<EpisodeNavigationInfo> {
    const episodes = await this.getSeasonEpisodes(
      serverUrl,
      userId,
      token,
      seriesId,
      seasonId,
      signal
    );

    const currentIndex = episodes.findIndex((ep) => ep.id === currentEpisodeId);
    const current = episodes[currentIndex];

    const next = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : undefined;
    const prev = currentIndex > 0 ? episodes[currentIndex - 1] : undefined;

    return {
      currentEpisodeId,
      seriesId,
      seriesName: current?.seriesName,
      seasonId,
      seasonNumber: current?.parentIndexNumber,
      episodeNumber: current?.indexNumber,
      episodeTitle: current?.name,
      nextEpisodeId: next?.id,
      nextEpisodeTitle: next?.name,
      nextEpisodeNumber: next?.indexNumber,
      previousEpisodeId: prev?.id,
      previousEpisodeTitle: prev?.name,
      previousEpisodeNumber: prev?.indexNumber,
    };
  }
}

export const episodeService = new EpisodeService();
