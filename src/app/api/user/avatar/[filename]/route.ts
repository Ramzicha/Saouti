import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { getStorageProvider } from '@/lib/storage/local-storage';

interface RouteContext {
  params: Promise<{ filename: string }>;
}

/**
 * GET /api/user/avatar/[filename]
 * Serves public/authenticated user avatar image.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { filename } = await context.params;
    // Basic path traversal prevention
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const storageKey = `avatars/${safeFilename}`;

    const storage = getStorageProvider();
    const stored = await storage.getImageStream(storageKey);

    const webStream = Readable.toWeb(stored.stream as Readable);

    return new Response(webStream as ReadableStream, {
      headers: {
        'Content-Type': stored.contentType || 'image/png',
        'Content-Length': String(stored.contentLength),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Avatar not found' },
      { status: 404 },
    );
  }
}
