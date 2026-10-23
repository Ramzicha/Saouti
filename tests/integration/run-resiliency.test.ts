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
          limit: vi.fn().mockResolvedValue([{ id: 'active-run-123', status: 'running' }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@/lib/agent-engine/event-stream', () => ({
  signalRunCancellation: vi.fn().mockResolvedValue(undefined),
  publishRunEvent: vi.fn().mockResolvedValue('1-0'),
  isRunCancelled: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/agent-engine/orchestrator', () => ({
  executeAgentPipeline: vi.fn().mockResolvedValue({
    posts: [],
    totalDurationMs: 120,
    status: 'cancelled',
  }),
}));

import { validateCurrentSession } from '@/lib/auth/session';
import { signalRunCancellation, publishRunEvent } from '@/lib/agent-engine/event-stream';
import { POST } from '@/app/api/runs/[runId]/cancel/route';
import { processRunGenerationJob } from '@/worker/processors/agent-engine';
import { executeAgentPipeline } from '@/lib/agent-engine/orchestrator';

describe('Run Resiliency & Cancellation Integration (run-resiliency.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels active run on POST /api/runs/[runId]/cancel', async () => {
    vi.mocked(validateCurrentSession).mockResolvedValueOnce({
      session: { id: 's-1' } as any,
      user: { id: 'u-1' } as any,
    });

    const req = new NextRequest('http://localhost:3000/api/runs/active-run-123/cancel', {
      method: 'POST',
    });

    const res = await POST(req, { params: Promise.resolve({ runId: 'active-run-123' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('cancelled');

    expect(signalRunCancellation).toHaveBeenCalledWith('active-run-123');
    expect(publishRunEvent).toHaveBeenCalledWith(
      'active-run-123',
      expect.objectContaining({ event: 'run.cancelled' }),
    );
  });

  it('worker processor invokes orchestrator with job parameters', async () => {
    const mockJob: any = {
      name: 'generate-post-run',
      data: {
        runId: 'job-run-999',
        userId: 'u-1',
        topicBrief: 'Observability agent release',
        selectedPlatforms: ['linkedin'],
        targetLanguage: 'en',
        arabicDialect: 'none',
        skipCritic: false,
      },
    };

    await processRunGenerationJob(mockJob);

    expect(executeAgentPipeline).toHaveBeenCalledWith({
      runId: 'job-run-999',
      userId: 'u-1',
      topicBrief: 'Observability agent release',
      selectedPlatforms: ['linkedin'],
      targetLanguage: 'en',
      arabicDialect: 'none',
      skipCritic: false,
    });
  });
});
