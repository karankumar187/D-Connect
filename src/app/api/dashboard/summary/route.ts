import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardSummary } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalConnected,
      nitroActive,
      nitroInactive,
      nitroNotAvailable,
      needsReauthorization,
      lastSyncLog,
    ] = await Promise.all([
      prisma.discordAccount.count({
        where: {
          userId: session.userId,
          authorizationStatus: { not: 'disconnected' },
        },
      }),
      prisma.discordAccount.count({
        where: {
          userId: session.userId,
          authorizationStatus: 'connected',
          nitroStatus: 'active',
        },
      }),
      prisma.discordAccount.count({
        where: {
          userId: session.userId,
          authorizationStatus: 'connected',
          nitroStatus: 'inactive',
        },
      }),
      prisma.discordAccount.count({
        where: {
          userId: session.userId,
          authorizationStatus: 'connected',
          nitroStatus: 'not_available',
        },
      }),
      prisma.discordAccount.count({
        where: {
          userId: session.userId,
          authorizationStatus: { in: ['reauthorization_required', 'expired', 'error'] },
        },
      }),
      prisma.syncLog.findFirst({
        where: {
          discordAccount: { userId: session.userId },
          status: 'success',
        },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    const summary: DashboardSummary = {
      totalConnected,
      nitroActive,
      nitroInactive,
      nitroNotAvailable,
      needsReauthorization,
      lastGlobalSyncAt: lastSyncLog?.completedAt
        ? lastSyncLog.completedAt.toISOString()
        : null,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Summary fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard summary' },
      { status: 500 }
    );
  }
}
