import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { validateCurrentSession } from '@/lib/auth/session';
import { getPostById } from '@/lib/library/post-service';
import { generateUserImage } from '@/lib/ai/service';
import { ImageService } from '@/lib/library/image-service';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { GenerateImageRequestSchema } from '@/lib/validation/image-schemas';
import {
  AiUnsupportedCapabilityError,
  QuotaExhaustedError,
  AiSafetyBlockError,
} from '@/lib/ai/errors';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId } = await context.params;
    const post = await getPostById(user.id, postId);

    if (!post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    let bodyData = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body is optional
    }

    const parseResult = GenerateImageRequestSchema.safeParse(bodyData);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid image generation request',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const prompt =
      parseResult.data.prompt ||
      post.imagePrompt ||
      post.content.slice(0, 300);

    const aspectRatio =
      parseResult.data.aspectRatio ||
      (post.imageAspectRatio as '16:9' | '1:1' | '4:5' | '9:16') ||
      '16:9';

    // Generate visual via user provider key
    let result;
    try {
      result = await generateUserImage(user.id, prompt, { aspectRatio });
    } catch (err) {
      if (err instanceof AiUnsupportedCapabilityError) {
        return NextResponse.json(
          {
            error: {
              code: 'UNSUPPORTED_CAPABILITY',
              message:
                'Your configured AI provider key does not support direct image generation.',
            },
          },
          { status: 422 },
        );
      }

      if (err instanceof QuotaExhaustedError) {
        return NextResponse.json(
          {
            error: {
              code: 'QUOTA_EXHAUSTED',
              message: err.message,
              isDailyOrFreeTier: err.isDailyOrFreeTier,
              retryAfterSeconds: err.retryAfterSeconds,
            },
          },
          { status: 429 },
        );
      }

      if (err instanceof AiSafetyBlockError) {
        return NextResponse.json(
          {
            error: {
              code: 'SAFETY_BLOCK',
              message:
                'Image generation was blocked by safety filters. Adjust the prompt and try again.',
            },
          },
          { status: 400 },
        );
      }

      throw err;
    }

    // Persist binary to storage
    const imageId = crypto.randomUUID();
    const ext = result.mimeType === 'image/svg+xml' ? 'svg' : 'png';
    const storageKey = `images/${user.id}/${post.id}/${imageId}.${ext}`;

    const buffer =
      result.imageBuffer ||
      (result.base64Data ? Buffer.from(result.base64Data, 'base64') : Buffer.from(''));

    const storage = getStorageProvider();
    await storage.saveImage(buffer, storageKey, result.mimeType);

    // Save image record with automatic FIFO pruning
    const savedImage = await ImageService.saveNewImage({
      userId: user.id,
      postId: post.id,
      storageKey,
      mimeType: result.mimeType,
      fileSizeBytes: buffer.length,
      width: result.width || 1200,
      height: result.height || 675,
      aspectRatio,
      prompt,
      altText: parseResult.data.altText || post.imageAltText || undefined,
      isPrimary: true,
    });

    return NextResponse.json({ image: savedImage }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Failed to generate visual asset');
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Visual generation failed',
        },
      },
      { status: 500 },
    );
  }
}
