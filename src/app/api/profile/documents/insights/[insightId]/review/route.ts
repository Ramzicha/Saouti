import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { InsightReviewInputSchema } from '@/lib/documents/schemas';
import { logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ insightId: string }> },
) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { insightId } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = InsightReviewInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review payload',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const result = await DocumentService.reviewInsight({
      insightId,
      userId: user.id,
      action: parseResult.data.action,
      ...(parseResult.data.editedText ? { editedText: parseResult.data.editedText } : {}),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, 'Failed to review document insight');
    const message = error instanceof Error ? error.message : 'Review action failed';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
