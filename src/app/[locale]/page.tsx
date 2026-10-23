'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Composer } from '@/components/layout/Composer';
import { ActivityTimeline } from '@/components/agent/ActivityTimeline';
import { PostCard } from '@/components/ui/Card';
import { useRunEvents } from '@/hooks/useRunEvents';
import {
  IconKey,
  IconChevronRight,
  IconUser,
  IconAlertTriangle,
  IconCheck,
  IconSparkles,
} from '@tabler/icons-react';
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

            {/* Active Live Agent Activity Timeline (Only displayed during a generation run) */}
            {activeRunId && events.length > 0 && (
              <section
                aria-labelledby="timeline-heading"
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3
                    id="timeline-heading"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {tEngine('activityTitle')}
                  </h3>
                  {activeAgent && (
                    <span className="text-xs font-medium text-primary animate-pulse">
                      {statusText}
                    </span>
                  )}
                </div>

                <ActivityTimeline events={events} />
              </section>
            )}

            {/* Focus on Setup: Gemini Key & Voice Profile Cards (When idle) */}
            {!activeRunId && (hasKey === false || hasProfile === false) && (
              <section aria-label="Setup Steps" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Card 1: Gemini API Key */}
                <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconKey size={20} />
                      </div>
                      {hasKey ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <IconCheck size={12} />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Action Required
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">1. Gemini API Key</h3>
                      <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                        Saouti is 100% BYOK. Add your free or paid Google Gemini key to enable autonomous writing, critique, and Imagen 3 generation.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link
                      href={`/${locale}/settings/keys`}
                      className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                    >
                      <span>{hasKey ? 'Manage Gemini Key' : 'Add Gemini API Key'}</span>
                      <IconChevronRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Card 2: Voice Profile */}
                <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconUser size={20} />
                      </div>
                      {hasProfile ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <IconCheck size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Action Required
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">2. Voice Profile</h3>
                      <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                        Define your target audience, core principles, vocabulary, and authentic voice samples so your posts truly sound like you.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link
                      href={hasProfile ? `/${locale}/settings/profile` : `/${locale}/onboarding`}
                      className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 text-xs font-semibold transition-all"
                    >
                      <span>{hasProfile ? 'View Voice Profile' : 'Complete Onboarding'}</span>
                      <IconChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Ready State (When both Key and Profile are completed and idle) */}
            {!activeRunId && hasKey === true && hasProfile === true && generatedPosts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <IconSparkles size={20} />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Your Agent Engine is Ready</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Type any topic, angle, or rough thoughts into the composer below. Your Profiler, Strategist, Writer, Critic, and Art Director will draft tailored posts.
                </p>
              </div>
            )}

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
