export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'INVALID_RESPONSE'
  | 'CONFIGURATION_ERROR'
  | 'PLAYBACK_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly isRecoverable: boolean;

  constructor(
    message: string,
    options: {
      code?: ErrorCode;
      statusCode?: number;
      details?: unknown;
      isRecoverable?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.isRecoverable = options.isRecoverable ?? true;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed. Please check your internet or server availability.', details?: unknown) {
    super(message, { code: 'NETWORK_ERROR', isRecoverable: true, details });
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Invalid username or password.', statusCode = 401, details?: unknown) {
    super(message, { code: 'AUTH_UNAUTHORIZED', statusCode, isRecoverable: true, details });
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Session has expired or was revoked. Please log in again.', details?: unknown) {
    super(message, { code: 'AUTH_UNAUTHORIZED', statusCode: 401, isRecoverable: false, details });
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource was not found on the Jellyfin server.', details?: unknown) {
    super(message, { code: 'NOT_FOUND', statusCode: 404, isRecoverable: true, details });
    this.name = 'NotFoundError';
  }
}

export class ServerError extends AppError {
  constructor(message = 'Jellyfin server encountered an internal error.', statusCode = 500, details?: unknown) {
    super(message, { code: 'SERVER_ERROR', statusCode, isRecoverable: true, details });
    this.name = 'ServerError';
  }
}

export class InvalidResponseError extends AppError {
  constructor(message = 'Received malformed or unexpected response format from server.', details?: unknown) {
    super(message, { code: 'INVALID_RESPONSE', isRecoverable: true, details });
    this.name = 'InvalidResponseError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'CONFIGURATION_ERROR', isRecoverable: false, details });
    this.name = 'ConfigurationError';
  }
}
