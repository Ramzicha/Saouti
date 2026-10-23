import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AGENTS, type AgentId } from '@/lib/agent-events';

export interface AgentChipProps {
  agent: AgentId;
  action: string;
  isWorking?: boolean;
  isPaused?: boolean;
  pauseCountdownSeconds?: number;
  className?: string;
}

export function AgentChip({
  agent,
  action,
  isWorking = false,
  isPaused = false,
  pauseCountdownSeconds,
  className,
}: AgentChipProps) {
  const agentInfo = AGENTS[agent] || AGENTS.writer;

  // Format one-line status
  const displayStatus = isPaused
    ? `Paused, retrying in ${pauseCountdownSeconds ?? 30}s`
    : action;

  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(
        clsx(
          'inline-flex select-none items-center gap-2 rounded-full border px-3 py-1 text-[13px] leading-tight transition-colors',
          isPaused
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : isWorking
              ? 'border-accent bg-surface text-text shadow-sm'
              : 'border-border bg-surface text-text',
          className,
        ),
      )}
    >
      <span
        className={twMerge(
          clsx(
            'h-2 w-2 flex-shrink-0 rounded-full',
            isWorking && !isPaused && 'animate-agent-pulse',
            isPaused && 'bg-amber-500',
          ),
        )}
        style={{ backgroundColor: isPaused ? undefined : agentInfo.colorToken }}
        aria-hidden="true"
      />
      <span className="font-medium">{agentInfo.name}</span>
      <span className="text-muted" aria-hidden="true">
        ·
      </span>
      <span className="max-w-[240px] truncate text-muted">{displayStatus}</span>
    </div>
  );
}
