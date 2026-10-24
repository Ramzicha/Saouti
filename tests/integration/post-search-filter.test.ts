import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
}));

const mockPost1 = {
  id: 'p-1',
  userId: 'user-1',
  runId: 'run-1',
  platform: 'linkedin',
  language: 'en',
  status: 'ready',
  content: 'Optimizing agent workflows with structured outputs.',
  hashtags: ['#ai', '#engineering'],
  imagePrompt: 'Clean modern workspace',
  imageAltText: 'Minimal office',
  imageAspectRatio: '1:1',
  publishedUrl: null,
  publishedAt: null,
  deletedAt: null,
  createdAt: new Date('2026-10-23T10:00:00Z'),
  updatedAt: new Date('2026-10-23T10:00:00Z'),
};

const mockPost2 = {
  id: 'p-2',
  userId: 'user-1',
  runId: 'run-1',
  platform: 'x',
  language: 'ar',
  status: 'draft',
  content: 'أزمة الطاقة وحلول الذكاء الاصطناعي في الجزائر.',
  hashtags: ['#الجزائر', '#طاقة'],
  imagePrompt: null,
  imageAltText: null,
  imageAspectRatio: null,
  publishedUrl: null,
  publishedAt: null,
  deletedAt: null,
  createdAt: new Date('2026-10-23T11:00:00Z'),
  updatedAt: new Date('2026-10-23T11:00:00Z'),
};

vi.mock('@/lib/db/client', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const p = Promise.resolve([{ count: 1 }]);
            return Object.assign(p, {
              limit: vi.fn().mockResolvedValue([mockPost1]),
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockPost2, mockPost1]),
              })),
              innerJoin: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ postId: 'p-1' }]),
              })),
            });
          }),

          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([
              { postId: 'p-1', id: 't-1', name: 'Engineering', color: '#6366f1' },
            ]),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([mockPost1]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockPost1]),
          })),
        })),
      })),
      execute: vi.fn().mockResolvedValue([]),
    },
  };

});


import { validateCurrentSession } from '@/lib/auth/session';
import { GET, POST } from '@/app/api/posts/route';
import { normalizeArabicText } from '@/lib/search/arabic-normalizer';

describe('Post Search & Filter Integration (post-search-filter.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters posts by platform and status using cursor pagination', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/posts?platform=linkedin&status=ready&limit=20',
      { method: 'GET' },
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts).toBeDefined();
    expect(Array.isArray(data.posts)).toBe(true);
  });

  it('filters saved posts only when savedOnly=true is provided', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/posts?savedOnly=true&limit=20',
      { method: 'GET' },
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts).toBeDefined();
    expect(Array.isArray(data.posts)).toBe(true);
  });

  it('saves a generated post to the user library with status ready via POST /api/posts', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: '11111111-1111-1111-1111-111111111111',
        platform: 'linkedin',
        content: 'Post saved from chat to library',
        status: 'ready',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.post).toBeDefined();
    expect(data.message).toBe('Post saved to library successfully');
  });

  it('normalizes Arabic query in search matching', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    // Query with diacritics and Alef with Hamza
    const query = 'أَزْمَة';
    const normalized = normalizeArabicText(query);
    expect(normalized).toBe('ازمه');

    const req = new NextRequest(
      `http://localhost:3000/api/posts?search=${encodeURIComponent(query)}`,
      { method: 'GET' },
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toBeDefined();
  });
});

