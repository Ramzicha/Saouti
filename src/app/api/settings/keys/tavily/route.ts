import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getKeyMetadata, saveEncryptedKey, deleteKey } from '@/lib/auth/keys';
import { validateTavilyKey } from '@/lib/search/tavily-validator';
import { logger } from '@/lib/logger';

/**
 * GET /api/settings/keys/tavily
 * Returns Tavily key status and masked suffix for the current authenticated user.
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

    const metadata = await getKeyMetadata(user.id, 'tavily');
    return NextResponse.json({
      hasKey: metadata.hasKey,
      key: metadata.hasKey
        ? {
            provider: 'tavily',
            lastFour: metadata.lastFour,
            status: metadata.status,
            lastValidatedAt: metadata.lastValidatedAt?.toISOString() || null,
          }
        : null,
    });
  } catch (err) {
    logger.error({ err }, 'Error retrieving Tavily key status');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve key status' } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/settings/keys/tavily
 * Validates, encrypts, and stores a new or replacement Tavily API key.
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

    const body = await request.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'API key is required' } },
        { status: 400 },
      );
    }

    // Live validation
    const validation = await validateTavilyKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_KEY',
            message: validation.error || 'Failed to validate Tavily API key',
          },
        },
        { status: 400 },
      );
    }

    // Encrypt and persist
    const result = await saveEncryptedKey(user.id, 'tavily', apiKey);

    return NextResponse.json(
      {
        success: true,
        lastFour: result.lastFour,
      },
      { status: 200 },
    );
  } catch (err) {
    logger.error({ err }, 'Error saving Tavily API key');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save API key' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/settings/keys/tavily
 * Removes the user's Tavily key permanently.
 */
export async function DELETE() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    await deleteKey(user.id, 'tavily');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error({ err }, 'Error deleting Tavily API key');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete key' } },
      { status: 500 },
    );
  }
}
