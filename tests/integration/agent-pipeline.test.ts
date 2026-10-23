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

// Mock Redis stream and cancellation
vi.mock('@/lib/agent-engine/event-stream', () => ({
  publishRunEvent: vi.fn().mockResolvedValue('1-0'),
  isRunCancelled: vi.fn().mockResolvedValue(false),
}));

// Mock the AI agent callers to simulate deterministic multi-agent execution
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

describe('Deterministic Multi-Agent Generation Pipeline Integration (agent-pipeline.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes a 1-call multi-platform draft, passes critique, and generates visuals', async () => {
    const mockWriter = vi.mocked(executeWriterStep);
    const mockCritic = vi.mocked(executeCriticStep);
    const mockArt = vi.mocked(executeArtDirectorStep);

    // 1. Writer outputs 2 platform drafts in 1 call
    mockWriter.mockResolvedValueOnce({
      posts: [
        {
          platform: 'linkedin',
          language: 'en',
          text: 'We scaled our platform to [YOUR NUMBER] users without downtime.',
          hashtags: ['#Tech', '#Architecture'],
        },
        {
          platform: 'x',
          language: 'en',
          text: 'Hit [YOUR NUMBER] users with 0 downtime. Here is how 👇',
          hashtags: ['#DevOps'],
        },
      ],
    });

    // 2. Critic scores both drafts with passing scores
    mockCritic.mockResolvedValueOnce({
      overallVerdict: 'pass',
      evaluations: [
        {
          platform: 'linkedin',
          verdict: 'pass',
          scores: {
            voiceMatch: 5,
            principleCompliance: 5,
            audienceFit: 4,
            platformFit: 5,
            specificity: 4,
            factualSafety: 5,
          },
          issues: [],
          statusText: 'Strong voice and safe bracketed placeholders',
        },
        {
          platform: 'x',
          verdict: 'pass',
          scores: {
            voiceMatch: 4,
            principleCompliance: 5,
            audienceFit: 4,
            platformFit: 5,
            specificity: 4,
            factualSafety: 5,
          },
          issues: [],
          statusText: 'Punchy hook and proper character budget',
        },
      ],
    });

    // 3. Art Director generates visual prompts
    mockArt.mockResolvedValueOnce({
      visuals: [
        {
          platform: 'linkedin',
          prompt: 'Editorial isometric view of cloud data flow in clean blues and whites.',
          aspectRatio: '16:9',
          altText: 'Clean isometric diagram illustrating cloud data pipelines.',
        },
        {
          platform: 'x',
          prompt: 'Minimalist high-contrast technical blueprint of distributed architecture.',
          aspectRatio: '16:9',
          altText: 'Technical diagram representing distributed system resilience.',
        },
      ],
    });

    const emittedEvents: AgentEngineEvent[] = [];

    const result = await executeAgentPipeline({
      runId: 'test-run-123',
      userId: 'test-user-456',
      topicBrief: 'Our cloud scaling milestone',
      selectedPlatforms: ['linkedin', 'x'],
      onEvent: (e) => {
        emittedEvents.push(e);
      },
    });

    expect(result.status).toBe('completed');
    expect(result.posts).toHaveLength(2);

    // Verify Writer called exactly once (no revisions needed)
    expect(mockWriter).toHaveBeenCalledTimes(1);
    expect(mockCritic).toHaveBeenCalledTimes(1);
    expect(mockArt).toHaveBeenCalledTimes(1);

    // Verify post structure and placeholders
    const linkedinPost = result.posts.find((p) => p.platform === 'linkedin');
    expect(linkedinPost?.text).toContain('[YOUR NUMBER]');
    expect(linkedinPost?.imagePrompt).toContain('Editorial isometric');
    expect(linkedinPost?.criticVerdict).toBe('pass');

    // Verify sequence of streamed lifecycle events
    const eventNames = emittedEvents.map((e) => e.event);
    expect(eventNames).toEqual([
      'run.started',
      'agent.started', // writer
      'agent.completed', // writer
      'agent.started', // critic
      'agent.completed', // critic
      'agent.handoff', // to art
      'agent.started', // art
      'agent.completed', // art
      'run.completed',
    ]);
  });

  it('triggers a bounded 1-loop revision when Critic requests fixes', async () => {
    const mockWriter = vi.mocked(executeWriterStep);
    const mockCritic = vi.mocked(executeCriticStep);
    const mockArt = vi.mocked(executeArtDirectorStep);

    // Initial Writer draft
    mockWriter.mockResolvedValueOnce({
      posts: [
        {
          platform: 'linkedin',
          language: 'en',
          text: 'We definitely generated $10M in revenue yesterday!',
          hashtags: ['#Success'],
        },
      ],
    });

    // Critic flags hallucinated metric
    mockCritic.mockResolvedValueOnce({
      overallVerdict: 'revise',
      evaluations: [
        {
          platform: 'linkedin',
          verdict: 'revise',
          scores: {
            voiceMatch: 3,
            principleCompliance: 3,
            audienceFit: 3,
            platformFit: 3,
            specificity: 2,
            factualSafety: 1, // fails safety threshold
          },
          issues: [
            {
              exactPhrase: '$10M in revenue',
              problem: 'Invented statistic not found in brief',
              suggestedFix: 'Replace with [YOUR REVENUE] placeholder',
            },
          ],
          statusText: 'Failed factual safety check',
        },
      ],
    });

    // Revised Writer draft
    mockWriter.mockResolvedValueOnce({
      posts: [
        {
          platform: 'linkedin',
          language: 'en',
          text: 'We reached [YOUR REVENUE] in revenue through customer trust.',
          hashtags: ['#Success'],
        },
      ],
    });

    // Art Director output
    mockArt.mockResolvedValueOnce({
      visuals: [
        {
          platform: 'linkedin',
          prompt: 'Editorial portrait of a founder looking out an office window.',
          aspectRatio: '16:9',
          altText: 'Professional founder in a modern office.',
        },
      ],
    });

    const emittedEvents: AgentEngineEvent[] = [];

    const result = await executeAgentPipeline({
      runId: 'revision-run-789',
      userId: 'test-user-456',
      topicBrief: 'Revenue milestone announcement',
      selectedPlatforms: ['linkedin'],
      onEvent: (e) => {
        emittedEvents.push(e);
      },
    });

    expect(result.status).toBe('completed');
    // Writer called twice: 1 initial draft + 1 bounded revision
    expect(mockWriter).toHaveBeenCalledTimes(2);

    // Verify handoff reason was emitted to user
    const handoffEvents = emittedEvents.filter((e) => e.event === 'agent.handoff');
    expect(handoffEvents.length).toBeGreaterThanOrEqual(1);
    expect(handoffEvents[0]).toMatchObject({
      fromAgent: 'critic',
      toAgent: 'writer',
    });

    // Final post must contain revised placeholder
    expect(result.posts[0]?.text).toContain('[YOUR REVENUE]');
  });
});
