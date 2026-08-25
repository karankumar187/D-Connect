export type AuthorizationStatus =
  | 'connected'
  | 'expired'
  | 'reauthorization_required'
  | 'disconnected'
  | 'error';

export type NitroStatus = 'active' | 'inactive' | 'unknown' | 'not_available';

export type SyncStatus = 'running' | 'success' | 'rate_limited' | 'failed';

export interface SafeDiscordAccount {
  id: string;
  userId: string;
  discordUserId: string;
  username: string;
  globalName: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
  email: string | null;
  tokenExpiresAt: string;
  authorizationStatus: AuthorizationStatus;
  nitroStatus: NitroStatus;
  nitroPlan: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalConnected: number;
  nitroActive: number;
  nitroInactive: number;
  nitroNotAvailable: number;
  needsReauthorization: number;
  lastGlobalSyncAt: string | null;
}

export interface SyncLogItem {
  id: string;
  discordAccountId: string;
  startedAt: string;
  completedAt: string | null;
  status: SyncStatus;
  errorCode: string | null;
  errorMessage: string | null;
  details: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  discordAccountId: string | null;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number; // 0 = None, 1 = Nitro Classic, 2 = Nitro, 3 = Nitro Basic
  public_flags?: number;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name?: string | null;
}
