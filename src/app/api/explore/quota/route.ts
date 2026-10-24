import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getQuotaStatus } from '@/lib/explore/quota-guard';
import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/explore/quota
 * Retrieves the current user's search quota, daily usage, and monthly Tavily credit status.
 */
export async function GET(_req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const keyRecords = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, 'tavily')))
      .limit(1);

    const hasTavilyKey = keyRecords.length > 0;
    const status = await getQuotaStatus(user.id, hasTavilyKey);

    return NextResponse.json({ quota: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve quota';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
