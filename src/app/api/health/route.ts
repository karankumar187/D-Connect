import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDiscordOAuthConfigured } from '@/lib/discord';

export async function GET() {
  try {
    // Check MongoDB database connectivity
    await prisma.user.findFirst({ select: { id: true } });

    return NextResponse.json({
      status: 'healthy',
      database: 'mongodb',
      timestamp: new Date().toISOString(),
      discordOAuthConfigured: isDiscordOAuthConfigured(),
      version: '1.0.0',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
