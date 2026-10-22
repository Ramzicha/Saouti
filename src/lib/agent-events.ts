export type AgentId = 'writer' | 'critic' | 'art' | 'profiler' | 'strategist';

export type AgentStepState =
  'done' | 'working' | 'waiting' | 'paused' | 'failed';

export interface AgentInfo {
  id: AgentId;
  name: string;
  colorToken: string;
}

export const AGENTS: Record<AgentId, AgentInfo> = {
  writer: {
    id: 'writer',
    name: 'Writer',
    colorToken: 'var(--agent-writer)',
  },
  critic: {
    id: 'critic',
    name: 'Critic',
    colorToken: 'var(--agent-critic)',
  },
  art: {
    id: 'art',
    name: 'Art Director',
    colorToken: 'var(--agent-art)',
  },
  profiler: {
    id: 'profiler',
    name: 'Profiler',
    colorToken: 'var(--agent-profiler)',
  },
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    colorToken: 'var(--agent-strategist)',
  },
};

export interface AgentStep {
  id: string;
  agent: AgentId;
  action: string;
  state: AgentStepState;
  durationSeconds?: number;
  pauseCountdownSeconds?: number;
  failureReason?: string;
  sourceAgent?: AgentId;
}

export const MOCK_TIMELINE_STEPS: AgentStep[] = [
  {
    id: 'step-1',
    agent: 'profiler',
    action: 'analyzed tone of voice and target persona',
    state: 'done',
    durationSeconds: 1.8,
  },
  {
    id: 'step-2',
    agent: 'strategist',
    action: 'selected angle and engagement hooks for LinkedIn',
    state: 'done',
    durationSeconds: 3.4,
  },
  {
    id: 'step-3',
    agent: 'writer',
    action: 'drafting the LinkedIn version',
    state: 'working',
  },
  {
    id: 'step-4',
    agent: 'critic',
    action: 'checking voice fidelity and platform character limits',
    state: 'waiting',
  },
  {
    id: 'step-5',
    agent: 'art',
    action: 'generating image concept prompt',
    state: 'waiting',
  },
];
