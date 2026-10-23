import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { listPosts } from '@/lib/library/post-service';
import { exportPostsToMarkdown, exportPostsToText } from '@/lib/export/post-exporter';
import { PostFilterQuerySchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/posts/export
 * Exports selected or filtered library posts as Markdown (.md) or plain text (.txt).
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

    const { searchParams } = req.nextUrl;
    const format = searchParams.get('format') === 'markdown' ? 'markdown' : 'text';

    const rawQuery = {
      platform: searchParams.get('platform') || undefined,
      status: searchParams.get('status') || undefined,
      tag: searchParams.get('tag') || undefined,
      search: searchParams.get('search') || undefined,
      limit: 1000, // Export up to 1000 items
    };

    const parseResult = PostFilterQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid export filter query' } },
        { status: 400 },
      );
    }

    const result = await listPosts({
      userId: user.id,
      ...parseResult.data,
    });

    const isMarkdown = format === 'markdown';
    const content = isMarkdown
      ? exportPostsToMarkdown(result.posts)
      : exportPostsToText(result.posts);

    const filename = `saouti-posts-${new Date().toISOString().slice(0, 10)}.${isMarkdown ? 'md' : 'txt'}`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': isMarkdown ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to export posts');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to export posts' } },
      { status: 500 },
    );
  }
}
