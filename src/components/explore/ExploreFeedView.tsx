'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createComposerPreloadState, setComposerPreload } from '@/lib/explore/composer-bridge';
import {
  IconRefresh,
  IconLoader2,
  IconSparkles,
  IconSearch,
  IconInfoCircle,
  IconBookmark,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { Topic, Article } from '@/lib/db/schema';
import { TopicChipsBar } from './TopicChipsBar';
import { TopicEditModal } from './TopicEditModal';
import { SearchBox } from './SearchBox';
import { ArticleCard } from './ArticleCard';
import { TavilyKeyPromptCard } from './TavilyKeyPromptCard';
import Link from 'next/link';

interface ExploreFeedViewProps {
  initialTopics?: Topic[];
  initialArticles?: Article[];
  hasTavilyKey?: boolean;
  hasDismissedPrompt?: boolean;
}

export function ExploreFeedView({
  initialTopics = [],
  initialArticles = [],
  hasTavilyKey = false,
  hasDismissedPrompt = false,
}: ExploreFeedViewProps) {
  const t = useTranslations('Explore');
  const locale = useLocale();
  const router = useRouter();

  const [topicsList, setTopicsList] = useState<Topic[]>(initialTopics);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [articlesList, setArticlesList] = useState<Article[]>(initialArticles);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());

  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showPromptBanner, setShowPromptBanner] = useState(
    !hasTavilyKey && !hasDismissedPrompt,
  );

  // Load topics on mount if empty
  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await fetch('/api/explore/topics');
        if (!res.ok) return;
        const data = await res.json();
        if (data.topics && data.topics.length > 0) {
          setTopicsList(data.topics);
        } else {
          // Auto-generate 5-8 topics from voice profile
          setAgentStatus(t('suggestedTopics'));
          const genRes = await fetch('/api/explore/topics/generate', {
            method: 'POST',
          });
          if (genRes.ok) {
            const genData = await genRes.json();
            const reloaded = await fetch('/api/explore/topics').then((r) => r.json());
            if (reloaded.topics) setTopicsList(reloaded.topics);
          }
          setAgentStatus(null);
        }
      } catch {
        // Continue silently
      }
    }

    if (initialTopics.length === 0) {
      loadTopics();
    }
  }, [initialTopics.length, t]);

  // Fetch feed when active topic or search query changes
  const fetchFeed = useCallback(async (topicPhrase?: string) => {
    setLoadingFeed(true);
    setFallbackNotice(null);

    try {
      const url = topicPhrase
        ? `/api/explore/feed?topic=${encodeURIComponent(topicPhrase)}`
        : '/api/explore/feed';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load feed');

      const data = await res.json();
      setArticlesList(data.articles || []);
      setSavedUrls(new Set(data.savedUrls || []));
      setFallbackNotice(data.fallbackNotice || null);
    } catch {
      // Continue with current list
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    const phrase = searchQuery.trim() || activeTopic?.phrase;
    fetchFeed(phrase);
  }, [activeTopic, searchQuery, fetchFeed]);

  // Handle Refresh Action
  const handleRefresh = async () => {
    const currentTopicPhrase =
      searchQuery.trim() || activeTopic?.phrase || topicsList[0]?.phrase;

    if (!currentTopicPhrase) return;

    setRefreshing(true);
    setAgentStatus(t('statusSearching'));

    try {
      setTimeout(() => setAgentStatus(t('statusSummarizing')), 1500);

      const res = await fetch('/api/explore/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicPhrase: currentTopicPhrase }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Refresh failed');
      }

      const data = await res.json();
      setArticlesList(data.articles || []);
      setSavedUrls(new Set(data.savedUrls || []));
      setFallbackNotice(data.fallbackNotice || null);
      setAgentStatus(t('statusReady'));
      setTimeout(() => setAgentStatus(null), 2500);
    } catch (err: unknown) {
      setAgentStatus(err instanceof Error ? err.message : 'Refresh failed');
      setTimeout(() => setAgentStatus(null), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  // Topic CRUD Handlers
  const handleSaveTopic = async (data: {
    phrase: string;
    reason?: string | undefined;
    isPinned?: boolean | undefined;
  }) => {
    if (editingTopic) {
      const res = await fetch(`/api/explore/topics/${editingTopic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update topic');
      const updated = await res.json();
      setTopicsList((prev) =>
        prev.map((tp) => (tp.id === editingTopic.id ? updated.topic : tp)),
      );
    } else {
      const res = await fetch('/api/explore/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create topic');
      const created = await res.json();
      setTopicsList((prev) => [created.topic, ...prev]);
    }
  };

  const handleTogglePin = async (topic: Topic) => {
    const nextPinned = !topic.isPinned;
    try {
      const res = await fetch(`/api/explore/topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: nextPinned }),
      });
      if (!res.ok) return;
      setTopicsList((prev) =>
        prev.map((tp) => (tp.id === topic.id ? { ...tp, isPinned: nextPinned } : tp)),
      );
    } catch {
      // Ignore
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    try {
      const res = await fetch(`/api/explore/topics/${topic.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;
      setTopicsList((prev) => prev.filter((tp) => tp.id !== topic.id));
      if (activeTopic?.id === topic.id) {
        setActiveTopic(null);
      }
    } catch {
      // Ignore
    }
  };

  // Article Action Handlers
  const handleToggleSave = async (article: Article) => {
    const isCurrentlySaved = savedUrls.has(article.canonicalUrl);

    try {
      if (isCurrentlySaved) {
        // Remove from saved
        await fetch(`/api/explore/saved?url=${encodeURIComponent(article.canonicalUrl)}`, {
          method: 'DELETE',
        });
        setSavedUrls((prev) => {
          const next = new Set(prev);
          next.delete(article.canonicalUrl);
          return next;
        });
      } else {
        // Save article
        await fetch('/api/explore/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canonicalUrl: article.canonicalUrl,
            title: article.title,
            sourceDomain: article.sourceDomain,
            publishedAt: article.publishedAt
              ? new Date(article.publishedAt).toISOString()
              : null,
            summary: article.summary,
            topicPhrase: article.topicPhrase,
          }),
        });
        setSavedUrls((prev) => new Set(prev).add(article.canonicalUrl));
      }
    } catch {
      // Continue
    }
  };

  const handleDismissArticle = async (article: Article) => {
    // Hide immediately from UI
    setArticlesList((prev) =>
      prev.filter((a) => a.canonicalUrl !== article.canonicalUrl),
    );

    try {
      await fetch('/api/explore/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonicalUrl: article.canonicalUrl }),
      });
    } catch {
      // Ignore
    }
  };

  const handleCreatePost = (article: Article) => {
    const preload = createComposerPreloadState(
      {
        title: article.title,
        sourceDomain: article.sourceDomain,
        url: article.canonicalUrl,
        summary: article.summary,
      },
      locale,
    );
    setComposerPreload(preload);
    router.push(`/${locale}?fromExplore=true`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner for Users without Tavily Key */}
      {showPromptBanner && (
        <TavilyKeyPromptCard
          onDismiss={() => setShowPromptBanner(false)}
        />
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <IconSparkles className="w-3 h-3" />
              <span>Live Discovery</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/explore/saved"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-raised text-xs font-semibold transition-colors shadow-sm"
          >
            <IconBookmark className="w-4 h-4 text-primary" />
            <span>{t('savedTitle')}</span>
            {savedUrls.size > 0 && (
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {savedUrls.size}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors shadow-sm"
          >
            <IconRefresh
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? t('refreshingFeed') : t('refreshFeed')}</span>
          </button>
        </div>
      </div>

      {/* Live Agent Status Timeline */}
      {agentStatus && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium animate-in fade-in">
          <IconLoader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{agentStatus}</span>
        </div>
      )}

      {/* Fallback Feed Notice */}
      {fallbackNotice && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs animate-in fade-in">
          <IconInfoCircle className="w-4 h-4 shrink-0" />
          <span>{t('fallbackFeedNotice')}</span>
        </div>
      )}

      {/* Topic Chips Bar */}
      <TopicChipsBar
        topics={topicsList}
        activeTopicId={activeTopic?.id ?? null}
        onSelectTopic={(topic) => {
          setActiveTopic(topic);
          setSearchQuery('');
        }}
        onAddTopicClick={() => {
          setEditingTopic(null);
          setIsModalOpen(true);
        }}
        onEditTopic={(topic) => {
          setEditingTopic(topic);
          setIsModalOpen(true);
        }}
        onTogglePin={handleTogglePin}
        onDeleteTopic={handleDeleteTopic}
      />

      {/* Search Input Bar */}
      <SearchBox
        value={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query) setActiveTopic(null);
        }}
        onAddToTopics={(phrase) => {
          handleSaveTopic({ phrase });
        }}
        isExistingTopic={topicsList.some(
          (tp) => tp.phrase.toLowerCase() === searchQuery.trim().toLowerCase(),
        )}
        isLoading={loadingFeed}
      />

      {/* Feed Cards Grid */}
      {loadingFeed ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-56 rounded-2xl border border-border/60 bg-surface/40 animate-pulse p-6 space-y-4"
            >
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : articlesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-2">
          {articlesList.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isSaved={savedUrls.has(article.canonicalUrl)}
              onCreatePost={handleCreatePost}
              onToggleSave={handleToggleSave}
              onDismiss={handleDismissArticle}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-surface/50 space-y-3">
          <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
            <IconSearch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('noArticles')}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('noArticlesDesc')}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm mt-2"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span>{t('refreshFeed')}</span>
          </button>
        </div>
      )}

      {/* Topic Add / Edit Modal */}
      <TopicEditModal
        isOpen={isModalOpen}
        topic={editingTopic}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTopic}
      />
    </div>
  );
}
