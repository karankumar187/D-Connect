import { NextResponse } from 'next/server';
import { runGlobalBackgroundSync } from '@/lib/sync';

export async function GET(request: Request) {
  // Can be called by a cron service or internal background interval
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  const cronSecret = process.env.CRON_SECRET || process.env.SECRET_KEY;
  if (secret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runGlobalBackgroundSync();
    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('Background cron sync error:', error);
    return NextResponse.json(
      { error: 'Background sync job failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
