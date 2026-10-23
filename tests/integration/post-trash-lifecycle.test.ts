import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
}));

vi.mock('@/lib/library/post-service', () => ({
  moveToTrash: vi.fn().mockResolvedValue(true),
  restoreFromTrash: vi.fn().mockResolvedValue(true),
  permanentlyDeletePost: vi.fn().mockResolvedValue(true),
}));

import { validateCurrentSession } from '@/lib/auth/session';
import { moveToTrash, restoreFromTrash, permanentlyDeletePost } from '@/lib/library/post-service';
import { POST as trashPOST } from '@/app/api/posts/[id]/trash/route';
import { POST as restorePOST } from '@/app/api/posts/[id]/restore/route';
import { DELETE as deletePost } from '@/app/api/posts/[id]/route';

describe('Post Trash & Deletion Lifecycle (post-trash-lifecycle.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves post to 30-day trash upon POST /api/posts/[id]/trash', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'u-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/posts/p-10/trash', {
      method: 'POST',
    });

    const res = await trashPOST(req, { params: Promise.resolve({ id: 'p-10' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(moveToTrash).toHaveBeenCalledWith('u-1', 'p-10');
  });

  it('restores post from trash upon POST /api/posts/[id]/restore', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'u-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/posts/p-10/restore', {
      method: 'POST',
    });

    const res = await restorePOST(req, { params: Promise.resolve({ id: 'p-10' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(restoreFromTrash).toHaveBeenCalledWith('u-1', 'p-10');
  });

  it('permanently deletes post when permanent query parameter is true', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'u-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/posts/p-10?permanent=true', {
      method: 'DELETE',
    });

    const res = await deletePost(req, { params: Promise.resolve({ id: 'p-10' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.mode).toBe('permanent');
    expect(permanentlyDeletePost).toHaveBeenCalledWith('u-1', 'p-10');
  });
});
