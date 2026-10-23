import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAgentPipeline } from '@/lib/agent-engine/orchestrator';
import type { AgentEngineEvent } from '@/lib/agent-engine/events';

// Mock DB client
const createQueryMock = () => {
  const result: any[] = [];
  const query: any = Promise.resolve(result);
  query.limit = vi.fn().mockResolvedValue(result);
  query.where = vi.fn().mockReturnValue(query);
  return {
    from: vi.fn().mockReturnValue(query),
  };
};

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryMock()),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-step-id' }]),
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
  publishRunEvent: vi.fn().mockResolvedValue('1-0'),
  isRunCancelled: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/agent-engine/agents/writer', () => ({
  WRITER_PROMPT_VERSION: 'v1',
  executeWriterStep: vi.fn(),
}));

vi.mock('@/lib/agent-engine/agents/critic', () => ({
  CRITIC_PROMPT_VERSION: 'v1',
  executeCriticStep: vi.fn(),
}));

vi.mock('@/lib/agent-engine/agents/art-director', () => ({
  ART_DIRECTOR_PROMPT_VERSION: 'v1',
  executeArtDirectorStep: vi.fn(),
}));

import { executeWriterStep } from '@/lib/agent-engine/agents/writer';
import { executeCriticStep } from '@/lib/agent-engine/agents/critic';
import { executeArtDirectorStep } from '@/lib/agent-engine/agents/art-director';

describe('Critic Skip / Fast Draft Option (critic-skip.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bypasses Critic step and transitions directly from Writer to Art Director when skipCritic is true', async () => {
    const mockWriter = vi.mocked(executeWriterStep);
    const mockCritic = vi.mocked(executeCriticStep);
    const mockArt = vi.mocked(executeArtDirectorStep);

    mockWriter.mockResolvedValueOnce({
      posts: [
        {
          platform: 'linkedin',
          language: 'en',
          text: 'Fast draft post test content.',
          hashtags: ['#FastDraft'],
        },
      ],
    });

    mockArt.mockResolvedValueOnce({
      visuals: [
        {
          platform: 'linkedin',
          prompt: 'Clean visual concept illustration',
          aspectRatio: '16:9',
          altText: 'Alt text',
        },
      ],
    });

    const emittedEvents: AgentEngineEvent[] = [];

    const result = await executeAgentPipeline({
      runId: 'fast-draft-run-123',
      userId: 'user-1',
      topicBrief: 'Quick product update',
      selectedPlatforms: ['linkedin'],
      skipCritic: true,
      onEvent: (e) => {
        emittedEvents.push(e);
      },
    });

    expect(result.status).toBe('completed');
    expect(result.posts).toHaveLength(1);

    // Critic agent must NEVER be called
    expect(mockCritic).not.toHaveBeenCalled();

    // Writer and Art Director called exactly once (2 model calls total)
    expect(mockWriter).toHaveBeenCalledTimes(1);
    expect(mockArt).toHaveBeenCalledTimes(1);

    // Verify handoff reason explicitly states Fast Draft
    const handoff = emittedEvents.find((e) => e.event === 'agent.handoff');
    expect(handoff).toBeDefined();
    expect(handoff).toMatchObject({
      fromAgent: 'writer',
      toAgent: 'art',
      reason: expect.stringContaining('Fast Draft'),
    });
  });
});
