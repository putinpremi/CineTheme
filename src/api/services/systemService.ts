import { httpClient } from '../client/httpClient';
import type { PublicSystemInfoDto } from '../types/jellyfinDto';
import { mapPublicSystemInfoToDomain } from '../../domain/auth/mappers';
import type { ServerInfo } from '../../domain/auth/models';

export class SystemService {
  /**
   * Retrieves public server information to validate connectivity and compatibility.
   */
  public async getPublicServerInfo(serverUrl: string, signal?: AbortSignal): Promise<ServerInfo> {
    const dto = await httpClient.get<PublicSystemInfoDto>(serverUrl, '/System/Info/Public', { signal });
    return mapPublicSystemInfoToDomain(dto, serverUrl);
  }

  /**
   * Checks if QuickConnect is supported and enabled on the target server.
   */
  public async isQuickConnectEnabled(serverUrl: string, signal?: AbortSignal): Promise<boolean> {
    try {
      const enabled = await httpClient.get<boolean>(serverUrl, '/QuickConnect/Enabled', { signal });
      return Boolean(enabled);
    } catch {
      return false;
    }
  }
}

export const systemService = new SystemService();
