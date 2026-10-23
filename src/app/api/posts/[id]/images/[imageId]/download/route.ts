import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import path from 'node:path';
import { validateCurrentSession } from '@/lib/auth/session';
import { getPostById } from '@/lib/library/post-service';
import { ImageService } from '@/lib/library/image-service';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

/**
 * GET /api/posts/[id]/images/[imageId]/download
 * Downloads image file with forced Content-Disposition attachment.
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
    const post = await getPostById(user.id, postId);
    const image = await ImageService.getImageById(imageId, user.id);

    if (!post || !image || image.postId !== postId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Image or post not found' } },
        { status: 404 },
      );
    }

    const storage = getStorageProvider();
    const stored = await storage.getImageStream(image.storageKey);

    const ext = path.extname(image.storageKey) || (stored.contentType === 'image/svg+xml' ? '.svg' : '.png');
    const safePlatform = post.platform.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `saouti-${safePlatform}-${image.id.slice(0, 8)}${ext}`;

    const webStream = Readable.toWeb(stored.stream as Readable);

    return new Response(webStream as ReadableStream, {
      headers: {
        'Content-Type': stored.contentType,
        'Content-Length': String(stored.contentLength),
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to download post image');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to download visual asset' } },
      { status: 500 },
    );
  }
}
