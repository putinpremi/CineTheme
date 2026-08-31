export interface ServerProfile {
  id: string;
  name: string;
  url: string;
  userId?: string;
  userName?: string;
  accessToken?: string;
  lastConnected: number;
}

export interface UserProfile {
  id: string;
  name: string;
  isAdmin: boolean;
  avatarUrl?: string;
}
