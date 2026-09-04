export interface SeerrStatusResponse {
  version: string;
  commitTag?: string;
}

export type SeerrMediaStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_AVAILABLE'
  | 'PROCESSING'
  | 'PENDING_APPROVAL'
  | 'NOT_REQUESTED';

export interface SeerrMediaItem {
  id: number; // TMDB ID
  mediaType: 'movie' | 'tv';
  title: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  status: SeerrMediaStatus;
  seasonsCount?: number;
}

export interface SeerrRequestPayload {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  seasons?: number[] | 'all';
}

interface RawSeerrItem {
  id: number;
  mediaType: 'movie' | 'tv' | string;
  title?: string;
  originalTitle?: string;
  name?: string;
  originalName?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  numberOfSeasons?: number;
  mediaInfo?: {
    status?: number;
  };
}

function mapStatus(statusCode?: number): SeerrMediaStatus {
  switch (statusCode) {
    case 5:
      return 'AVAILABLE';
    case 4:
      return 'PARTIALLY_AVAILABLE';
    case 3:
      return 'PROCESSING';
    case 2:
      return 'PENDING_APPROVAL';
    default:
      return 'NOT_REQUESTED';
  }
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export class SeerrService {
  /**
   * Tests the connection to the Jellyseerr/Overseerr server.
   */
  public async testConnection(
    serverUrl: string,
    apiKey: string,
    signal?: AbortSignal
  ): Promise<{ version: string }> {
    const base = normalizeUrl(serverUrl);
    if (!base) {
      throw new Error('Server URL cannot be empty');
    }
    if (!apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    const response = await fetch(`${base}/api/v1/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey.trim(),
      },
      signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key or unauthorized access');
      }
      throw new Error(`Seerr server responded with HTTP ${response.status}`);
    }

    const data = (await response.json()) as SeerrStatusResponse;
    return {
      version: data.version || '1.0.0',
    };
  }

  /**
   * Searches media across TMDB via Jellyseerr.
   */
  public async searchMedia(
    serverUrl: string,
    apiKey: string,
    query: string,
    page = 1,
    signal?: AbortSignal
  ): Promise<{ results: SeerrMediaItem[]; totalResults: number; totalPages: number }> {
    const base = normalizeUrl(serverUrl);
    if (!base || !apiKey || !query.trim()) {
      return { results: [], totalResults: 0, totalPages: 0 };
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `${base}/api/v1/search?query=${encodedQuery}&page=${page}&language=en`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Api-Key': apiKey.trim(),
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const results: SeerrMediaItem[] = ((data.results || []) as RawSeerrItem[])
      .filter((item: RawSeerrItem) => item.mediaType === 'movie' || item.mediaType === 'tv')
      .map((item: RawSeerrItem) => {
        const isMovie = item.mediaType === 'movie';
        const title = isMovie ? item.title || item.originalTitle : item.name || item.originalName;
        const releaseDate = isMovie ? item.releaseDate : item.firstAirDate;
        const mediaInfo = item.mediaInfo;

        return {
          id: item.id,
          mediaType: item.mediaType as 'movie' | 'tv',
          title: title || 'Untitled',
          overview: item.overview,
          posterPath: item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : undefined,
          backdropPath: item.backdropPath
            ? `https://image.tmdb.org/t/p/w1280${item.backdropPath}`
            : undefined,
          releaseDate,
          status: mapStatus(mediaInfo?.status),
          seasonsCount: item.numberOfSeasons,
        };
      });

    return {
      results,
      totalResults: data.totalResults || results.length,
      totalPages: data.totalPages || 1,
    };
  }

  /**
   * Submits a media request to Jellyseerr/Overseerr.
   */
  public async requestMedia(
    serverUrl: string,
    apiKey: string,
    payload: SeerrRequestPayload,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message?: string }> {
    const base = normalizeUrl(serverUrl);
    if (!base || !apiKey) {
      throw new Error('Server URL and API key are required to submit requests');
    }

    const body: {
      mediaType: 'movie' | 'tv';
      mediaId: number;
      seasons?: number[] | 'all';
    } = {
      mediaType: payload.mediaType,
      mediaId: payload.mediaId,
    };

    if (payload.mediaType === 'tv') {
      body.seasons = payload.seasons === 'all' ? 'all' : payload.seasons || [1];
    }

    const response = await fetch(`${base}/api/v1/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Api-Key': apiKey.trim(),
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.message) {
          errorMsg = errJson.message;
        }
      } catch {
        // use default errorMsg
      }
      throw new Error(`Request failed: ${errorMsg}`);
    }

    return { success: true };
  }
}

export const seerrService = new SeerrService();
