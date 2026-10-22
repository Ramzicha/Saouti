import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AGENTS, type AgentId } from '@/lib/agent-events';

export interface AgentChipProps {
  agent: AgentId;
  action: string;
  isWorking?: boolean;
  className?: string;
}

export function AgentChip({
  agent,
  action,
  isWorking = false,
  className,
}: AgentChipProps) {
  const agentInfo = AGENTS[agent] || AGENTS.writer;

  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(
        clsx(
          'inline-flex select-none items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[13px] leading-tight text-text',
          isWorking && 'border-accent',
          className,
        ),
      )}
    >
      <span
        className={twMerge(
          clsx(
            'h-2 w-2 flex-shrink-0 rounded-full',
            isWorking && 'animate-agent-pulse',
          ),
        )}
        style={{ backgroundColor: agentInfo.colorToken }}
        aria-hidden="true"
      />
      <span className="font-medium text-text">{agentInfo.name}</span>
      <span className="text-muted" aria-hidden="true">
        ·
      </span>
      <span className="text-muted">{action}</span>
    </div>
  );
}
