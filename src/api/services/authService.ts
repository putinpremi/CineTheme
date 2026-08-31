import { httpClient } from '../client/httpClient';
import type { AuthenticationResultDto, AuthenticateUserByNameDto } from '../types/jellyfinDto';
import { mapAuthResultToDomain } from '../../domain/auth/mappers';
import type { AuthSession } from '../../domain/auth/models';

export class AuthService {
  /**
   * Authenticates a user by username and password against the target Jellyfin server.
   * Returns a domain AuthSession containing the long-lived session AccessToken.
   */
  public async authenticateByName(
    serverUrl: string,
    credentials: AuthenticateUserByNameDto,
    signal?: AbortSignal
  ): Promise<AuthSession> {
    const dto = await httpClient.post<AuthenticationResultDto>(
      serverUrl,
      '/Users/AuthenticateByName',
      credentials,
      { signal }
    );

    return mapAuthResultToDomain(dto, serverUrl);
  }

  /**
   * Informs the Jellyfin server to invalidate and terminate the active session.
   */
  public async logout(serverUrl: string, token: string, signal?: AbortSignal): Promise<void> {
    try {
      await httpClient.post<void>(serverUrl, '/Sessions/Logout', {}, { token, signal });
    } catch {
      // Logout should succeed locally even if server is unreachable
    }
  }
}

export const authService = new AuthService();
