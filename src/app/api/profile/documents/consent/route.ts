import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { PrivacyConsentInputSchema } from '@/lib/documents/schemas';
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

    const consent = await DocumentService.getPrivacyConsent(user.id);

    return NextResponse.json({
      acknowledged: Boolean(consent),
      acknowledgedAt: consent ? consent.acknowledgedAt.toISOString() : null,
      noticeVersion: consent ? consent.noticeVersion : null,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to check document privacy consent');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve consent status' } },
      { status: 500 },
    );
  }
}

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
    const parseResult = PrivacyConsentInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid consent payload', details: parseResult.error.format() } },
        { status: 400 },
      );
    }

    await DocumentService.recordPrivacyConsent(user.id, parseResult.data.noticeVersion);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to record document privacy consent');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to record consent' } },
      { status: 500 },
    );
  }
}
