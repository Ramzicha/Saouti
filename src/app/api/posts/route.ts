import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { listPosts } from '@/lib/library/post-service';
import { PostFilterQuerySchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/posts
 * Lists posts with combined filtering, full-text search, and cursor-based keyset pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { searchParams } = req.nextUrl;
    const rawQuery = {
      platform: searchParams.get('platform') || undefined,
      status: searchParams.get('status') || undefined,
      tag: searchParams.get('tag') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      isTrash: searchParams.get('isTrash') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const parseResult = PostFilterQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid filter query parameters',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const result = await listPosts({
      userId: user.id,
      ...parseResult.data,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error({ err }, 'Failed to list library posts');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve posts' } },
      { status: 500 },
    );
  }
}
