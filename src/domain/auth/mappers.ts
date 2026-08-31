import type { PublicSystemInfoDto, UserDto, AuthenticationResultDto } from '../../api/types/jellyfinDto';
import type { ServerInfo, UserIdentity, AuthSession } from './models';
import { InvalidResponseError } from '../../core/errors/AppError';

export function mapPublicSystemInfoToDomain(dto: PublicSystemInfoDto, serverUrl: string): ServerInfo {
  if (!dto.Id) {
    throw new InvalidResponseError('Server response missing required Id field.');
  }

  return {
    id: dto.Id,
    name: dto.ServerName || 'Jellyfin Server',
    version: dto.Version || 'Unknown',
    operatingSystem: dto.OperatingSystem,
    url: serverUrl,
    isUsable: dto.StartupWizardCompleted !== false,
  };
}

export function mapUserDtoToDomain(dto: UserDto, serverUrl?: string): UserIdentity {
  if (!dto.Id) {
    throw new InvalidResponseError('User object missing required Id field.');
  }

  const avatarUrl =
    dto.PrimaryImageTag && serverUrl
      ? `${serverUrl}/Users/${dto.Id}/Images/Primary?tag=${dto.PrimaryImageTag}&format=webp`
      : undefined;

  return {
    id: dto.Id,
    name: dto.Name || 'Jellyfin User',
    isAdmin: dto.Policy?.IsAdministrator ?? false,
    isDisabled: dto.Policy?.IsDisabled ?? false,
    primaryImageTag: dto.PrimaryImageTag,
    avatarUrl,
  };
}

export function mapAuthResultToDomain(dto: AuthenticationResultDto, serverUrl: string): AuthSession {
  if (!dto.AccessToken || !dto.ServerId || !dto.User) {
    throw new InvalidResponseError('Authentication response missing required session fields.');
  }

  return {
    accessToken: dto.AccessToken,
    serverId: dto.ServerId,
    serverUrl,
    user: mapUserDtoToDomain(dto.User, serverUrl),
    sessionId: dto.SessionInfo?.Id,
    lastConnected: Date.now(),
  };
}
