import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { articleDismissals, articles } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { DismissArticleSchema } from '@/lib/explore/schemas';
import { normalizeCanonicalUrl } from '@/lib/search/url-normalizer';

/**
 * POST /api/explore/dismiss
 * Records an article dismissal ("Not interested") and removes it from active feeds.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = DismissArticleSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid article URL',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const normalizedUrl = normalizeCanonicalUrl(parseResult.data.canonicalUrl);

    // 1. Record dismissal in articleDismissals table
    await db
      .insert(articleDismissals)
      .values({
        userId: user.id,
        canonicalUrl: normalizedUrl,
      })
      .onConflictDoNothing();

    // 2. Remove article from active cached articles
    await db
      .delete(articles)
      .where(
        and(
          eq(articles.userId, user.id),
          sql`(${articles.canonicalUrl} = ${normalizedUrl} OR ${articles.canonicalUrl} = ${parseResult.data.canonicalUrl})`,
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to dismiss article';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
