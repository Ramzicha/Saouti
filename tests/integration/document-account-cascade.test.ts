import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/delete-account/route';
import { DocumentService } from '@/lib/documents/document-service';
import * as sessionModule from '@/lib/auth/session';
import * as passwordModule from '@/lib/auth/password';
import { db } from '@/lib/db/client';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
  destroySession: vi.fn(),
}));

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([]),
    })),
  },
}));

describe('Integration: Document Account Cascade Purge', () => {
  const mockUser = {
    id: 'user-purge-999',
    email: 'user@example.com',
    passwordHash: 'hashed-pwd',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sessionModule, 'validateCurrentSession').mockResolvedValue({
      session: { id: 'sess-1' } as any,
      user: mockUser as any,
    });
    vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true);
    vi.spyOn(sessionModule, 'destroySession').mockResolvedValue(undefined);
  });

  it('calls DocumentService.purgeUserDocuments before deleting user record', async () => {
    const purgeSpy = vi
      .spyOn(DocumentService, 'purgeUserDocuments')
      .mockResolvedValue(undefined);

    const req = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'secretpassword',
        confirmationText: 'DELETE',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(purgeSpy).toHaveBeenCalledWith('user-purge-999');
    expect(db.delete).toHaveBeenCalled();
  });
});
