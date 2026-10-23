'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentEngineEvent } from '@/lib/agent-engine/events';

export interface UseRunEventsReturn {
  events: AgentEngineEvent[];
  activeAgent: 'writer' | 'critic' | 'art' | null;
  statusText: string;
  isCompleted: boolean;
  isCancelled: boolean;
  isRateLimited: boolean;
  retryCountdownSeconds: number | null;
  handoffReason: string | null;
  isConnected: boolean;
  disconnect: () => void;
}

export function useRunEvents(runId?: string | null): UseRunEventsReturn {
  const [events, setEvents] = useState<AgentEngineEvent[]>([]);
  const [activeAgent, setActiveAgent] = useState<'writer' | 'critic' | 'art' | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [retryCountdownSeconds, setRetryCountdownSeconds] = useState<number | null>(null);
  const [handoffReason, setHandoffReason] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!runId) {
      disconnect();
      return;
    }

    const eventSource = new EventSource(`/api/runs/${runId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    const handleIncomingEvent = (e: MessageEvent) => {
      try {
        const parsed: AgentEngineEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, parsed]);

        switch (parsed.event) {
          case 'run.started':
            setStatusText('Pipeline running');
            break;

          case 'agent.started':
            setActiveAgent(parsed.agent);
            setStatusText(parsed.action);
            setIsRateLimited(false);
            setRetryCountdownSeconds(null);
            break;

          case 'agent.progress':
            setStatusText(parsed.message);
            break;

          case 'agent.handoff':
            setHandoffReason(parsed.reason);
            setStatusText(parsed.reason);
            break;

          case 'agent.completed':
            if (parsed.statusText) {
              setStatusText(parsed.statusText);
            }
            break;

          case 'agent.error':
            if (parsed.isRateLimit && parsed.retryCountdownSeconds) {
              setIsRateLimited(true);
              setRetryCountdownSeconds(parsed.retryCountdownSeconds);

              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }

              countdownIntervalRef.current = setInterval(() => {
                setRetryCountdownSeconds((prev) => {
                  if (prev === null || prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
            break;

          case 'run.completed':
            setIsCompleted(true);
            setActiveAgent(null);
            setStatusText('Generation complete');
            disconnect();
            break;

          case 'run.cancelled':
            setIsCancelled(true);
            setActiveAgent(null);
            setStatusText('Run cancelled');
            disconnect();
            break;
        }
      } catch {
        // Ignore unparseable frames
      }
    };

    // Attach listeners for every event name
    const eventNames = [
      'run.started',
      'agent.started',
      'agent.progress',
      'agent.handoff',
      'agent.completed',
      'agent.error',
      'run.completed',
      'run.cancelled',
    ];

    for (const name of eventNames) {
      eventSource.addEventListener(name, handleIncomingEvent);
    }

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      disconnect();
    };
  }, [runId, disconnect]);

  return {
    events,
    activeAgent,
    statusText,
    isCompleted,
    isCancelled,
    isRateLimited,
    retryCountdownSeconds,
    handoffReason,
    isConnected,
    disconnect,
  };
}
