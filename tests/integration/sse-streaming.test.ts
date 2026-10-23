import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'test-run-123', status: 'completed' }]),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/agent-engine/event-stream', () => ({
  readRunEvents: vi.fn(),
}));

import { validateCurrentSession } from '@/lib/auth/session';
import { readRunEvents } from '@/lib/agent-engine/event-stream';
import { GET } from '@/app/api/runs/[runId]/events/route';

describe('SSE Streaming Route Integration (sse-streaming.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: null,
      user: null,
    });

    const req = new NextRequest('http://localhost:3000/api/runs/test-run-123/events');
    const res = await GET(req, { params: Promise.resolve({ runId: 'test-run-123' }) });

    expect(res.status).toBe(401);
  });

  it('returns event-stream with X-Accel-Buffering: no and replays events from Last-Event-ID', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 'session-123' } as any,
      user: { id: 'user-456' } as any,
    });

    vi.mocked(readRunEvents).mockResolvedValueOnce([
      {
        id: '1729700000000-0',
        event: {
          event: 'run.started',
          runId: 'test-run-123',
          timestamp: '2026-10-23T12:00:00Z',
          selectedPlatforms: ['linkedin'],
          skipCritic: false,
        },
      },
      {
        id: '1729700005000-0',
        event: {
          event: 'run.completed',
          runId: 'test-run-123',
          timestamp: '2026-10-23T12:00:05Z',
          totalDurationSeconds: 5,
          postCount: 1,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/runs/test-run-123/events', {
      headers: {
        'last-event-id': '1729699999000-0',
      },
    });

    const res = await GET(req, { params: Promise.resolve({ runId: 'test-run-123' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');

    // Verify readRunEvents received the last-event-id header
    expect(readRunEvents).toHaveBeenCalledWith('test-run-123', '1729699999000-0');

    // Read streamed output
    const text = await res.text();
    expect(text).toContain('id: 1729700000000-0');
    expect(text).toContain('event: run.started');
    expect(text).toContain('id: 1729700005000-0');
    expect(text).toContain('event: run.completed');
  });
});
