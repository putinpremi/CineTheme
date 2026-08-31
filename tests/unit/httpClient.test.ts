import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '../../src/api/client/httpClient';
import {
  AuthenticationError,
  UnauthorizedError,
  NotFoundError,
  ServerError,
  InvalidResponseError,
  AppError,
} from '../../src/core/errors/AppError';

describe('HttpClient Transport Layer', () => {
  const client = new HttpClient({ defaultTimeoutMs: 2000 });
  const serverUrl = 'http://127.0.0.1:8096';

  it('performs successful GET and parses JSON response', async () => {
    const data = await client.get<{ ServerName: string }>(serverUrl, '/System/Info/Public');
    expect(data.ServerName).toBe('CineTheme-Test-Server');
  });

  it('attaches MediaBrowser authorization header with Client, Device, and DeviceId', async () => {
    const data = await client.get<{ Items: unknown[] }>(serverUrl, '/Users/user-guid-67890/Items', {
      token: 'test-valid-access-token-xyz',
    });
    expect(Array.isArray(data.Items)).toBe(true);
    expect(data.Items.length).toBeGreaterThan(0);
  });

  it('throws AuthenticationError when 401 occurs on AuthenticateByName endpoint', async () => {
    await expect(
      client.post(serverUrl, '/Users/AuthenticateByName', {
        Username: 'wrong',
        Pw: 'credentials',
      })
    ).rejects.toThrow(AuthenticationError);
  });

  it('triggers onUnauthorized callback and throws UnauthorizedError on protected route 401', async () => {
    const onUnauthorized = vi.fn();
    const authedClient = new HttpClient({ onUnauthorized });

    await expect(
      authedClient.get(serverUrl, '/Users/user-guid-67890/Items', {
        token: 'invalid-or-expired-token',
      })
    ).rejects.toThrow(UnauthorizedError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundError on 404 responses', async () => {
    await expect(client.get(serverUrl, '/NonExistent/Endpoint')).rejects.toThrow(NotFoundError);
  });

  it('throws ServerError on 500 responses', async () => {
    await expect(client.get(serverUrl, '/Test/ServerError')).rejects.toThrow(ServerError);
  });

  it('throws InvalidResponseError on malformed JSON responses', async () => {
    await expect(client.get(serverUrl, '/Test/Malformed')).rejects.toThrow(InvalidResponseError);
  });

  it('throws timeout error when request exceeds timeoutMs', async () => {
    const fastTimeoutClient = new HttpClient({ defaultTimeoutMs: 50 });
    await expect(fastTimeoutClient.get(serverUrl, '/Test/Delayed')).rejects.toThrow(AppError);
  });

  it('supports custom AbortSignal cancellation', async () => {
    const controller = new AbortController();
    const promise = client.get(serverUrl, '/Test/Delayed', { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });
});
