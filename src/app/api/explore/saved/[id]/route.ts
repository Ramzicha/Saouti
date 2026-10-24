import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { updateSavedArticleNote, removeSavedArticle } from '@/lib/explore/saved-service';
import { UpdateSavedArticleNoteSchema } from '@/lib/explore/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/explore/saved/[id]
 * Updates private drafting notes on a saved article.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const parseResult = UpdateSavedArticleNoteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid note data',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const updated = await updateSavedArticleNote(
      user.id,
      id,
      parseResult.data.privateNote ?? null,
    );

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Saved article not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ savedArticle: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update saved article note';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/explore/saved/[id]
 * Removes an article from the user's saved reading list.
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

    const { id } = await context.params;
    const removed = await removeSavedArticle(user.id, id);

    if (!removed) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Saved article not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove saved article';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
