'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Composer } from '@/components/layout/Composer';
import { ActivityTimeline } from '@/components/agent/ActivityTimeline';
import { PostCard } from '@/components/ui/Card';
import { MOCK_TIMELINE_STEPS } from '@/lib/agent-events';
import { useRunEvents } from '@/hooks/useRunEvents';
import { IconKey, IconChevronRight, IconUser, IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import type { GeneratedPost } from '@/../specs/006-agent-engine/contracts/agent-engine.contract';

const ACTIVE_RUN_STORAGE_KEY = 'saouti_active_run_id';

export default function WorkspacePage() {
  const t = useTranslations('App');
  const tKeys = useTranslations('Keys');
  const tEngine = useTranslations('AgentEngine');
  const locale = useLocale();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    events,
    activeAgent,
    statusText,
    isCompleted,
    isCancelled,
  } = useRunEvents(activeRunId);

  // Check key and profile status on mount
  useEffect(() => {
    fetch('/api/settings/keys')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHasKey(Boolean(data.hasKey));
      })
      .catch(() => setHasKey(false));

    fetch('/api/profile/draft')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setHasProfile(data.profile?.status === 'active');
        }
      })
      .catch(() => setHasProfile(false));

    // Rehydrate active run from localStorage on page refresh / reload
    const storedRunId = localStorage.getItem(ACTIVE_RUN_STORAGE_KEY);
    if (storedRunId) {
      fetch(`/api/runs/${storedRunId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (['pending', 'running'].includes(data.status)) {
              setActiveRunId(storedRunId);
            } else {
              if (data.posts && data.posts.length > 0) {
                setGeneratedPosts(data.posts);
              }
              localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
        });
    }
  }, []);

  // Fetch final generated posts when run completes
  useEffect(() => {
    if (isCompleted && activeRunId) {
      fetch(`/api/runs/${activeRunId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.posts) {
            setGeneratedPosts(data.posts);
          }
          localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
        })
        .catch(() => {
          localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
        });
    }
  }, [isCompleted, activeRunId]);

  const handleSendRun = async (
    topicBrief: string,
    selectedPlatforms: string[] | string,
    skipCritic = false,
  ) => {
    setIsSubmitting(true);
    setRunError(null);
    setGeneratedPosts([]);

    const platformsArray = Array.isArray(selectedPlatforms)
      ? selectedPlatforms
      : [selectedPlatforms];

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicBrief,
          selectedPlatforms: platformsArray,
          skipCritic,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to start generation run');
      }

      const data = await res.json();
      setActiveRunId(data.runId);
      localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, data.runId);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Unknown generation error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRun = useCallback(async () => {
    if (!activeRunId) return;
    try {
      await fetch(`/api/runs/${activeRunId}/cancel`, { method: 'POST' });
      localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
    } catch {
      // Ignore network errors on cancel
    }
  }, [activeRunId]);

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

            {/* Profile Gatekeeper Banner */}
            {hasProfile === false && (
              <div
                role="alert"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <IconUser className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <span className="font-medium">
                    Complete your Voice Profile to unlock personalized post generation.
                  </span>
                </div>
                <Link
                  href={`/${locale}/onboarding`}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-primary bg-primary/15 hover:bg-primary/25 px-3 py-1.5 rounded-lg transition-colors w-fit"
                >
                  <span>Start Onboarding</span>
                  <IconChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Error Notification */}
            {runError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
              >
                <IconAlertTriangle className="w-5 h-5 shrink-0" />
                <span>{runError}</span>
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
                Collaborate with autonomous agents who draft, critique, and direct your posts with zero invented facts.
              </p>
            </div>

            {/* Live Agent Activity Timeline */}
            <section
              aria-labelledby="timeline-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3
                  id="timeline-heading"
                  className="text-xs font-medium uppercase tracking-wider text-muted"
                >
                  {tEngine('activityTitle')}
                </h3>
                {activeAgent && (
                  <span className="text-xs font-medium text-accent">
                    {statusText}
                  </span>
                )}
              </div>

              {activeRunId && events.length > 0 ? (
                <ActivityTimeline events={events} />
              ) : (
                <ActivityTimeline steps={MOCK_TIMELINE_STEPS} />
              )}
            </section>

            {/* Generated Posts Section */}
            {generatedPosts.length > 0 && (
              <section
                aria-labelledby="output-heading"
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h3
                    id="output-heading"
                    className="text-xs font-medium uppercase tracking-wider text-muted"
                  >
                    {tEngine('postsGenerated', { count: generatedPosts.length })}
                  </h3>
                </div>

                {/* Safety placeholders notice */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <IconAlertTriangle size={16} className="text-accent shrink-0" />
                  <span>{tEngine('placeholdersNotice')}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {generatedPosts.map((post, idx) => (
                    <PostCard
                      key={`${post.platform}-${idx}`}
                      platform={post.platform}
                      status="ready"
                      content={post.text}
                      imagePrompt={post.imagePrompt}
                      onCopy={() => {
                        navigator.clipboard.writeText(post.text);
                      }}
                      onEdit={() => {}}
                      onRegenerate={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Bottom Pinned Composer */}
        <footer className="w-full flex-shrink-0">
          <Composer
            disabled={hasKey === false || hasProfile === false || isSubmitting}
            isGenerating={Boolean(activeRunId && !isCompleted && !isCancelled)}
            onSend={handleSendRun}
            onCancel={handleCancelRun}
            disabledMessage={
              hasKey === false
                ? tKeys('noKeyBanner')
                : hasProfile === false
                  ? 'Complete your Voice Profile onboarding to generate posts.'
                  : undefined
            }
          />
        </footer>
      </div>
    </div>
  );
}
