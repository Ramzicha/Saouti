import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profilerSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  conductProfilerTurn,
  synthesizeVoiceProfileProposal,
  ChatMessage,
} from '@/lib/profile/profiler-agent';
import { QuotaExhaustedError, InvalidApiKeyError } from '@/lib/ai/errors';
import { logger } from '@/lib/logger';

/**
 * POST /api/profile/profiler/chat
 * Multi-turn AI Profiler interview turn. Streams SSE events to the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { message, locale = 'en' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Answer message is required' } },
        { status: 400 },
      );
    }

    // Retrieve active profiler session or create a new one
    const sessionRecords = await db
      .select()
      .from(profilerSessions)
      .where(eq(profilerSessions.userId, user.id))
      .limit(1);

    let activeSession = sessionRecords[0];
    let history: ChatMessage[] = [];

    if (!activeSession) {
      const inserted = await db
        .insert(profilerSessions)
        .values({
          userId: user.id,
          status: 'in_progress',
          messages: [],
        })
        .returning();
      activeSession = inserted[0]!;
    } else {
      history = (activeSession.messages as ChatMessage[]) || [];
    }

    // Append user's new message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    history.push(userMessage);

    // Call the Profiler agent with error handling for quota/key failure
    try {
      const turnResult = await conductProfilerTurn(
        user.id,
        history,
        message,
        locale,
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: turnResult.nextQuestion,
        timestamp: new Date().toISOString(),
      };
      history.push(assistantMessage);

      let proposedProfile: Record<string, unknown> | null = null;
      if (turnResult.isComplete) {
        // Synthesize proposal
        proposedProfile = await synthesizeVoiceProfileProposal(
          user.id,
          history,
          locale,
        );
      }

      // Persist updated transcript and proposal in DB
      await db
        .update(profilerSessions)
        .set({
          messages: history,
          ...(proposedProfile ? { proposedProfile, status: 'completed' } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profilerSessions.id, activeSession.id));

      return NextResponse.json({
        success: true,
        reply: turnResult.nextQuestion,
        isComplete: turnResult.isComplete,
        proposedProfile,
      });
    } catch (err: unknown) {
      // Check for mid-interview API key failure
      if (
        err instanceof QuotaExhaustedError ||
        err instanceof InvalidApiKeyError
      ) {
        // Persist transcript so far
        await db
          .update(profilerSessions)
          .set({
            messages: history,
            updatedAt: new Date(),
          })
          .where(eq(profilerSessions.id, activeSession.id));

        return NextResponse.json(
          {
            error: {
              code: 'KEY_ERROR',
              reason:
                err instanceof QuotaExhaustedError
                  ? 'QUOTA_EXHAUSTED'
                  : 'INVALID_KEY',
              message: err.message,
            },
          },
          { status: 429 },
        );
      }
      throw err;
    }
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to process profiler turn');
    const msg = err instanceof Error ? err.message : 'Profiler error';
    return NextResponse.json(
      { error: { code: 'PROFILER_ERROR', message: msg } },
      { status: 500 },
    );
  }
}
