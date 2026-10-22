import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentChip } from '@/components/agent/AgentChip';
import { ActivityTimeline } from '@/components/agent/ActivityTimeline';
import type { AgentStep } from '@/lib/agent-events';

describe('Agent Presence Components', () => {
  it('renders AgentChip with agent name and middle dot format', () => {
    render(
      <AgentChip agent="critic" action="checking voice and platform rules" />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Critic')).toBeInTheDocument();
    expect(
      screen.getByText('checking voice and platform rules'),
    ).toBeInTheDocument();
  });

  it('renders ActivityTimeline with multiple states accurately', () => {
    const steps: AgentStep[] = [
      {
        id: '1',
        agent: 'profiler',
        action: 'tone analysis',
        state: 'done',
        durationSeconds: 2.1,
      },
      {
        id: '2',
        agent: 'writer',
        action: 'generating drafts',
        state: 'working',
      },
      {
        id: '3',
        agent: 'critic',
        action: 'reviewing text',
        state: 'waiting',
      },
      {
        id: '4',
        agent: 'art',
        action: 'image prompt',
        state: 'failed',
        failureReason: 'Rate limit',
      },
    ];

    render(<ActivityTimeline steps={steps} />);

    expect(screen.getByText('2.1 s')).toBeInTheDocument();
    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText(/Failed: Rate limit/i)).toBeInTheDocument();
  });
});
