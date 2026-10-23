import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { markAsPosted } from '@/lib/library/post-service';
import { MarkAsPostedSchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/mark-posted
 * Updates post status to 'posted' with optional publication URL and date.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const parseResult = MarkAsPostedSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid publication data',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const updated = await markAsPosted(user.id, id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ post: updated });
  } catch (err) {
    logger.error({ err }, 'Failed to mark post as posted');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update post status' } },
      { status: 500 },
    );
  }
}
