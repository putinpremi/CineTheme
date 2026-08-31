import { describe, it, expect } from 'vitest';
import { systemService } from '../../src/api/services/systemService';
import { authService } from '../../src/api/services/authService';
import { mapAuthResultToDomain, mapPublicSystemInfoToDomain } from '../../src/domain/auth/mappers';
import { InvalidResponseError } from '../../src/core/errors/AppError';

describe('Auth & System Services and DTO Mappers', () => {
  const serverUrl = 'http://127.0.0.1:8096';

  it('retrieves and maps public server information', async () => {
    const serverInfo = await systemService.getPublicServerInfo(serverUrl);

    expect(serverInfo.id).toBe('server-guid-12345');
    expect(serverInfo.name).toBe('CineTheme-Test-Server');
    expect(serverInfo.version).toBe('10.9.11');
    expect(serverInfo.isUsable).toBe(true);
  });

  it('authenticates user and returns mapped AuthSession', async () => {
    const session = await authService.authenticateByName(serverUrl, {
      Username: 'demo',
      Pw: 'password123',
    });

    expect(session.accessToken).toBe('test-valid-access-token-xyz');
    expect(session.serverId).toBe('server-guid-12345');
    expect(session.user.name).toBe('TestCinematicUser');
    expect(session.user.isAdmin).toBe(true);
  });

  it('handles logout gracefully', async () => {
    await expect(authService.logout(serverUrl, 'test-valid-access-token-xyz')).resolves.toBeUndefined();
  });

  it('throws InvalidResponseError if DTO is missing required ID fields', () => {
    expect(() => mapPublicSystemInfoToDomain({}, serverUrl)).toThrow(InvalidResponseError);
    expect(() =>
      mapAuthResultToDomain(
        {
          User: { Id: 'user-1', Name: 'Test' },
          AccessToken: '',
          ServerId: 'server-1',
        },
        serverUrl
      )
    ).toThrow(InvalidResponseError);
  });
});
