import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getUserAiAdapter } from '@/lib/ai/service';
import { aiConfig } from '@/lib/ai/config';
import { logger } from '@/lib/logger';

/**
 * GET /api/ai/capabilities/image
 * Checks if the authenticated user's configured provider key supports image generation.
 */
export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    try {
      const adapter = await getUserAiAdapter(user.id);
      if (typeof adapter.checkImageCapability === 'function') {
        const capability = await adapter.checkImageCapability();
        return NextResponse.json(capability);
      }

      return NextResponse.json({
        supported: true,
        model: aiConfig.models.image,
        providerId: adapter.providerId,
      });
    } catch {
      return NextResponse.json({
        supported: false,
        model: aiConfig.models.image,
        providerId: 'none',
        reason: 'No configured AI provider key found. Add a key in Settings.',
      });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to check image generation capability');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to verify visual capabilities' } },
      { status: 500 },
    );
  }
}
