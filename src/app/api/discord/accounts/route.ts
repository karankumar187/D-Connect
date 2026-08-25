import { NextResponse } from 'next/server';
import { getSession, sanitizeAccount } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const status = searchParams.get('status');
    const nitroStatus = searchParams.get('nitroStatus');

    const where: any = {
      userId: session.userId,
    };

    if (status && status !== 'all') {
      where.authorizationStatus = status;
    }

    if (nitroStatus && nitroStatus !== 'all') {
      where.nitroStatus = nitroStatus;
    }

    const accounts = await prisma.discordAccount.findMany({
      where: where,
      orderBy: { createdAt: 'desc' },
    });

    let filtered = accounts;
    if (search) {
      filtered = accounts.filter(
        (acc) =>
          acc.username.toLowerCase().includes(search) ||
          (acc.globalName && acc.globalName.toLowerCase().includes(search)) ||
          acc.discordUserId.includes(search)
      );
    }

    const safeAccounts = filtered.map(sanitizeAccount);

    return NextResponse.json({
      accounts: safeAccounts,
      total: safeAccounts.length,
    });
  } catch (error: any) {
    console.error('Fetch accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord accounts' },
      { status: 500 }
    );
  }
}
