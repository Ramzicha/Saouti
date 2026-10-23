import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AGENTS, type AgentStep } from '@/lib/agent-events';
import { convertEventsToTimelineSteps, type AgentEngineEvent } from '@/lib/agent-engine/events';

export interface ActivityTimelineProps {
  steps?: AgentStep[];
  events?: AgentEngineEvent[];
  skipCritic?: boolean;
  className?: string;
}

export function ActivityTimeline({ steps, events, skipCritic = false, className }: ActivityTimelineProps) {
  const displaySteps = steps || (events ? convertEventsToTimelineSteps(events, skipCritic) : []);

  return (
    <div
      role="region"
      aria-label="Agent activity timeline"
      className={twMerge('flex w-full flex-col gap-2', className)}
    >
      {displaySteps.map((step) => {
        const agent = AGENTS[step.agent] || AGENTS.writer;
        const isDone = step.state === 'done';
        const isWorking = step.state === 'working';
        const isWaiting = step.state === 'waiting';
        const isPaused = step.state === 'paused';
        const isFailed = step.state === 'failed';

        return (
          <div
            key={step.id}
            className={twMerge(
              clsx(
                'flex items-center justify-between rounded-row border p-3 text-sm transition-colors',
                'bg-surface',
                isWorking && 'border-accent shadow-sm',
                isFailed && 'border-danger bg-surface',
                !isWorking && !isFailed && 'border-border',
              ),
            )}
          >
            {/* Left: Dot, Agent name, Status text */}
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Dot */}
              <div className="flex h-3 w-3 flex-shrink-0 items-center justify-center">
                {isWaiting ? (
                  <span
                    className="h-2.5 w-2.5 rounded-full border-2"
                    style={{ borderColor: agent.colorToken }}
                    aria-hidden="true"
                  />
                ) : isFailed ? (
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-danger"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className={twMerge(
                      clsx(
                        'h-2.5 w-2.5 rounded-full',
                        isWorking && 'animate-agent-pulse',
                      ),
                    )}
                    style={{ backgroundColor: agent.colorToken }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Agent Name: min-w 104px per Design System §6 */}
              <span className="min-w-[104px] flex-shrink-0 font-medium text-text">
                {step.sourceAgent
                  ? `${AGENTS[step.sourceAgent]?.name || step.sourceAgent} to ${agent.name}`
                  : agent.name}
              </span>

              {/* Status Copy in muted */}
              <span className="truncate text-xs text-muted md:text-sm">
                {step.action}
              </span>
            </div>

            {/* Right: State / Duration indicator */}
            <div className="ms-4 flex-shrink-0 text-xs font-medium">
              {isDone && (
                <span className="text-muted">
                  {step.durationSeconds !== undefined
                    ? `${step.durationSeconds} s`
                    : 'Done'}
                </span>
              )}
              {isWorking && (
                <span className="font-semibold text-accent">Working</span>
              )}
              {isWaiting && <span className="text-muted">Next</span>}
              {isPaused && (
                <span className="text-muted">
                  Paused, retrying in {step.pauseCountdownSeconds || 20} s
                </span>
              )}
              {isFailed && (
                <span className="font-semibold text-danger">
                  Failed{step.failureReason ? `: ${step.failureReason}` : ''}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
