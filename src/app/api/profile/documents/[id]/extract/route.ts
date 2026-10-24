import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { executeDocumentProfilerStep } from '@/lib/agent-engine/agents/profiler-document';
import { logger } from '@/lib/logger';

export async function POST(
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
    const result = await executeDocumentProfilerStep({
      userId: user.id,
      documentId: id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, 'Profiler document extraction failed');
    const message = error instanceof Error ? error.message : 'Extraction failed';
    return NextResponse.json(
      { error: { code: 'EXTRACTION_FAILED', message } },
      { status: 422 },
    );
  }
}
