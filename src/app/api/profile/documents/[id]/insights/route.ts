import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { logger } from '@/lib/logger';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const insights = await DocumentService.listInsightsForDocument(id, user.id);

    return NextResponse.json({ insights }, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list document insights');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve insights' } },
      { status: 500 },
    );
  }
}
