import { NextResponse } from 'next/server';
import { getSession, sanitizeAccount } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sampleProfiles = [
      {
        discordUserId: '248102947192847192',
        username: 'cyber_wumpus',
        globalName: 'Cyber Wumpus ✨',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png',
        nitroStatus: 'active',
        nitroPlan: 'Nitro',
      },
      {
        discordUserId: '381928471928471923',
        username: 'luna_dev',
        globalName: 'Luna | Bot Developer',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/2.png',
        nitroStatus: 'not_available',
        nitroPlan: null,
      },
      {
        discordUserId: '492817294819284710',
        username: 'nexus_admin',
        globalName: 'Nexus Commander',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/4.png',
        nitroStatus: 'inactive',
        nitroPlan: null,
      },
      {
        discordUserId: '581928471928471921',
        username: 'pixel_artisan',
        globalName: 'Pixel Artisan 🎨',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        nitroStatus: 'active',
        nitroPlan: 'Nitro Basic',
      },
    ];

    // Pick a profile or use custom one
    const profile =
      body.presetIndex !== undefined
        ? sampleProfiles[body.presetIndex % sampleProfiles.length]
        : sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];

    const account = await prisma.discordAccount.upsert({
      where: {
        userId_discordUserId: {
          userId: session.userId,
          discordUserId: body.discordUserId || profile.discordUserId,
        },
      },
      create: {
        userId: session.userId,
        discordUserId: body.discordUserId || profile.discordUserId,
        username: body.username || profile.username,
        globalName: body.globalName || profile.globalName,
        avatarUrl: body.avatarUrl || profile.avatarUrl,
        email: `${profile.username}@example.com`,
        encryptedAccessToken: encrypt('demo_access_token_' + Date.now()),
        encryptedRefreshToken: encrypt('demo_refresh_token_' + Date.now()),
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        authorizationStatus: body.authorizationStatus || 'connected',
        nitroStatus: body.nitroStatus || profile.nitroStatus,
        nitroPlan: body.nitroPlan !== undefined ? body.nitroPlan : profile.nitroPlan,
        lastSyncedAt: new Date(),
      },
      update: {
        username: body.username || profile.username,
        globalName: body.globalName || profile.globalName,
        avatarUrl: body.avatarUrl || profile.avatarUrl,
        authorizationStatus: body.authorizationStatus || 'connected',
        nitroStatus: body.nitroStatus || profile.nitroStatus,
        nitroPlan: body.nitroPlan !== undefined ? body.nitroPlan : profile.nitroPlan,
        lastSyncedAt: new Date(),
      },
    });

    // Create initial SyncLog
    await prisma.syncLog.create({
      data: {
        discordAccountId: account.id,
        status: 'success',
        startedAt: new Date(),
        completedAt: new Date(),
        details: JSON.stringify({ event: 'demo_account_connected' }),
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.userId,
        discordAccountId: account.id,
        type: 'account_connected',
        title: `Account Connected: @${account.username}`,
        body: `Linked demo Discord account @${account.username} (${account.discordUserId}).`,
      },
    });

    return NextResponse.json({
      success: true,
      account: sanitizeAccount(account),
    });
  } catch (error: any) {
    console.error('Demo account creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo account' },
      { status: 500 }
    );
  }
}
