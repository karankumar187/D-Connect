import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, props: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;

    // Verify ownership
    const account = await prisma.discordAccount.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const logs = await prisma.syncLog.findMany({
      where: { discordAccountId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    const safeLogs = logs.map((log) => ({
      id: log.id,
      startedAt: log.startedAt.toISOString(),
      completedAt: log.completedAt ? log.completedAt.toISOString() : null,
      status: log.status,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
      details: log.details,
    }));

    return NextResponse.json({
      accountId: id,
      logs: safeLogs,
    });
  } catch (error: any) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sync history' },
      { status: 500 }
    );
  }
}
