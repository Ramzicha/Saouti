import { RetryCallbackInfo } from './retry';

export interface AgentPausedEvent {
  type: 'agent:paused';
  agent: string;
  reason: 'QUOTA_EXHAUSTED' | 'RATE_LIMITED' | string;
  retryInSeconds: number;
  attempt: number;
  maxAttempts: number;
  timestamp: string;
}

export interface AgentResumedEvent {
  type: 'agent:resumed';
  agent: string;
  timestamp: string;
}

export type AiAgentEvent = AgentPausedEvent | AgentResumedEvent;

/**
 * Creates an event handler that bridges retry callbacks to SSE agent presence events.
 */
export function createRetryEventHandler(
  agentName: string,
  emitEvent: (event: AiAgentEvent) => void,
): (info: RetryCallbackInfo) => void {
  return (info: RetryCallbackInfo) => {
    emitEvent({
      type: 'agent:paused',
      agent: agentName,
      reason: 'QUOTA_EXHAUSTED',
      retryInSeconds: info.retryInSeconds,
      attempt: info.attempt,
      maxAttempts: info.maxRetries,
      timestamp: new Date().toISOString(),
    });
  };
}
