import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { validateCurrentSession } from '@/lib/auth/session';
import { ImageService } from '@/lib/library/image-service';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

/**
 * GET /api/posts/[id]/images/[imageId]
 * Authenticated streaming endpoint for private post images.
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

    const { id: postId, imageId } = await context.params;
    const image = await ImageService.getImageById(imageId, user.id);

    if (!image || image.postId !== postId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Image not found' } },
        { status: 404 },
      );
    }

    const storage = getStorageProvider();
    const stored = await storage.getImageStream(image.storageKey);

    // Convert Node Readable to Web ReadableStream
    const webStream = Readable.toWeb(stored.stream as Readable);

    return new Response(webStream as ReadableStream, {
      headers: {
        'Content-Type': stored.contentType,
        'Content-Length': String(stored.contentLength),
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to stream post image');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to stream visual asset' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/posts/[id]/images/[imageId]
 * Deletes a specific image iteration and its underlying binary file.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId, imageId } = await context.params;
    const success = await ImageService.deleteImage(postId, imageId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Image not found or not owned by user' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to delete post image');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete visual asset' } },
      { status: 500 },
    );
  }
}
