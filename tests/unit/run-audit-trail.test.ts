import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordAgentStep, updateRunRecord } from '@/lib/agent-engine/audit';

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { db } from '@/lib/db/client';

describe('Run Audit Trail (run-audit-trail.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records an agent step with version, durations, and payload', async () => {
    const returningMock = vi.fn().mockResolvedValue([{ id: 'step-uuid-1' }]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    vi.mocked(db.insert).mockReturnValue({ values: valuesMock } as any);

    const stepId = await recordAgentStep({
      runId: 'run-uuid-1',
      agentId: 'writer',
      taskLabel: 'Draft LinkedIn post',
      model: 'gemini-2.0-flash',
      promptVersion: 'v1',
      status: 'completed',
      durationMs: 1420,
      outputPayload: { posts: [] },
    });

    expect(stepId).toBe('step-uuid-1');
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-uuid-1',
        agentId: 'writer',
        taskLabel: 'Draft LinkedIn post',
        promptVersion: 'v1',
        status: 'completed',
        durationMs: 1420,
      }),
    );
  });

  it('updates run record status and total duration', async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

    await updateRunRecord('run-uuid-1', {
      status: 'completed',
      totalDurationMs: 4500,
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        totalDurationMs: 4500,
      }),
    );
  });

  it('handles database insertion errors without throwing', async () => {
    vi.mocked(db.insert).mockImplementation(() => {
      throw new Error('Connection refused');
    });

    const stepId = await recordAgentStep({
      runId: 'run-uuid-1',
      agentId: 'critic',
      taskLabel: 'Evaluate posts',
      model: 'gemini-2.0-flash',
      promptVersion: 'v1',
      status: 'running',
    });

    expect(stepId).toBeUndefined();
  });
});
