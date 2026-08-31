export interface ServerInfo {
  id: string;
  name: string;
  version: string;
  operatingSystem?: string;
  url: string;
  isUsable: boolean;
}

export interface UserIdentity {
  id: string;
  name: string;
  isAdmin: boolean;
  isDisabled: boolean;
  primaryImageTag?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  serverId: string;
  serverUrl: string;
  user: UserIdentity;
  sessionId?: string;
  lastConnected: number;
}

export type AuthStatus = 'anonymous' | 'authenticating' | 'authenticated' | 'invalidating';
