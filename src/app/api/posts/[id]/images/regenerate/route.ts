import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { validateCurrentSession } from '@/lib/auth/session';
import { getPostById } from '@/lib/library/post-service';
import { generateUserImage } from '@/lib/ai/service';
import { ImageService } from '@/lib/library/image-service';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { RegenerateImageRequestSchema } from '@/lib/validation/image-schemas';
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

    const body = await req.json();
    const parseResult = RegenerateImageRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid regeneration request',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { instruction, aspectRatio: customRatio } = parseResult.data;
    const basePrompt = post.imagePrompt || post.content.slice(0, 300);
    const refinedPrompt = `${basePrompt}\n\nRefinement: ${instruction}`;

    const aspectRatio =
      customRatio ||
      (post.imageAspectRatio as '16:9' | '1:1' | '4:5' | '9:16') ||
      '16:9';

    let result;
    try {
      result = await generateUserImage(user.id, refinedPrompt, { aspectRatio });
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
              message: 'Rate limit or quota reached on image generation.',
              retryAfterSeconds: err.retryAfterSeconds || 20,
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
                'Refinement instruction was blocked by safety filters. Adjust the text and try again.',
            },
          },
          { status: 400 },
        );
      }

      throw err;
    }

    const imageId = crypto.randomUUID();
    const ext = result.mimeType === 'image/svg+xml' ? 'svg' : 'png';
    const storageKey = `images/${user.id}/${post.id}/${imageId}.${ext}`;

    const buffer =
      result.imageBuffer ||
      (result.base64Data ? Buffer.from(result.base64Data, 'base64') : Buffer.from(''));

    const storage = getStorageProvider();
    await storage.saveImage(buffer, storageKey, result.mimeType);

    const saved = await ImageService.saveNewImage({
      userId: user.id,
      postId: post.id,
      storageKey,
      mimeType: result.mimeType,
      fileSizeBytes: buffer.length,
      width: result.width || 1200,
      height: result.height || 675,
      aspectRatio,
      prompt: refinedPrompt,
      altText: post.imageAltText || undefined,
      refinementInstruction: instruction,
      isPrimary: true,
    });

    return NextResponse.json({ image: saved }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Failed to regenerate visual asset');
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Visual regeneration failed',
        },
      },
      { status: 500 },
    );
  }
}
