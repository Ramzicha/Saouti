'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconBookmarkFilled,
  IconSparkles,
  IconExternalLink,
  IconTrash,
  IconNote,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconCalendar,
  IconWorld,
  IconFilter,
} from '@tabler/icons-react';
import type { SavedArticle } from '@/lib/db/schema';
import {
  createComposerPreloadState,
  setComposerPreload,
} from '@/lib/explore/composer-bridge';

interface SavedArticlesViewProps {
  initialArticles?: SavedArticle[];
}

export function SavedArticlesView({
  initialArticles = [],
}: SavedArticlesViewProps) {
  const t = useTranslations('Explore');
  const locale = useLocale();
  const router = useRouter();

  const [articlesList, setArticlesList] = useState<SavedArticle[]>(initialArticles);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Derive unique topics present in saved articles
  const availableTopics = Array.from(
    new Set(
      articlesList
        .map((a) => a.topicPhrase)
        .filter((tp): tp is string => Boolean(tp && tp.trim())),
    ),
  );

  const filteredArticles =
    selectedTopic === 'all'
      ? articlesList
      : articlesList.filter((a) => a.topicPhrase === selectedTopic);

  const handleStartEditNote = (article: SavedArticle) => {
    setEditingNoteId(article.id);
    setNoteDraft(article.privateNote || '');
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setNoteDraft('');
  };

  const handleSaveNote = async (articleId: string) => {
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/explore/saved/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateNote: noteDraft.trim() || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setArticlesList((prev) =>
          prev.map((a) => (a.id === articleId ? data.savedArticle : a)),
        );
        setEditingNoteId(null);
      }
    } catch {
      // Continue
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRemoveArticle = async (articleId: string) => {
    // Optimistically remove
    setArticlesList((prev) => prev.filter((a) => a.id !== articleId));

    try {
      await fetch(`/api/explore/saved/${articleId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore
    }
  };

  const handleCreatePost = (article: SavedArticle) => {
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            <span>{t('title')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('savedTab')}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-raised border border-border text-foreground">
              {articlesList.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('savedDescription')}
          </p>
        </div>
      </div>

      {/* Topic Filter Chips */}
      {availableTopics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 pr-1">
            <IconFilter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedTopic === 'all'
                ? 'bg-button text-on-button font-semibold shadow-xs'
                : 'bg-surface border border-border text-foreground hover:bg-surface-raised'
            }`}
          >
            All ({articlesList.length})
          </button>
          {availableTopics.map((topic) => {
            const count = articlesList.filter((a) => a.topicPhrase === topic).length;
            const isSelected = selectedTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-button text-on-button font-semibold shadow-xs'
                    : 'bg-surface border border-border text-foreground hover:bg-surface-raised'
                }`}
              >
                #{topic} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Saved Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border text-muted-foreground mx-auto flex items-center justify-center">
            <IconBookmarkFilled className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">
              {t('emptySaved')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Bookmark articles while browsing the Explore feed to build your reading backlog and attach private drafting thoughts.
            </p>
          </div>
          <div>
            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <IconSparkles className="w-3.5 h-3.5" />
              <span>Explore News</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const isEditing = editingNoteId === article.id;
            const formattedDate = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div
                key={article.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm hover:border-border/80 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground/90 bg-surface-raised border border-border/70 px-2.5 py-0.5 rounded-full">
                        <IconWorld className="w-3 h-3 text-muted-foreground" />
                        <span>{article.sourceDomain}</span>
                      </span>

                      {formattedDate && (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <IconCalendar className="w-3 h-3" />
                          <span>{formattedDate}</span>
                        </span>
                      )}

                      {article.topicPhrase && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          #{article.topicPhrase}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveArticle(article.id)}
                      title={t('unsaveArticle')}
                      className="p-1.5 rounded-lg border border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug transition-colors">
                    <a
                      href={article.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 focus:outline-none hover:underline"
                    >
                      <span>{article.title}</span>
                      <IconExternalLink className="w-4 h-4 shrink-0 mt-1 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {article.summary}
                  </p>

                  {/* Private Note Section */}
                  <div className="pt-2">
                    {isEditing ? (
                      <div className="space-y-2 rounded-xl border border-border bg-surface-raised/50 p-3">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor={`note-${article.id}`}
                            className="text-xs font-semibold text-foreground flex items-center gap-1"
                          >
                            <IconNote className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Private Drafting Note</span>
                          </label>
                          <span className="text-[11px] text-muted-foreground">
                            {noteDraft.length}/1000
                          </span>
                        </div>
                        <textarea
                          id={`note-${article.id}`}
                          rows={3}
                          value={noteDraft}
                          maxLength={1000}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Jot down key angles, questions, or ideas for your upcoming post..."
                          className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditNote}
                            disabled={isSavingNote}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(article.id)}
                            disabled={isSavingNote}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-button text-on-button text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Save Note</span>
                          </button>
                        </div>
                      </div>
                    ) : article.privateNote ? (
                      <div className="rounded-xl border border-border bg-surface-raised/60 p-3 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <IconNote className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Your Note</span>
                          </span>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {article.privateNote}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEditNote(article)}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEditNote(article)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <IconNote className="w-3.5 h-3.5" />
                        <span>Add private drafting note...</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreatePost(article)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border transition-all shadow-sm"
                  >
                    <IconSparkles className="w-3.5 h-3.5 text-on-button/80" />
                    <span>{t('createPost')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
