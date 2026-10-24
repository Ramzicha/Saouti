import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/profile/documents/[id]/route';
import { DocumentService } from '@/lib/documents/document-service';
import * as sessionModule from '@/lib/auth/session';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
}));

describe('Integration: Document Deletion Flow (Option A vs Option B)', () => {
  const mockUser = { id: 'user-del-123', email: 'owner@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sessionModule, 'validateCurrentSession').mockResolvedValue({
      session: { id: 'sess-1' } as any,
      user: mockUser as any,
    });
  });

  it('Option A: deletes document and retains approved facts with keepApprovedFacts=true', async () => {
    const deleteSpy = vi
      .spyOn(DocumentService, 'deleteDocument')
      .mockResolvedValue({ success: true, retainedFactsCount: 3 });

    const req = new NextRequest(
      'http://localhost:3000/api/profile/documents/doc-abc?keepApprovedFacts=true',
      { method: 'DELETE' },
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'doc-abc' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.retainedFactsCount).toBe(3);

    expect(deleteSpy).toHaveBeenCalledWith('doc-abc', 'user-del-123', true);
  });

  it('Option B: deletes document and purges approved facts with keepApprovedFacts=false', async () => {
    const deleteSpy = vi
      .spyOn(DocumentService, 'deleteDocument')
      .mockResolvedValue({ success: true, retainedFactsCount: 0 });

    const req = new NextRequest(
      'http://localhost:3000/api/profile/documents/doc-abc?keepApprovedFacts=false',
      { method: 'DELETE' },
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'doc-abc' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.retainedFactsCount).toBe(0);

    expect(deleteSpy).toHaveBeenCalledWith('doc-abc', 'user-del-123', false);
  });

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(sessionModule, 'validateCurrentSession').mockResolvedValue({
      session: null,
      user: null,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/profile/documents/doc-abc',
      { method: 'DELETE' },
    );

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'doc-abc' }),
    });

    expect(res.status).toBe(401);
  });
});
