import { httpClient } from '../client/httpClient';
import type { IntroSkipperTimestampsDto } from '../types/jellyfinDto';

export class IntroSkipperService {
  private unavailableEndpoints = new Set<string>();

  /**
   * Probes Jellyfin for IntroSkipper plugin timestamps with failure isolation.
   * If the plugin is not installed (404/500/timeout), returns null without throwing.
   */
  public async getIntroTimestamps(
    serverUrl: string,
    token: string,
    itemId: string,
    signal?: AbortSignal
  ): Promise<IntroSkipperTimestampsDto | null> {
    const cacheKey = `${serverUrl}:introskipper`;
    if (this.unavailableEndpoints.has(cacheKey)) {
      return null;
    }

    try {
      const timeoutSignal = AbortSignal.timeout(2500);
      const effectiveSignal = signal
        ? AbortSignal.any([signal, timeoutSignal])
        : timeoutSignal;

      // Probe Primary Plugin Endpoint
      const res = await httpClient.get<IntroSkipperTimestampsDto>(
        serverUrl,
        `/Episode/${itemId}/IntroTimestamps`,
        {
          token,
          signal: effectiveSignal,
        }
      );

      if (res && res.Valid !== false) {
        return res;
      }
    } catch {
      // If primary endpoint fails, try secondary path before marking as absent
      try {
        const res2 = await httpClient.get<IntroSkipperTimestampsDto>(
          serverUrl,
          `/Plugin/IntroSkipper/Timestamps/${itemId}`,
          {
            token,
            signal,
          }
        );
        if (res2 && res2.Valid !== false) {
          return res2;
        }
      } catch {
        // Plugin not installed on server
        this.unavailableEndpoints.add(cacheKey);
      }
    }

    return null;
  }

  public resetCache(): void {
    this.unavailableEndpoints.clear();
  }
}

export const introSkipperService = new IntroSkipperService();
