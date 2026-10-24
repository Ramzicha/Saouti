import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { logger } from '@/lib/logger';

export async function DELETE(
  req: NextRequest,
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
    const url = new URL(req.url);
    const keepFactsParam = url.searchParams.get('keepApprovedFacts') ?? 'true';
    const keepApprovedFacts = keepFactsParam !== 'false';

    const result = await DocumentService.deleteDocument(id, user.id, keepApprovedFacts);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete profile document');
    const message = error instanceof Error ? error.message : 'Deletion failed';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
