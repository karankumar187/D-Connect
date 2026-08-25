import { NextResponse } from 'next/server';
import { getSession, sanitizeAccount } from '@/lib/auth';
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

    const account = await prisma.discordAccount.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      account: sanitizeAccount(account),
      recentSyncLogs: account.syncLogs.map((log) => ({
        id: log.id,
        startedAt: log.startedAt.toISOString(),
        completedAt: log.completedAt ? log.completedAt.toISOString() : null,
        status: log.status,
        errorCode: log.errorCode,
        errorMessage: log.errorMessage,
        details: log.details,
      })),
    });
  } catch (error: any) {
    console.error('Fetch account details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account details' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: Params) {
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

    // Delete account and its associated sync logs (via onDelete: Cascade)
    await prisma.discordAccount.delete({
      where: { id: id },
    });

    // Create disconnect notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'account_disconnected',
        title: `Account Disconnected: @${account.username}`,
        body: `Discord account @${account.username} was successfully disconnected from the dashboard.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account @${account.username} disconnected successfully`,
    });
  } catch (error: any) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, props: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { nitroStatus, nitroPlan } = body;

    const account = await prisma.discordAccount.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const finalStatus = nitroStatus || (nitroPlan && nitroPlan !== 'None' ? 'active' : 'inactive');
    const finalPlan = nitroPlan === 'None' ? null : nitroPlan;

    const updated = await prisma.discordAccount.update({
      where: { id: id },
      data: {
        nitroStatus: finalStatus,
        nitroPlan: finalPlan,
      },
    });

    return NextResponse.json({
      success: true,
      account: sanitizeAccount(updated),
    });
  } catch (error: any) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
