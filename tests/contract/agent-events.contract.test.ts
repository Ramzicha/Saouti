import { describe, it, expect } from 'vitest';
import {
  getRunStreamKey,
  getRunCancelKey,
  RUN_EVENTS_TTL_SECONDS,
} from '@/lib/agent-engine/event-stream';
import type {
  AgentEngineEvent,
  RunStartedEvent,
  AgentStartedEvent,
  AgentHandoffEvent,
  AgentErrorEvent,
  RunCompletedEvent,
} from '@/lib/agent-engine/events';

describe('Agent Engine Events Contract (agent-events.contract.test.ts)', () => {
  const runId = 'test-run-uuid-1234';

  it('generates compliant stream and cancellation redis keys', () => {
    expect(getRunStreamKey(runId)).toBe(`saouti:run:${runId}:events`);
    expect(getRunCancelKey(runId)).toBe(`saouti:run:${runId}:cancel`);
    expect(RUN_EVENTS_TTL_SECONDS).toBe(86400); // 24 hours retention
  });

  it('validates RunStartedEvent structure and serialization', () => {
    const event: RunStartedEvent = {
      event: 'run.started',
      runId,
      timestamp: new Date().toISOString(),
      selectedPlatforms: ['linkedin', 'x'],
      skipCritic: false,
    };

    const serialized = JSON.stringify(event);
    const parsed = JSON.parse(serialized) as AgentEngineEvent;

    expect(parsed.event).toBe('run.started');
    expect(parsed.runId).toBe(runId);
  });

  it('validates AgentStartedEvent structure with step ID', () => {
    const event: AgentStartedEvent = {
      event: 'agent.started',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'writer',
      action: 'Drafting initial platform posts',
      stepId: 'step-abc-123',
    };

    const serialized = JSON.stringify(event);
    const parsed = JSON.parse(serialized) as AgentStartedEvent;

    expect(parsed.agent).toBe('writer');
    expect(parsed.stepId).toBe('step-abc-123');
  });

  it('validates AgentHandoffEvent with revision feedback', () => {
    const event: AgentHandoffEvent = {
      event: 'agent.handoff',
      runId,
      timestamp: new Date().toISOString(),
      fromAgent: 'critic',
      toAgent: 'writer',
      reason: 'Requested 1 revision on factual safety',
      issues: [
        {
          platform: 'linkedin',
          exactPhrase: '100% guarantee',
          problem: 'Absolute claim without evidence',
          suggestedFix: 'Replace with bracketed placeholder',
        },
      ],
    };

    const parsed = JSON.parse(JSON.stringify(event)) as AgentHandoffEvent;
    expect(parsed.fromAgent).toBe('critic');
    expect(parsed.toAgent).toBe('writer');
    expect(parsed.issues?.[0]?.exactPhrase).toBe('100% guarantee');
  });

  it('validates AgentErrorEvent with quota countdown info', () => {
    const event: AgentErrorEvent = {
      event: 'agent.error',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'writer',
      errorCode: 'QUOTA_EXHAUSTED',
      message: 'Rate limit exceeded on provider',
      isRateLimit: true,
      retryCountdownSeconds: 30,
    };

    const parsed = JSON.parse(JSON.stringify(event)) as AgentErrorEvent;
    expect(parsed.isRateLimit).toBe(true);
    expect(parsed.retryCountdownSeconds).toBe(30);
  });

  it('validates RunCompletedEvent with duration and post count', () => {
    const event: RunCompletedEvent = {
      event: 'run.completed',
      runId,
      timestamp: new Date().toISOString(),
      totalDurationSeconds: 14,
      postCount: 3,
    };

    const parsed = JSON.parse(JSON.stringify(event)) as RunCompletedEvent;
    expect(parsed.totalDurationSeconds).toBe(14);
    expect(parsed.postCount).toBe(3);
  });
});
