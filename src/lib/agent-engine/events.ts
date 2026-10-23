/**
 * Wire & Internal Event Definitions for Agent Engine
 */

export type AgentEngineEventName =
  | 'run.started'
  | 'agent.started'
  | 'agent.progress'
  | 'agent.handoff'
  | 'agent.completed'
  | 'agent.error'
  | 'run.completed'
  | 'run.cancelled';

export interface BaseRunEvent {
  runId: string;
  timestamp: string;
}

export interface RunStartedEvent extends BaseRunEvent {
  event: 'run.started';
  selectedPlatforms: string[];
  skipCritic: boolean;
}

export interface AgentStartedEvent extends BaseRunEvent {
  event: 'agent.started';
  agent: 'writer' | 'critic' | 'art';
  action: string;
  stepId: string;
}

export interface AgentProgressEvent extends BaseRunEvent {
  event: 'agent.progress';
  agent: 'writer' | 'critic' | 'art';
  message: string;
}

export interface AgentHandoffEvent extends BaseRunEvent {
  event: 'agent.handoff';
  fromAgent: 'writer' | 'critic' | 'art';
  toAgent: 'writer' | 'critic' | 'art';
  reason: string;
  issues?: Array<{
    platform: string;
    exactPhrase: string;
    problem: string;
    suggestedFix: string;
  }> | undefined;
}

export interface AgentCompletedEvent extends BaseRunEvent {
  event: 'agent.completed';
  agent: 'writer' | 'critic' | 'art';
  durationSeconds: number;
  statusText?: string | undefined;
}

export interface AgentErrorEvent extends BaseRunEvent {
  event: 'agent.error';
  agent?: ('writer' | 'critic' | 'art') | undefined;
  errorCode: string;
  message: string;
  isRateLimit?: boolean | undefined;
  retryCountdownSeconds?: number | undefined;
}

export interface RunCompletedEvent extends BaseRunEvent {
  event: 'run.completed';
  totalDurationSeconds: number;
  postCount: number;
}

export interface RunCancelledEvent extends BaseRunEvent {
  event: 'run.cancelled';
  reason?: string | undefined;
}

export type AgentEngineEvent =
  | RunStartedEvent
  | AgentStartedEvent
  | AgentProgressEvent
  | AgentHandoffEvent
  | AgentCompletedEvent
  | AgentErrorEvent
  | RunCompletedEvent
  | RunCancelledEvent;

import type { AgentStep } from '@/lib/agent-events';

/**
 * Transforms an incoming stream of events into reactive timeline steps for ActivityTimeline.
 */
export function convertEventsToTimelineSteps(
  events: AgentEngineEvent[],
  skipCritic = false,
): AgentStep[] {
  const steps: AgentStep[] = [
    {
      id: 'step-writer-initial',
      agent: 'writer',
      action: 'Drafting platform versions',
      state: 'waiting',
    },
  ];

  if (!skipCritic) {
    steps.push({
      id: 'step-critic',
      agent: 'critic',
      action: 'Evaluating voice fidelity and factual safety',
      state: 'waiting',
    });
  }

  steps.push({
    id: 'step-art',
    agent: 'art',
    action: 'Designing visual concepts and alt text',
    state: 'waiting',
  });

  for (const event of events) {
    switch (event.event) {
      case 'run.started':
        // Writer starts waiting or immediately moves to working on agent.started
        break;

      case 'agent.started': {
        const step = steps.find((s) => s.agent === event.agent && s.state !== 'done');
        if (step) {
          step.state = 'working';
          step.action = event.action;
        } else if (event.stepId?.includes('revision')) {
          // If a revision step was spawned
          steps.splice(2, 0, {
            id: 'step-writer-revision',
            agent: 'writer',
            action: event.action,
            state: 'working',
          });
        }
        break;
      }

      case 'agent.progress': {
        const step = steps.find((s) => s.agent === event.agent && s.state === 'working');
        if (step) {
          step.action = event.message;
        }
        break;
      }

      case 'agent.handoff': {
        if (event.fromAgent === 'critic' && event.toAgent === 'writer') {
          // Revision required
          const existingRevision = steps.find((s) => s.id === 'step-writer-revision');
          if (!existingRevision) {
            steps.splice(2, 0, {
              id: 'step-writer-revision',
              agent: 'writer',
              action: event.reason,
              state: 'waiting',
              sourceAgent: 'critic',
            });
          }
        }
        break;
      }

      case 'agent.completed': {
        const step = steps.find((s) => s.agent === event.agent && s.state === 'working');
        if (step) {
          step.state = 'done';
          step.durationSeconds = event.durationSeconds;
          if (event.statusText) {
            step.action = event.statusText;
          }
        }
        break;
      }

      case 'agent.error': {
        const step = steps.find((s) => s.state === 'working') || steps[0];
        if (step) {
          if (event.isRateLimit) {
            step.state = 'paused';
            step.pauseCountdownSeconds = event.retryCountdownSeconds ?? 30;
          } else {
            step.state = 'failed';
            step.failureReason = event.message;
          }
        }
        break;
      }

      case 'run.cancelled': {
        const currentWorking = steps.find((s) => s.state === 'working');
        if (currentWorking) {
          currentWorking.state = 'failed';
          currentWorking.failureReason = 'Cancelled by user';
        }
        break;
      }
    }
  }

  return steps;
}
