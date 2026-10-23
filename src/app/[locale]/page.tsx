'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Composer } from '@/components/layout/Composer';
import { ActivityTimeline } from '@/components/agent/ActivityTimeline';
import { PostCard } from '@/components/ui/Card';
import { MOCK_TIMELINE_STEPS } from '@/lib/agent-events';
import { IconKey, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

export default function WorkspacePage() {
  const t = useTranslations('App');
  const tKeys = useTranslations('Keys');
  const locale = useLocale();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/settings/keys')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHasKey(Boolean(data.hasKey));
      })
      .catch(() => setHasKey(false));
  }, []);

  const samplePost = {
    platform: 'LinkedIn',
    status: 'ready' as const,
    content:
      'Most AI writing tools feel like black boxes — you put text in, and hope for the best.\n\nAt Saouti, we believe visible AI agents change everything. You can watch the Profiler align tone, the Strategist test hooks, and the Critic verify voice before a single line is published.\n\nTransparency builds trust.',
    imagePrompt:
      'Minimal editorial illustration of five distinct geometric nodes connected by glowing lines on a deep slate surface.',
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
      {/* Sidebar: Desktop fixed & mobile drawer */}
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Container */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <AppHeader
          title={t('title')}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        {/* Central Workspace Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-workspace flex-col gap-6 pb-12">
            {/* Key Gatekeeper Banner */}
            {hasKey === false && (
              <div
                role="alert"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <IconKey className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <span className="font-medium">{tKeys('noKeyBanner')}</span>
                </div>
                <Link
                  href={`/${locale}/settings/keys`}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-primary bg-primary/15 hover:bg-primary/25 px-3 py-1.5 rounded-lg transition-colors w-fit"
                >
                  <span>{tKeys('addKey')}</span>
                  <IconChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Headline with single Instrument Serif Italic accent word */}
            <div className="pt-2 text-center sm:text-start">
              <h2 className="text-2xl font-medium tracking-tight text-text sm:text-3xl">
                Craft posts in your{' '}
                <span className="font-serif text-[1.14em] italic text-accent">
                  distinct
                </span>{' '}
                voice.
              </h2>
              <p className="pt-1 text-sm text-muted">
                Collaborate with autonomous agents who research, draft,
                critique, and direct your posts.
              </p>
            </div>

            {/* Agent Timeline preview */}
            <section
              aria-labelledby="timeline-heading"
              className="flex flex-col gap-3"
            >
              <h3
                id="timeline-heading"
                className="text-xs font-medium uppercase tracking-wider text-muted"
              >
                Agent Activity
              </h3>
              <ActivityTimeline steps={MOCK_TIMELINE_STEPS} />
            </section>

            {/* Generated Post Card Preview */}
            <section
              aria-labelledby="output-heading"
              className="flex flex-col gap-3"
            >
              <h3
                id="output-heading"
                className="text-xs font-medium uppercase tracking-wider text-muted"
              >
                Draft Output
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PostCard
                  platform={samplePost.platform}
                  status={samplePost.status}
                  content={samplePost.content}
                  imagePrompt={samplePost.imagePrompt}
                  onCopy={() => {}}
                  onEdit={() => {}}
                  onRegenerate={() => {}}
                />
              </div>
            </section>
          </div>
        </main>

        {/* Bottom Pinned Composer */}
        <footer className="w-full flex-shrink-0">
          <Composer
            disabled={hasKey === false}
            disabledMessage={hasKey === false ? tKeys('noKeyBanner') : undefined}
          />
        </footer>
      </div>
    </div>
  );
}
