import { DiscordTokenResponse, DiscordUserResponse, NitroStatus } from './types';

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';

export function getDiscordClientId(): string {
  return process.env.DISCORD_CLIENT_ID || '';
}

export function getDiscordClientSecret(): string {
  return process.env.DISCORD_CLIENT_SECRET || '';
}

export function getDiscordRedirectUri(): string {
  return process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';
}

export function isDiscordOAuthConfigured(): boolean {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  return Boolean(clientId && clientSecret && clientId !== 'your_discord_client_id_here');
}

/**
 * Builds the official Discord OAuth2 authorization URL.
 */
export function getDiscordOAuthUrl(state: string, codeChallenge?: string): string {
  const clientId = getDiscordClientId();
  const redirectUri = getDiscordRedirectUri();
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'identify email',
    state: state,
    prompt: 'consent', // allows switching and authorizing multiple accounts
  });

  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier?: string
): Promise<DiscordTokenResponse> {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  const redirectUri = getDiscordRedirectUri();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
  });

  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }

  const response = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Discord token exchange failed (${response.status}): ${
        errorData.error_description || errorData.error || response.statusText
      }`
    );
  }

  return response.json();
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<DiscordTokenResponse> {
  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(
      `Discord token refresh failed (${response.status}): ${
        errorData.error_description || errorData.error || response.statusText
      }`
    );
    (err as any).statusCode = response.status;
    (err as any).errorType = errorData.error;
    throw err;
  }

  return response.json();
}

/**
 * Fetches the user profile from official Discord API v10 (/users/@me).
 */
export async function fetchDiscordUser(
  accessToken: string
): Promise<DiscordUserResponse> {
  const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'DiscordAccountDashboard/1.0 (Official OAuth2)',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '5';
      const err = new Error(`Discord API rate limited. Retry after ${retryAfter}s`);
      (err as any).statusCode = 429;
      (err as any).retryAfter = parseInt(retryAfter, 10);
      throw err;
    }
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(
      `Discord fetch user failed (${response.status}): ${
        errorData.message || response.statusText
      }`
    );
    (err as any).statusCode = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Resolves the official Discord avatar URL from user ID and avatar hash.
 */
export function buildAvatarUrl(
  userId: string,
  avatarHash?: string | null,
  discriminator: string = '0'
): string {
  if (avatarHash) {
    const isAnimated = avatarHash.startsWith('a_');
    const ext = isAnimated ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=256`;
  }

  // Discord default avatar based on user ID / discriminator
  try {
    if (discriminator === '0' || !discriminator) {
      // Migrated username system uses (userId >> 22) % 6
      const index = Number((BigInt(userId) >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }
    const index = parseInt(discriminator, 10) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return `https://cdn.discordapp.com/embed/avatars/0.png`;
  }
}

/**
 * Decodes public badges from Discord bitfield flags.
 */
export function decodeDiscordBadges(flags: number = 0): string[] {
  const badges: string[] = [];
  if (flags & (1 << 0)) badges.push('Discord Staff');
  if (flags & (1 << 1)) badges.push('Partnered Server Owner');
  if (flags & (1 << 2)) badges.push('HypeSquad Events');
  if (flags & (1 << 3)) badges.push('Bug Hunter Lv1');
  if (flags & (1 << 6)) badges.push('HypeSquad Bravery');
  if (flags & (1 << 7)) badges.push('HypeSquad Brilliance');
  if (flags & (1 << 8)) badges.push('HypeSquad Balance');
  if (flags & (1 << 9)) badges.push('Early Nitro Supporter');
  if (flags & (1 << 14)) badges.push('Bug Hunter Lv2');
  if (flags & (1 << 17)) badges.push('Verified Bot Developer');
  if (flags & (1 << 18)) badges.push('Certified Moderator');
  if (flags & (1 << 22)) badges.push('Active Developer');
  return badges;
}

/**
 * Checks all official Discord premium_type values and profile features:
 * - premium_type: 2 -> Nitro ($9.99/mo)
 * - premium_type: 3 -> Nitro Basic ($2.99/mo)
 * - premium_type: 1 -> Nitro Classic ($4.99/mo)
 * - premium_type: 0 -> None
 * Also checks Nitro-exclusive profile assets: animated GIF avatars (a_...), custom banners, and avatar decorations.
 */
export function parseNitroStatus(
  premiumType?: number | null,
  userProfile?: {
    avatar?: string | null;
    banner?: string | null;
    avatar_decoration_data?: any;
    flags?: number;
    public_flags?: number;
  }
): {
  nitroStatus: NitroStatus;
  nitroPlan: string | null;
  rawType: number;
} {
  // 1. Check all explicit Discord premium_type enum values
  if (premiumType === 2) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro',
      rawType: 2,
    };
  }

  if (premiumType === 3) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro Basic',
      rawType: 3,
    };
  }

  if (premiumType === 1) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro Classic',
      rawType: 1,
    };
  }

  // 2. Profile features that strictly require Nitro
  if (userProfile?.avatar && userProfile.avatar.startsWith('a_')) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro',
      rawType: 2,
    };
  }

  if (userProfile?.banner) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro',
      rawType: 2,
    };
  }

  if (userProfile?.avatar_decoration_data) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro',
      rawType: 2,
    };
  }

  // Check Early Supporter flag (1 << 9 = 512)
  const allFlags = (userProfile?.flags || 0) | (userProfile?.public_flags || 0);
  if ((allFlags & 512) !== 0) {
    return {
      nitroStatus: 'active',
      nitroPlan: 'Nitro (Early Supporter)',
      rawType: 2,
    };
  }

  return {
    nitroStatus: 'inactive',
    nitroPlan: null,
    rawType: 0,
  };
}
