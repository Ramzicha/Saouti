/**
 * Keyset Cursor Pagination Helper
 * Encodes and decodes opaque (createdAt, id) cursors for stable, high-performance database pagination.
 */

export interface DecodedCursor {
  createdAt: Date;
  id: string;
}

export function encodeCursor(createdAt: Date, id: string): string {
  const payload = JSON.stringify({
    createdAt: createdAt.toISOString(),
    id,
  });
  return Buffer.from(payload, 'utf-8').toString('base64url');
}

export function decodeCursor(cursor: string): DecodedCursor | null {
  if (!cursor || typeof cursor !== 'string') {
    return null;
  }

  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      !parsed ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string'
    ) {
      return null;
    }

    const date = new Date(parsed.createdAt);
    if (isNaN(date.getTime())) {
      return null;
    }

    return {
      createdAt: date,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}
