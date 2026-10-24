import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { logger } from '@/lib/logger';
import { Readable } from 'node:stream';

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
    const doc = await DocumentService.getDocumentById(id, user.id);

    if (!doc) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 },
      );
    }

    const storage = getStorageProvider();
    const stored = await storage.getFileStream(doc.storageKey);

    // Convert Node Readable stream to Web ReadableStream
    const webStream = Readable.toWeb(stored.stream as Readable);

    return new NextResponse(webStream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': stored.contentType || 'application/pdf',
        'Content-Length': stored.contentLength.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.originalFileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to stream document file');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve document binary' } },
      { status: 500 },
    );
  }
}
