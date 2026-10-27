import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { extractArticleContent } from '@/lib/explore/article-extractor';

export async function GET(req: NextRequest) {
  const { session, user } = await validateCurrentSession();
  if (!session || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  const content = await extractArticleContent(url, user.id);
  return NextResponse.json({ url, content });
}
