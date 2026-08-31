import { httpClient } from '../client/httpClient';
import type { BaseItemDto } from '../types/jellyfinDto';
import { parseChapters } from '../../player/anime/chapterParser';
import type { Chapter } from '../../domain/anime/types';
import { ticksToSeconds } from '../../utils/timeUtils';

export class ChapterService {
  public async getItemChapters(
    serverUrl: string,
    userId: string,
    token: string,
    itemId: string,
    signal?: AbortSignal
  ): Promise<Chapter[]> {
    const item = await httpClient.get<BaseItemDto>(
      serverUrl,
      `/Users/${userId}/Items/${itemId}`,
      {
        queryParams: { Fields: 'Chapters' },
        token,
        signal,
      }
    );

    const totalDurationSeconds = ticksToSeconds(item.RunTimeTicks);
    return parseChapters(item.Chapters, totalDurationSeconds);
  }
}

export const chapterService = new ChapterService();
