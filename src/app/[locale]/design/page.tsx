'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card, PostCard } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { AgentChip } from '@/components/agent/AgentChip';
import { ActivityTimeline } from '@/components/agent/ActivityTimeline';
import { Composer } from '@/components/layout/Composer';
import { MOCK_TIMELINE_STEPS } from '@/lib/agent-events';
import { IconPlus, IconArrowUp, IconHeart } from '@tabler/icons-react';

export default function DesignGalleryPage() {
  const t = useTranslations('Design');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState('Option A');
  const [showToast, setShowToast] = useState(false);

  const colorTokens = [
    { name: '--bg', label: 'Background', varName: 'var(--bg)' },
    { name: '--surface', label: 'Surface', varName: 'var(--surface)' },
    {
      name: '--surface-raised',
      label: 'Raised',
      varName: 'var(--surface-raised)',
    },
    { name: '--border', label: 'Border', varName: 'var(--border)' },
    { name: '--text', label: 'Text', varName: 'var(--text)' },
    { name: '--muted', label: 'Muted', varName: 'var(--muted)' },
    { name: '--accent', label: 'Accent', varName: 'var(--accent)' },
    {
      name: '--accent-soft',
      label: 'Accent Soft',
      varName: 'var(--accent-soft)',
    },
    { name: '--button', label: 'Button Fill', varName: 'var(--button)' },
    { name: '--success', label: 'Success', varName: 'var(--success)' },
    { name: '--danger', label: 'Danger', varName: 'var(--danger)' },
    { name: '--agent-writer', label: 'Writer', varName: 'var(--agent-writer)' },
    { name: '--agent-critic', label: 'Critic', varName: 'var(--agent-critic)' },
    { name: '--agent-art', label: 'Art Director', varName: 'var(--agent-art)' },
    {
      name: '--agent-profiler',
      label: 'Profiler',
      varName: 'var(--agent-profiler)',
    },
    {
      name: '--agent-strategist',
      label: 'Strategist',
      varName: 'var(--agent-strategist)',
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
      {/* Sidebar for navigation */}
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <AppHeader
          title={t('title')}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-workspace flex-col gap-12 pb-16">
            {/* 1. Header with single Instrument Serif Italic accent word */}
            <div className="border-b border-border pb-4">
              <h2 className="text-3xl font-medium tracking-tight text-text">
                Saouti Design{' '}
                <span className="font-serif text-[1.14em] italic text-accent">
                  System
                </span>
              </h2>
              <p className="pt-1 text-sm text-muted">
                Living component showcase and visual regression fixture in
                light, dark, LTR, and RTL modes.
              </p>
            </div>

            {/* 2. Color Tokens Palette */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('tokens')}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
                {colorTokens.map((token) => (
                  <div
                    key={token.name}
                    className="flex flex-col items-center rounded-control border border-border bg-surface p-2 text-center"
                  >
                    <span
                      className="shadow-xs mb-2 h-8 w-8 rounded-full border border-border"
                      style={{ backgroundColor: token.varName }}
                    />
                    <span className="w-full truncate text-[11px] font-semibold text-text">
                      {token.label}
                    </span>
                    <span className="font-mono text-[9px] text-muted">
                      {token.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Typography Scale */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('typography')}
              </h3>
              <Card className="flex flex-col gap-4">
                <div>
                  <span className="block pb-1 text-xs text-muted">
                    Display (34/40 px, 500, with serif italic accent)
                  </span>
                  <p className="text-[34px] font-medium leading-[40px] tracking-tight text-text">
                    Autonomous voice{' '}
                    <span className="font-serif text-[1.14em] italic text-accent">
                      amplification
                    </span>
                    .
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="block pb-1 text-xs text-muted">
                    Heading (20/28 px, 600)
                  </span>
                  <p className="text-[20px] font-semibold leading-[28px] text-text">
                    Multi-agent drafting pipeline
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="block pb-1 text-xs text-muted">
                    Body (14/21 px, 400)
                  </span>
                  <p className="text-[14px] leading-[21px] text-text">
                    Saouti allows creators to draft social media posts in their
                    own voice, using a visible team of specialist agents.
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <span className="block pb-1 text-xs text-muted">
                    Arabic Typography (Noto Sans Arabic)
                  </span>
                  <p
                    dir="rtl"
                    className="font-arabic text-lg font-normal text-text"
                  >
                    صوتي يمنحك منصة ذكية لكتابة منشورات احترافية بصوتك{' '}
                    <span className="font-semibold text-accent">المتميز</span>.
                  </p>
                </div>
              </Card>
            </section>

            {/* 4. Buttons */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('buttons')}
              </h3>
              <Card className="flex flex-wrap items-center gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="primary" size="sm">
                  <IconPlus size={14} className="me-1.5" />
                  Small Primary
                </Button>
                <Button variant="secondary" size="sm">
                  <IconHeart size={14} className="me-1.5" />
                  Small Secondary
                </Button>
                <Button variant="icon" ariaLabel="Send post">
                  <IconArrowUp size={20} />
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </Card>
            </section>

            {/* 5. Chips & Tags */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('chips')}
              </h3>
              <Card className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Chip
                    selected={selectedChip === 'Option A'}
                    onClick={() => setSelectedChip('Option A')}
                  >
                    LinkedIn
                  </Chip>
                  <Chip
                    selected={selectedChip === 'Option B'}
                    onClick={() => setSelectedChip('Option B')}
                  >
                    Twitter / X
                  </Chip>
                  <Chip
                    selected={selectedChip === 'Option C'}
                    onClick={() => setSelectedChip('Option C')}
                  >
                    Threads
                  </Chip>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-2">
                  <Chip variant="tag" tagVariant="ready">
                    Ready
                  </Chip>
                  <Chip variant="tag" tagVariant="in_review">
                    In review
                  </Chip>
                </div>
              </Card>
            </section>

            {/* 6. Form Controls */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Form Controls & Toast
              </h3>
              <Card className="flex flex-col gap-4">
                <Input label="Title" placeholder="e.g. Scaling LLM Agents" />
                <Textarea
                  label="Raw Thoughts"
                  placeholder="Drop bullet points or transcripts..."
                  rows={3}
                />
                <div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowToast(true)}
                  >
                    Trigger Accessible Toast
                  </Button>
                </div>
              </Card>
            </section>

            {/* 7. Agent Presence & Timeline */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('agentPresence')}
              </h3>
              <Card className="flex flex-col gap-6">
                <div>
                  <span className="block pb-2 text-xs text-muted">
                    Active-Agent Status Chips:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <AgentChip
                      agent="writer"
                      action="drafting the LinkedIn version"
                      isWorking={true}
                    />
                    <AgentChip
                      agent="critic"
                      action="checking voice fidelity"
                      isWorking={false}
                    />
                    <AgentChip
                      agent="art"
                      action="generating prompt"
                      isWorking={false}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <span className="block pb-2 text-xs text-muted">
                    Timeline States (Done, Working, Waiting, Paused, Failed):
                  </span>
                  <ActivityTimeline
                    steps={[
                      ...MOCK_TIMELINE_STEPS,
                      {
                        id: 'step-paused',
                        agent: 'strategist',
                        action: 'rate limited on target analytics',
                        state: 'paused',
                        pauseCountdownSeconds: 15,
                      },
                      {
                        id: 'step-failed',
                        agent: 'critic',
                        action: 'voice mismatch detection failed',
                        state: 'failed',
                        failureReason: 'Context length exceeded',
                      },
                    ]}
                  />
                </div>
              </Card>
            </section>

            {/* 8. Composer Preview */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('composer')}
              </h3>
              <Card className="overflow-hidden bg-bg p-0">
                <Composer />
              </Card>
            </section>

            {/* 9. Post Card Preview */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                {t('cards')}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PostCard
                  platform="LinkedIn"
                  status="ready"
                  content="The secret to great social content isn't generating more text — it's generating text that sounds uniquely like you.\n\nSaouti gives you visible agents who guard your voice at every step."
                  imagePrompt="A luminous glass prism splitting complex light beams into five clean, distinct rays."
                  onCopy={() => setShowToast(true)}
                  onEdit={() => {}}
                  onRegenerate={() => {}}
                />
                <PostCard
                  platform="Twitter/X"
                  status="in_review"
                  content="Most AI writing tools feel like black boxes.\n\nVisible agents change everything. Transparency builds trust."
                  onCopy={() => setShowToast(true)}
                  onEdit={() => {}}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {showToast && (
        <Toast
          message="Post copied to clipboard!"
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
