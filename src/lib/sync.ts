import { prisma } from './prisma';
import { decrypt, encrypt } from './crypto';
import {
  buildAvatarUrl,
  fetchDiscordUser,
  parseNitroStatus,
  refreshAccessToken,
} from './discord';
import { SafeDiscordAccount } from './types';
import { sanitizeAccount } from './auth';

export interface SyncResult {
  success: boolean;
  account?: SafeDiscordAccount;
  error?: string;
  reauthorizationRequired?: boolean;
}

/**
 * Synchronizes an individual Discord account with the official Discord API.
 * Safely handles token refresh, rate limits, status updates, and audit logging.
 */
export async function syncDiscordAccount(
  accountId: string,
  userId?: string
): Promise<SyncResult> {
  // 1. Fetch account (scoped to user if userId provided)
  const whereClause: { id: string; userId?: string } = { id: accountId };
  if (userId) {
    whereClause.userId = userId;
  }

  const account = await prisma.discordAccount.findFirst({
    where: whereClause,
  });

  if (!account) {
    return { success: false, error: 'Account not found or access denied' };
  }

  const startTime = new Date();

  // 2. Create initial SyncLog record
  const syncLog = await prisma.syncLog.create({
    data: {
      discordAccountId: account.id,
      startedAt: startTime,
      status: 'running',
    },
  });

  try {
    let accessToken = '';
    let refreshToken = '';

    try {
      accessToken = decrypt(account.encryptedAccessToken);
      refreshToken = decrypt(account.encryptedRefreshToken);
    } catch (cryptoErr: any) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          completedAt: new Date(),
          status: 'failed',
          errorCode: 'DECRYPTION_ERROR',
          errorMessage: 'Failed to decrypt stored OAuth credentials',
        },
      });
      return { success: false, error: 'Credential decryption failed' };
    }

    // 3. Check if access token is expired or within 5 minutes of expiration
    const now = new Date();
    const tokenExpiringSoon =
      account.tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

    if (tokenExpiringSoon) {
      try {
        const tokenData = await refreshAccessToken(refreshToken);
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;

        const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        // Update encrypted credentials
        await prisma.discordAccount.update({
          where: { id: account.id },
          data: {
            encryptedAccessToken: encrypt(accessToken),
            encryptedRefreshToken: encrypt(refreshToken),
            tokenExpiresAt: newExpiresAt,
            authorizationStatus: 'connected',
          },
        });
      } catch (refreshErr: any) {
        const isAuthRevoked =
          refreshErr.statusCode === 400 ||
          refreshErr.statusCode === 401 ||
          refreshErr.errorType === 'invalid_grant';

        if (isAuthRevoked) {
          await prisma.discordAccount.update({
            where: { id: account.id },
            data: {
              authorizationStatus: 'reauthorization_required',
            },
          });

          await prisma.notification.create({
            data: {
              userId: account.userId,
              discordAccountId: account.id,
              type: 'reauth_required',
              title: `Reauthorization Required: @${account.username}`,
              body: `The OAuth authorization for @${account.username} has expired or been revoked. Please reconnect the account.`,
            },
          });

          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              completedAt: new Date(),
              status: 'failed',
              errorCode: 'REAUTH_REQUIRED',
              errorMessage: 'OAuth refresh token invalid or revoked',
            },
          });

          return {
            success: false,
            error: 'Authorization expired. Reconnect required.',
            reauthorizationRequired: true,
          };
        }

        throw refreshErr;
      }
    }

    // 4. Call official Discord API (/users/@me)
    const discordUser = await fetchDiscordUser(accessToken);

    const avatarUrl = buildAvatarUrl(
      discordUser.id,
      discordUser.avatar,
      discordUser.discriminator
    );

    const { nitroStatus, nitroPlan } = parseNitroStatus(
      discordUser.premium_type,
      discordUser
    );

    // 5. Update Discord Account record in database
    const updatedAccount = await prisma.discordAccount.update({
      where: { id: account.id },
      data: {
        username: discordUser.username,
        globalName: discordUser.global_name || null,
        avatarHash: discordUser.avatar || null,
        avatarUrl: avatarUrl,
        email: discordUser.email || account.email,
        nitroStatus: nitroStatus,
        nitroPlan: nitroPlan,
        authorizationStatus: 'connected',
        lastSyncedAt: new Date(),
      },
    });

    // 6. Complete SyncLog successfully
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        status: 'success',
        details: JSON.stringify({
          username: discordUser.username,
          nitroStatus,
          nitroPlan,
        }),
      },
    });

    return {
      success: true,
      account: sanitizeAccount(updatedAccount),
    };
  } catch (err: any) {
    const isRateLimit = err.statusCode === 429;
    const isUnauthorized = err.statusCode === 401;

    let errorCode = 'SYNC_ERROR';
    let errorMessage = err.message || 'Unknown error occurred during sync';

    if (isRateLimit) {
      errorCode = 'RATE_LIMITED';
      errorMessage = `Discord API rate limited. Backing off.`;
    } else if (isUnauthorized) {
      errorCode = 'UNAUTHORIZED';
      errorMessage = `Access token rejected by Discord API.`;

      await prisma.discordAccount.update({
        where: { id: account.id },
        data: { authorizationStatus: 'reauthorization_required' },
      });
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        status: isRateLimit ? 'rate_limited' : 'failed',
        errorCode: errorCode,
        errorMessage: errorMessage,
      },
    });

    return {
      success: false,
      error: errorMessage,
      reauthorizationRequired: isUnauthorized,
    };
  }
}

/**
 * Synchronizes all active Discord accounts belonging to a specific user.
 */
export async function syncAllUserAccounts(userId: string) {
  const accounts = await prisma.discordAccount.findMany({
    where: {
      userId,
      authorizationStatus: { not: 'disconnected' },
    },
  });

  const results: SyncResult[] = [];
  for (const account of accounts) {
    const res = await syncDiscordAccount(account.id, userId);
    results.push(res);
    // Respect rate limits with a gentle pause between calls
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Background worker task: Synchronizes all accounts across the system.
 */
export async function runGlobalBackgroundSync() {
  const accounts = await prisma.discordAccount.findMany({
    where: {
      authorizationStatus: 'connected',
    },
    orderBy: { lastSyncedAt: 'asc' },
  });

  const results = [];
  for (const account of accounts) {
    try {
      const res = await syncDiscordAccount(account.id);
      results.push({ id: account.id, success: res.success });
    } catch (e: any) {
      results.push({ id: account.id, success: false, error: e.message });
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
