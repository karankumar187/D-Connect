import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDiscordOAuthUrl, isDiscordOAuthConfigured } from '@/lib/discord';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;

    const account = await prisma.discordAccount.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!isDiscordOAuthConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Discord OAuth credentials are not configured.',
      });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oAuthState.create({
      data: {
        userId: session.userId,
        state: state,
        redirectTo: `/accounts/${id}`,
        expiresAt: expiresAt,
      },
    });

    const url = getDiscordOAuthUrl(state);

    return NextResponse.json({
      success: true,
      url: url,
    });
  } catch (error: any) {
    console.error('Reconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reconnect URL' },
      { status: 500 }
    );
  }
}
