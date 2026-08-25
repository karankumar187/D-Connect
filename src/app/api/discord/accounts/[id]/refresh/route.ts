import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncDiscordAccount } from '@/lib/sync';

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

    const result = await syncDiscordAccount(id, session.userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to synchronize account',
          reauthorizationRequired: result.reauthorizationRequired || false,
        },
        { status: result.reauthorizationRequired ? 400 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: result.account,
      message: 'Account synchronized successfully with official Discord API',
    });
  } catch (error: any) {
    console.error('Manual refresh error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during manual refresh' },
      { status: 500 }
    );
  }
}
