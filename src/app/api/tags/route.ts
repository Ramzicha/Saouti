import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { tags, postTags } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TagInputSchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/tags
 * Lists all tags created by the authenticated user with post counts.
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

    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        postCount: sql<number>`count(${postTags.postId})::int`,
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(tags.userId, user.id))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return NextResponse.json({ tags: userTags });
  } catch (err) {
    logger.error({ err }, 'Failed to list tags');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tags' } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tags
 * Creates a new tag for the authenticated user (max 30 chars).
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

    const body = await req.json();
    const parseResult = TagInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tag data',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    // Check if tag already exists for user
    const [existing] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, user.id), eq(tags.name, parseResult.data.name)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ tag: existing });
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        userId: user.id,
        name: parseResult.data.name,
        color: parseResult.data.color,
      })
      .returning();

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Failed to create tag');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create tag' } },
      { status: 500 },
    );
  }
}
