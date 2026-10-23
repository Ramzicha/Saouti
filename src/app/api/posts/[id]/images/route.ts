import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { ImageService } from '@/lib/library/image-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]/images
 * Returns all generated image iterations for a post.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId } = await context.params;
    const postImages = await ImageService.listImagesForPost(postId, user.id);

    return NextResponse.json({ images: postImages });
  } catch (err) {
    logger.error({ err }, 'Failed to list post images');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve visuals' } },
      { status: 500 },
    );
  }
}
