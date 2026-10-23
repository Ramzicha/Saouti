/**
 * Event Contract: Saouti Agent Engine Real-Time Stream Events
 * 
 * Defines the wire contract for Server-Sent Events (SSE) and Redis Streams.
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
  action: string; // e.g. "drafting platform versions"
  stepId: string;
}

export interface AgentProgressEvent extends BaseRunEvent {
  event: 'agent.progress';
  agent: 'writer' | 'critic' | 'art';
  message: string; // concise status string (< 12 words)
}

export interface AgentHandoffEvent extends BaseRunEvent {
  event: 'agent.handoff';
  fromAgent: 'writer' | 'critic' | 'art';
  toAgent: 'writer' | 'critic' | 'art';
  reason: string; // e.g. "Critic requested revisions on 2 issues"
  issues?: Array<{
    platform: string;
    exactPhrase: string;
    problem: string;
    suggestedFix: string;
  }>;
}

export interface AgentCompletedEvent extends BaseRunEvent {
  event: 'agent.completed';
  agent: 'writer' | 'critic' | 'art';
  durationSeconds: number;
  statusText?: string;
}

export interface AgentErrorEvent extends BaseRunEvent {
  event: 'agent.error';
  agent?: 'writer' | 'critic' | 'art';
  errorCode: string;
  message: string;
  isRateLimit?: boolean;
  retryCountdownSeconds?: number;
}

export interface RunCompletedEvent extends BaseRunEvent {
  event: 'run.completed';
  totalDurationSeconds: number;
  postCount: number;
}

export interface RunCancelledEvent extends BaseRunEvent {
  event: 'run.cancelled';
  reason?: string;
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
