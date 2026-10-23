import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { ImageService } from '@/lib/library/image-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

export async function PATCH(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId, imageId } = await context.params;
    const updated = await ImageService.setPrimaryImage(postId, imageId, user.id);

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Image or post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ image: updated });
  } catch (err) {
    logger.error({ err }, 'Failed to set primary image');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update primary image' } },
      { status: 500 },
    );
  }
}
