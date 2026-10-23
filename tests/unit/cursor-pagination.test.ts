import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '@/lib/db/cursor-pagination';

describe('cursor-pagination', () => {
  it('encodes and decodes valid createdAt and id', () => {
    const date = new Date('2026-10-23T18:00:00.000Z');
    const id = '550e8400-e29b-41d4-a716-446655440000';

    const cursor = encodeCursor(date, id);
    expect(typeof cursor).toBe('string');
    expect(cursor.length).toBeGreaterThan(0);

    const decoded = decodeCursor(cursor);
    expect(decoded).not.toBeNull();
    expect(decoded?.createdAt.toISOString()).toBe(date.toISOString());
    expect(decoded?.id).toBe(id);
  });

  it('returns null for invalid base64 or corrupt payload', () => {
    expect(decodeCursor('invalid-cursor')).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor(Buffer.from('not json').toString('base64'))).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ createdAt: 'bad-date' })).toString('base64'))).toBeNull();
  });
});
