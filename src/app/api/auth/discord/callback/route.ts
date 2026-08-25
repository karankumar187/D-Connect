import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import {
  buildAvatarUrl,
  exchangeCodeForTokens,
  fetchDiscordUser,
  parseNitroStatus,
} from '@/lib/discord';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Derive base URL dynamically from request or APP_URL
  const requestOrigin = new URL(request.url).origin;
  const appBaseUrl =
    (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || requestOrigin).replace(/\/$/, '');

  // 1. Check if user cancelled or Discord returned an error
  if (error) {
    console.warn('Discord OAuth error returned:', error, errorDescription);
    return NextResponse.redirect(
      `${appBaseUrl}/dashboard?error=oauth_denied&message=${encodeURIComponent(
        errorDescription || 'Discord authorization was cancelled or denied'
      )}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appBaseUrl}/dashboard?error=invalid_request&message=${encodeURIComponent(
        'Missing code or state parameter in OAuth callback'
      )}`
    );
  }

  try {
    // 2. Validate state to prevent CSRF
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state: state },
    });

    if (!oauthState) {
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?error=invalid_state&message=${encodeURIComponent(
          'Invalid or expired OAuth state. Please try connecting again.'
        )}`
      );
    }

    if (new Date() > oauthState.expiresAt) {
      await prisma.oAuthState.delete({ where: { id: oauthState.id } });
      return NextResponse.redirect(
        `${appBaseUrl}/dashboard?error=state_expired&message=${encodeURIComponent(
          'OAuth session expired. Please initiate connection again.'
        )}`
      );
    }

    const userId = oauthState.userId;

    // Delete used state
    await prisma.oAuthState.delete({ where: { id: oauthState.id } });

    // 3. Exchange code for OAuth tokens server-side
    const tokenData = await exchangeCodeForTokens(code, oauthState.codeVerifier || undefined);

    // 4. Fetch authenticated user profile from official Discord API (/users/@me)
    const discordUser = await fetchDiscordUser(tokenData.access_token);

    // 5. Encrypt OAuth credentials at rest using AES-256-GCM
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);
    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const avatarUrl = buildAvatarUrl(
      discordUser.id,
      discordUser.avatar,
      discordUser.discriminator
    );

    const { nitroStatus, nitroPlan } = parseNitroStatus(discordUser.premium_type);

    // 6. Upsert the DiscordAccount record for this user
    const account = await prisma.discordAccount.upsert({
      where: {
        userId_discordUserId: {
          userId: userId,
          discordUserId: discordUser.id,
        },
      },
      create: {
        userId: userId,
        discordUserId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name || null,
        avatarHash: discordUser.avatar || null,
        avatarUrl: avatarUrl,
        email: discordUser.email || null,
        encryptedAccessToken: encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokenExpiresAt,
        authorizationStatus: 'connected',
        nitroStatus: nitroStatus,
        nitroPlan: nitroPlan,
        lastSyncedAt: new Date(),
      },
      update: {
        username: discordUser.username,
        globalName: discordUser.global_name || null,
        avatarHash: discordUser.avatar || null,
        avatarUrl: avatarUrl,
        email: discordUser.email || null,
        encryptedAccessToken: encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokenExpiresAt,
        authorizationStatus: 'connected',
        nitroStatus: nitroStatus,
        nitroPlan: nitroPlan,
        lastSyncedAt: new Date(),
      },
    });

    // 7. Record initial sync log and notification
    await prisma.syncLog.create({
      data: {
        discordAccountId: account.id,
        status: 'success',
        startedAt: new Date(),
        completedAt: new Date(),
        details: JSON.stringify({
          event: 'initial_oauth_connection',
          nitroStatus,
          nitroPlan,
        }),
      },
    });

    await prisma.notification.create({
      data: {
        userId: userId,
        discordAccountId: account.id,
        type: 'account_connected',
        title: `Account Connected: @${discordUser.username}`,
        body: `Successfully linked Discord account @${discordUser.username} (${discordUser.id}).`,
      },
    });

    return NextResponse.redirect(
      `${appBaseUrl}/dashboard?connected=true&username=${encodeURIComponent(
        discordUser.username
      )}`
    );
  } catch (err: any) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(
      `${appBaseUrl}/dashboard?error=exchange_failed&message=${encodeURIComponent(
        err.message || 'Failed to complete Discord authorization'
      )}`
    );
  }
}
