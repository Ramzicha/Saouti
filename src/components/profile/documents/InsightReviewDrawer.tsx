'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconX,
  IconLoader2,
  IconCheck,
  IconFileText,
} from '@tabler/icons-react';
import { InsightReviewCard } from './InsightReviewCard';
import type { Document, DocumentInsight } from '@/lib/db/schema';
import { INSIGHT_CATEGORIES } from '@/lib/documents/schemas';
import clsx from 'clsx';

interface InsightReviewDrawerProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onFactsUpdated?: () => void;
}

export function InsightReviewDrawer({
  isOpen,
  document,
  onClose,
  onFactsUpdated,
}: InsightReviewDrawerProps) {
  const t = useTranslations('Documents');
  const [insights, setInsights] = useState<DocumentInsight[]>([]);
  const [profileSnapshot, setProfileSnapshot] = useState<import('@/lib/documents/conflict-detector').ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      setLoading(true);
      setError(null);

      // Fetch profile snapshot for conflict detection
      fetch('/api/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profile) {
            setProfileSnapshot({
              role: data.profile.identityData?.role,
              industry: data.profile.identityData?.industry,
              expertise: data.profile.identityData?.expertise,
              primaryLanguage: data.profile.primaryLanguage,
            });
          }
        })
        .catch(() => {});

      fetch(`/api/profile/documents/${document.id}/insights`)
        .then((res) => res.json())
        .then((data) => {
          setInsights(data.insights || []);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load insights');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, document]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const handleReviewAction = async (
    insightId: string,
    action: 'accept' | 'edit' | 'reject',
    editedText?: string,
  ) => {
    const res = await fetch(`/api/profile/documents/insights/${insightId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, editedText }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Review action failed');
    }

    const data = await res.json();
    setInsights((prev) =>
      prev.map((item) => (item.id === insightId ? data.insight : item)),
    );

    if (onFactsUpdated) {
      onFactsUpdated();
    }
  };

  const pendingCount = insights.filter((i) => i.status === 'pending').length;
  const filteredInsights =
    selectedCategory === 'all'
      ? insights
      : insights.filter((i) => i.category === selectedCategory);

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return insights.length;
    return insights.filter((i) => i.category === cat).length;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-surface border-s border-border shadow-2xl flex flex-col">
          {/* Top Bar Header */}
          <div className="p-6 border-b border-border/60 flex items-start justify-between gap-4 bg-muted/20">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <IconFileText className="w-5 h-5 text-foreground shrink-0" />
                <h2 id="review-drawer-title" className="text-lg font-bold tracking-tight text-foreground truncate">
                  {document.originalFileName}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reviewDrawerSubtitle')}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="font-semibold text-foreground">
                  {insights.length} {t('tabTitle')}
                </span>
                <span>•</span>
                <span className={clsx('font-semibold', pendingCount > 0 ? 'text-amber-500' : 'text-green-500')}>
                  {t('pendingInsightsCount', { count: pendingCount })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border"
              aria-label="Close review drawer"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="px-6 py-3 border-b border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-card/40">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                selectedCategory === 'all'
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <span>{t('allCategories')}</span>
              <span className="opacity-75 text-[10px]">({getCategoryCount('all')})</span>
            </button>

            {INSIGHT_CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat);
              if (count === 0) return null;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                    selectedCategory === cat
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <span className="capitalize">{cat.replace('_', ' ')}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Insight Cards Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <IconLoader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-xs">Loading insights...</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                {error}
              </div>
            )}

            {!loading && filteredInsights.length === 0 && (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <IconCheck className="w-8 h-8 mx-auto text-green-500 opacity-80" />
                <p className="text-sm font-medium">All insights in this category have been reviewed.</p>
              </div>
            )}

            {!loading &&
              filteredInsights.map((insight) => (
                <InsightReviewCard
                  key={insight.id}
                  insight={insight}
                  onReview={handleReviewAction}
                  profileSnapshot={profileSnapshot}
                />
              ))}
          </div>

          {/* Bottom Bar Footer */}
          <div className="p-4 border-t border-border/60 flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {pendingCount === 0 ? 'All insights processed' : `${pendingCount} items remaining to review`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
