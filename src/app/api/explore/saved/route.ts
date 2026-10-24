import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { listSavedArticles, saveArticle } from '@/lib/explore/saved-service';
import { SaveArticleInputSchema } from '@/lib/explore/schemas';

/**
 * GET /api/explore/saved
 * Retrieves the current user's bookmarked reading list.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || undefined;

    const saved = await listSavedArticles(user.id, { topicPhrase: topic });
    return NextResponse.json({ savedArticles: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve saved articles';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/explore/saved
 * Bookmarks an article for later reading and drafting.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = SaveArticleInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid article data',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const saved = await saveArticle(user.id, parseResult.data);
    return NextResponse.json({ savedArticle: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to bookmark article';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
