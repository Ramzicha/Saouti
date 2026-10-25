'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconExternalLink,
  IconBookmark,
  IconBookmarkFilled,
  IconSparkles,
  IconEyeOff,
  IconCalendar,
  IconWorld,
} from '@tabler/icons-react';
import type { Article } from '@/lib/db/schema';

interface ArticleCardProps {
  article: Article;
  isSaved?: boolean;
  onCreatePost: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  onDismiss: (article: Article) => void;
}

export function ArticleCard({
  article,
  isSaved = false,
  onCreatePost,
  onToggleSave,
  onDismiss,
}: ArticleCardProps) {
  const t = useTranslations('Explore');

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
      <div className="space-y-3.5">
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground/90 bg-surface-raised border border-border/70 px-2.5 py-0.5 rounded-full">
              <IconWorld className="w-3 h-3 text-primary" />
              <span>{article.sourceDomain}</span>
            </span>

            {formattedDate && (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <IconCalendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleSave(article)}
              title={isSaved ? t('unsaveArticle') : t('saveArticle')}
              aria-label={isSaved ? t('unsaveArticle') : t('saveArticle')}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {isSaved ? (
                <IconBookmarkFilled className="w-4 h-4" />
              ) : (
                <IconBookmark className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onDismiss(article)}
              title={t('notInterested')}
              aria-label={t('notInterested')}
              className="p-1.5 rounded-lg border border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <IconEyeOff className="w-4 h-4" />
            </button>
          </div>
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
            <IconExternalLink className="w-4 h-4 shrink-0 mt-1 text-muted-foreground group-hover:text-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </h3>

        {/* Summary in Saouti's voice (<= 40 words) */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {article.summary}
        </p>

        {/* Why it matches badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-raised border border-border text-xs font-medium text-foreground/85">
          <IconSparkles className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span>{article.matchReason}</span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-muted-foreground max-w-[160px] truncate">
          #{article.topicPhrase}
        </span>

        <button
          type="button"
          onClick={() => onCreatePost(article)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border transition-all shadow-sm"
        >
          <IconSparkles className="w-3.5 h-3.5 text-on-button/80" />
          <span>{t('createPost')}</span>
        </button>
      </div>
    </article>
  );
}
