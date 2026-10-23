'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  IconBolt,
  IconRobot,
  IconMessageCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { GeneratedPost } from '@/../specs/006-agent-engine/contracts/agent-engine.contract';

const ACTIVE_RUN_STORAGE_KEY = 'saouti_active_run_id';

export interface RunThreadItem {
  id: string;
  topicBrief: string;
  selectedPlatforms: string[];
  targetLanguage: string;
  arabicDialect?: string | undefined;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timed_out';
  skipCritic?: boolean | undefined;
  posts: GeneratedPost[];
  errorMessage?: string | undefined;
  createdAt: string;
}

export default function WorkspacePage() {
  const t = useTranslations('App');
  const tKeys = useTranslations('Keys');
  const tEngine = useTranslations('AgentEngine');
  const locale = useLocale();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const [runsList, setRunsList] = useState<RunThreadItem[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    events,
    activeAgent,
    statusText,
    isCompleted,
    isCancelled,
  } = useRunEvents(activeRunId);

  // Auto-scroll when messages or live events update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runsList.length, events.length, isCompleted]);

  // Check key and profile status on mount & load existing runs history
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

    // Load full runs history from database
    fetch('/api/runs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.runs) {
          setRunsList(data.runs);

          // Check if there is an active running job stored or in the fetched list
          const storedRunId = localStorage.getItem(ACTIVE_RUN_STORAGE_KEY);
          if (storedRunId) {
            const found = data.runs.find((r: RunThreadItem) => r.id === storedRunId);
            if (found && ['pending', 'running'].includes(found.status)) {
              setActiveRunId(storedRunId);
            } else {
              localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
            }
          } else {
            // Find if any run is currently pending or running
            const active = data.runs.find((r: RunThreadItem) =>
              ['pending', 'running'].includes(r.status),
            );
            if (active) {
              setActiveRunId(active.id);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update run in runsList when generation completes
  useEffect(() => {
    if (isCompleted && activeRunId) {
      const runIdToFetch = activeRunId;
      fetch(`/api/runs/${runIdToFetch}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setRunsList((prev) =>
              prev.map((r) =>
                r.id === runIdToFetch
                  ? {
                      ...r,
                      status: data.status,
                      posts: data.posts || [],
                      errorMessage: data.errorMessage,
                    }
                  : r,
              ),
            );
          }
          localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
          setActiveRunId(null);
        })
        .catch(() => {
          localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
          setActiveRunId(null);
        });
    }
  }, [isCompleted, activeRunId]);

  // Update run in runsList when cancelled
  useEffect(() => {
    if (isCancelled && activeRunId) {
      setRunsList((prev) =>
        prev.map((r) => (r.id === activeRunId ? { ...r, status: 'cancelled' } : r)),
      );
      localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
      setActiveRunId(null);
    }
  }, [isCancelled, activeRunId]);

  const handleSendRun = async (
    topicBrief: string,
    selectedPlatforms: string[] | string,
    skipCritic = false,
  ) => {
    setIsSubmitting(true);
    setRunError(null);

    const platformsArray = Array.isArray(selectedPlatforms)
      ? selectedPlatforms
      : [selectedPlatforms];

    const tempId = `temp-${Date.now()}`;
    const pendingItem: RunThreadItem = {
      id: tempId,
      topicBrief,
      selectedPlatforms: platformsArray,
      targetLanguage: locale,
      status: 'pending',
      skipCritic,
      posts: [],
      createdAt: new Date().toISOString(),
    };

    // Optimistically append new message/run to the continuous thread
    setRunsList((prev) => [...prev, pendingItem]);

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicBrief,
          selectedPlatforms: platformsArray,
          targetLanguage: locale,
          skipCritic,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to start generation run');
      }

      const data = await res.json();
      setRunsList((prev) =>
        prev.map((r) => (r.id === tempId ? { ...r, id: data.runId, status: 'running' } : r)),
      );
      setActiveRunId(data.runId);
      localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, data.runId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      setRunError(message);
      setRunsList((prev) =>
        prev.map((r) => (r.id === tempId ? { ...r, status: 'failed', errorMessage: message } : r)),
      );
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

  const handleCopy = (postId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(postId);
    setTimeout(() => setCopiedKey(null), 2500);
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
            {/* Error Notification Banner */}
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

            {/* Setup Cards (When key or profile is missing and thread is empty) */}
            {runsList.length === 0 && !activeRunId && (hasKey === false || hasProfile === false) && (
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

            {/* Ready State Empty Banner */}
            {runsList.length === 0 && !activeRunId && hasKey === true && hasProfile === true && (
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

            {/* Continuous Conversation & Run Thread */}
            {runsList.map((run, runIndex) => {
              const isRunActive = run.id === activeRunId;

              return (
                <div key={run.id} className="flex flex-col gap-4 border-b border-border/50 pb-8 last:border-b-0">
                  {/* User Message Bubble */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-4 py-3 shadow-xs">
                      <div className="flex items-center gap-2 pb-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                          Topic Brief
                        </span>
                        <div className="flex items-center gap-1">
                          {run.selectedPlatforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                        {run.skipCritic && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <IconBolt size={12} />
                            Fast Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {run.topicBrief}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <IconUser size={16} />
                    </div>
                  </div>

                  {/* Agent Response Block */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-card border border-border text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <IconRobot size={16} />
                    </div>

                    <div className="flex-1 space-y-4 min-w-0">
                      {/* Active Run: Live Activity Timeline */}
                      {isRunActive && (
                        <section
                          aria-labelledby={`timeline-heading-${run.id}`}
                          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <h3
                              id={`timeline-heading-${run.id}`}
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

                      {/* Completed Run: Generated Post Cards */}
                      {run.posts && run.posts.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted">
                              {tEngine('postsGenerated', { count: run.posts.length })}
                            </span>
                            <span className="text-[11px] text-muted">
                              {new Date(run.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {run.posts.map((post, postIdx) => {
                              const cardKey = `${run.id}-${post.platform}-${postIdx}`;
                              const isCopied = copiedKey === cardKey;

                              return (
                                <div key={cardKey} className="relative">
                                  <PostCard
                                    platform={post.platform}
                                    status="ready"
                                    content={post.text}
                                    imagePrompt={post.imagePrompt}
                                    onCopy={() => handleCopy(cardKey, post.text)}
                                    onEdit={() => {}}
                                    onRegenerate={() => {}}
                                  />
                                  {isCopied && (
                                    <div className="absolute top-3 right-16 rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition-all">
                                      Copied!
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Failed Run Status Card */}
                      {run.status === 'failed' && (
                        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger space-y-1">
                          <div className="font-semibold flex items-center gap-1.5">
                            <IconAlertTriangle size={15} />
                            Generation Failed
                          </div>
                          <p>{run.errorMessage || 'An error occurred during multi-agent drafting.'}</p>
                        </div>
                      )}

                      {/* Cancelled Run Status Card */}
                      {run.status === 'cancelled' && (
                        <div className="rounded-xl border border-border bg-card/60 p-3 text-xs text-muted">
                          Generation was cancelled.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
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
