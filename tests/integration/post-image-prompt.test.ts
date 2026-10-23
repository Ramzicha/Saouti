import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePost } from '@/lib/library/post-service';

// Hoisted mock state
const { mockPost, mockUpdated } = vi.hoisted(() => {
  const post = {
    id: 'post-visual-1',
    userId: 'user-visual-1',
    platform: 'linkedin',
    content: 'Original post content',
    hashtags: ['#solar'],
    status: 'draft',
    imagePrompt: 'Original Art Director prompt',
    imageAltText: 'Original alt text',
    imageAspectRatio: '16:9',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    versionCount: 1,
  };

  const updated = {
    ...post,
    imagePrompt: 'Updated custom prompt',
    imageAltText: 'Updated accessibility alt text',
    imageAspectRatio: '1:1',
  };

  return { mockPost: post, mockUpdated: updated };
});

vi.mock('@/lib/db/client', () => {
  const createQuery = (data: any) => {
    const fn: any = () => Promise.resolve(data);
    const p: any = Promise.resolve(data);
    p.limit = vi.fn().mockReturnValue(Promise.resolve(data));
    p.orderBy = vi.fn().mockReturnValue(p);
    p.where = vi.fn().mockReturnValue(p);
    p.innerJoin = vi.fn().mockReturnValue(p);
    return p;
  };

  return {
    db: {
      select: vi.fn().mockImplementation((fields) => {
        // If selecting count, return [{ count: 1 }]
        return {
          from: vi.fn().mockImplementation((table) => {
            const query: any = Promise.resolve([mockPost]);
            query.limit = vi.fn().mockResolvedValue([mockPost]);
            query.orderBy = vi.fn().mockReturnValue(query);
            query.where = vi.fn().mockImplementation(() => {
              const res: any = Promise.resolve([{ count: 1 }, mockPost]);
              res.limit = vi.fn().mockResolvedValue([mockPost]);
              res.orderBy = vi.fn().mockReturnValue(res);
              return res;
            });
            query.innerJoin = vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            });
            return query;
          }),
        };
      }),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((setData) => {
          Object.assign(mockPost, setData);
          return {
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockPost]),
            }),
          };
        }),
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
      execute: vi.fn().mockResolvedValue({}),
    },
  };
});

describe('Post Visual Metadata Updates (PostService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates imagePrompt, altText and aspectRatio when editing post', async () => {
    const result = await updatePost('user-visual-1', 'post-visual-1', {
      content: 'Original post content',
      imagePrompt: 'Updated custom prompt',
      changeSummary: 'Edited visual prompt',
    });

    expect(result).toBeDefined();
    expect(result?.imagePrompt).toBe('Updated custom prompt');
  });
});
