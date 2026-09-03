import {
  AppError,
  NetworkError,
  AuthenticationError,
  UnauthorizedError,
  NotFoundError,
  ServerError,
  InvalidResponseError,
} from '../../core/errors/AppError';
import { platformAdapter } from '../../core/platform/platformAdapter';
import { runtimeConfig } from '../../core/config/runtimeConfig';
import { buildApiUrl, normalizeServerUrl } from './urlUtils';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
  token?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUnauthorized?: () => void;
}

export class HttpClient {
  private defaultTimeoutMs: number;
  private onUnauthorizedCallback?: () => void;

  constructor(options: { defaultTimeoutMs?: number; onUnauthorized?: () => void } = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 15000;
    this.onUnauthorizedCallback = options.onUnauthorized;
  }

  public setOnUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  private buildAuthorizationHeader(token?: string): string {
    const client = runtimeConfig.appName;
    const device = platformAdapter.getDeviceName();
    const deviceId = platformAdapter.getDeviceId();
    const version = runtimeConfig.appVersion;

    const parts = [
      `Client="${client}"`,
      `Device="${device}"`,
      `DeviceId="${deviceId}"`,
      `Version="${version}"`,
    ];

    if (token) {
      parts.push(`Token="${token}"`);
    }

    return `MediaBrowser ${parts.join(', ')}`;
  }

  public async request<T>(
    serverUrl: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const normalizedBase = normalizeServerUrl(serverUrl);
    const targetUrl = buildApiUrl(normalizedBase, endpoint, options.queryParams);

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Emby-Authorization': this.buildAuthorizationHeader(options.token),
      ...options.headers,
    };

    let bodyPayload: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyPayload = JSON.stringify(options.body);
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new AppError(`Request to ${endpoint} timed out after ${timeoutMs}ms.`, {
            code: 'TIMEOUT_ERROR',
            isRecoverable: true,
          })
        );
      }, timeoutMs);
    });

    const abortPromise = new Promise<never>((_, reject) => {
      if (options.signal) {
        if (options.signal.aborted) {
          reject(
            new AppError(`Request to ${endpoint} was aborted.`, {
              code: 'TIMEOUT_ERROR',
              isRecoverable: true,
            })
          );
        } else {
          options.signal.addEventListener(
            'abort',
            () => {
              reject(
                new AppError(`Request to ${endpoint} was aborted.`, {
                  code: 'TIMEOUT_ERROR',
                  isRecoverable: true,
                })
              );
            },
            { once: true }
          );
        }
      }
    });

    const fetchPromise = (async () => {
      try {
        return await fetch(targetUrl, {
          method: options.method ?? 'GET',
          headers,
          body: bodyPayload,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            throw new AppError(`Request to ${endpoint} was aborted.`, {
              code: 'TIMEOUT_ERROR',
              isRecoverable: true,
            });
          }
          throw new NetworkError(err.message, err);
        }
        throw new NetworkError('Failed to connect to server.', err);
      }
    })();

    let response: Response;
    try {
      response = await Promise.race([fetchPromise, timeoutPromise, abortPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // Handle HTTP status codes
    if (!response.ok) {
      const status = response.status;

      if (status === 401) {
        // Distinguish between login endpoint failure vs expired session on protected routes
        if (endpoint.includes('/Users/AuthenticateByName')) {
          throw new AuthenticationError('Invalid username or password.', 401);
        }

        // Trigger session invalidation callback for active sessions
        this.onUnauthorizedCallback?.();
        throw new UnauthorizedError('Session has expired or was revoked. Please sign in again.');
      }

      if (status === 403) {
        throw new AppError('Access forbidden by server policy.', {
          code: 'AUTH_FORBIDDEN',
          statusCode: 403,
          isRecoverable: false,
        });
      }

      if (status === 404) {
        throw new NotFoundError(`Requested resource was not found on server (${endpoint}).`);
      }

      if (status >= 500) {
        throw new ServerError(
          `Jellyfin server error (${status} ${response.statusText || 'Internal Server Error'}).`,
          status
        );
      }

      let errorDetail = '';
      try {
        const errText = await response.text();
        if (errText) {
          try {
            const errJson = JSON.parse(errText);
            errorDetail = errJson.message || errJson.title || errJson.error || '';
          } catch {
            errorDetail = errText.slice(0, 200);
          }
        }
      } catch {
        // Ignore read errors
      }

      const errorMessage = errorDetail
        ? `HTTP Error ${status}: ${errorDetail}`
        : `HTTP Error ${status}: ${response.statusText || 'Bad Request'}`;

      throw new AppError(errorMessage, {
        code: 'NETWORK_ERROR',
        statusCode: status,
        isRecoverable: status >= 500,
      });
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Parse JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) return {} as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new InvalidResponseError(
          `Expected JSON from ${endpoint} but received non-JSON payload.`
        );
      }
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new InvalidResponseError(
        `Failed to parse JSON response from ${endpoint}.`
      );
    }
  }

  public get<T>(
    serverUrl: string,
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(serverUrl, endpoint, { ...options, method: 'GET' });
  }

  public post<T>(
    serverUrl: string,
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(serverUrl, endpoint, { ...options, method: 'POST', body });
  }

  public delete<T>(
    serverUrl: string,
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(serverUrl, endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
