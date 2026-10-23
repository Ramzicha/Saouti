import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateUserText } from '@/lib/ai/service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty'),
  model: z.string().optional(),
});

/**
 * POST /api/generate
 * Gatekeeper endpoint: Strictly requires an active user API key before initiating AI generation.
 */
export async function POST(request: Request) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    // Gatekeeper: Check for active user API key
    const keys = await db
      .select({ id: apiKeys.id, status: apiKeys.status })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, 'gemini')))
      .limit(1);

    const activeKey = keys[0];
    if (!activeKey || activeKey.status !== 'active') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_API_KEY',
            message:
              'No active AI provider key configured. Please add your Gemini key in Settings to begin generation.',
          },
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parseResult = GenerateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid prompt',
          },
        },
        { status: 400 },
      );
    }

    const generateOptions: { model?: string } = {};
    if (parseResult.data.model) {
      generateOptions.model = parseResult.data.model;
    }

    const result = await generateUserText(
      user.id,
      parseResult.data.prompt,
      generateOptions,
    );

    return NextResponse.json({
      success: true,
      text: result.text,
      usage: result.usage,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Generation endpoint failure');
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json(
      { error: { code: 'GENERATION_ERROR', message } },
      { status: 500 },
    );
  }
}
