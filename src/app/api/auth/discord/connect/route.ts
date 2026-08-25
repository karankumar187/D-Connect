import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getDiscordOAuthUrl,
  isDiscordOAuthConfigured,
} from '@/lib/discord';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConfigured = isDiscordOAuthConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message:
          'Discord OAuth2 is not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in your .env file or Developer Portal.',
      });
    }

    // Generate cryptographically secure random state (32 bytes)
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Store state in DB for CSRF protection
    await prisma.oAuthState.create({
      data: {
        userId: session.userId,
        state: state,
        expiresAt: expiresAt,
      },
    });

    const authUrl = getDiscordOAuthUrl(state);

    return NextResponse.json({
      success: true,
      configured: true,
      url: authUrl,
    });
  } catch (error: any) {
    console.error('Discord connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Discord OAuth connection' },
      { status: 500 }
    );
  }
}
