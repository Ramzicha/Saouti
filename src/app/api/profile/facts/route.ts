import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const facts = await DocumentService.listActiveApprovedFacts(user.id);
    return NextResponse.json({ facts }, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list active approved facts');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve approved facts' } },
      { status: 500 },
    );
  }
}
