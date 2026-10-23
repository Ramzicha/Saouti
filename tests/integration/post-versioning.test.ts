import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
}));

const { mockVersions } = vi.hoisted(() => {
  const versions = [
    {
      id: 'v-3',
      postId: 'p-1',
      versionNumber: 3,
      content: 'Third edit with sharpened hook.',
      hashtags: ['#ai'],
      imagePrompt: null,
      changeSummary: 'Hook polish',
      createdAt: new Date('2026-10-23T14:00:00Z'),
    },
    {
      id: 'v-2',
      postId: 'p-1',
      versionNumber: 2,
      content: 'Second edit with extra context.',
      hashtags: ['#ai'],
      imagePrompt: null,
      changeSummary: 'Context addition',
      createdAt: new Date('2026-10-23T12:00:00Z'),
    },
    {
      id: 'v-1',
      postId: 'p-1',
      versionNumber: 1,
      content: 'Initial generated draft.',
      hashtags: ['#ai'],
      imagePrompt: null,
      changeSummary: 'Initial generation from run',
      createdAt: new Date('2026-10-23T10:00:00Z'),
    },
  ];
  return { mockVersions: versions };
});

vi.mock('@/lib/library/post-service', async () => {
  const actual = await vi.importActual<any>('@/lib/library/post-service');
  return {
    ...actual,
    getPostVersions: vi.fn().mockResolvedValue(mockVersions),
    restoreVersion: vi.fn().mockImplementation((_userId, _postId, versionId) => {
      const target = mockVersions.find((v) => v.id === versionId);
      if (!target) return null;
      return {
        id: 'p-1',
        userId: 'user-1',
        platform: 'linkedin',
        content: target.content,
        hashtags: target.hashtags,
        status: 'ready',
        tags: [],
        versionCount: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  };
});

import { validateCurrentSession } from '@/lib/auth/session';
import { GET } from '@/app/api/posts/[id]/versions/route';
import { POST } from '@/app/api/posts/[id]/versions/[versionId]/restore/route';

describe('Post Versioning Integration (post-versioning.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists historical versions for a post', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/posts/p-1/versions', {
      method: 'GET',
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.versions).toHaveLength(3);
    expect(data.versions[0].versionNumber).toBe(3);
  });

  it('restores an earlier version to active content', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'user-1' } as any,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/posts/p-1/versions/v-1/restore',
      { method: 'POST' },
    );

    const res = await POST(req, {
      params: Promise.resolve({ id: 'p-1', versionId: 'v-1' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.post.content).toBe('Initial generated draft.');
  });
});
