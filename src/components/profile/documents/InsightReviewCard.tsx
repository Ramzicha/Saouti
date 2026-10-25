'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconCheck,
  IconEdit,
  IconX,
  IconLoader2,
  IconBookmark,
  IconChecklist,
  IconAward,
  IconUsers,
  IconWriting,
  IconLanguage,
  IconFileText,
} from '@tabler/icons-react';
import type { DocumentInsight } from '@/lib/db/schema';
import type { InsightCategory } from '@/lib/documents/schemas';
import {
  detectInsightConflict,
  type ProfileSnapshot,
} from '@/lib/documents/conflict-detector';
import { InsightConflictBadge } from './InsightConflictBadge';
import clsx from 'clsx';

interface InsightReviewCardProps {
  insight: DocumentInsight;
  onReview: (insightId: string, action: 'accept' | 'edit' | 'reject', editedText?: string) => Promise<void>;
  profileSnapshot?: ProfileSnapshot | null;
}

export function InsightReviewCard({
  insight,
  onReview,
  profileSnapshot,
}: InsightReviewCardProps) {
  const t = useTranslations('Documents');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(insight.editedText || insight.rawText);
  const [submitting, setSubmitting] = useState(false);

  const isReviewed = insight.status !== 'pending';
  const conflict = detectInsightConflict(insight, profileSnapshot);

  const handleAction = async (action: 'accept' | 'edit' | 'reject') => {
    setSubmitting(true);
    try {
      if (action === 'edit') {
        await onReview(insight.id, 'edit', editText);
        setIsEditing(false);
      } else {
        await onReview(insight.id, action);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryDetails = (cat: string) => {
    switch (cat as InsightCategory) {
      case 'roles_experience':
        return { label: t('categoryRoles'), icon: IconChecklist, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      case 'expertise':
        return { label: t('categoryExpertise'), icon: IconBookmark, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
      case 'achievements':
        return { label: t('categoryAchievements'), icon: IconAward, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'audience_cues':
        return { label: t('categoryAudience'), icon: IconUsers, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
      case 'tone_style_cues':
        return { label: t('categoryToneStyle'), icon: IconWriting, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' };
      case 'languages':
        return { label: t('categoryLanguages'), icon: IconLanguage, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { label: cat, icon: IconFileText, color: 'text-muted-foreground bg-muted border-border' };
    }
  };

  const details = getCategoryDetails(insight.category);
  const CategoryIcon = details.icon;

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border transition-all duration-200 space-y-3',
        isReviewed
          ? insight.status === 'rejected'
            ? 'opacity-50 bg-muted/20 border-border/40'
            : 'bg-green-500/5 border-green-500/30'
          : 'bg-card border-border/70 hover:border-border shadow-sm',
      )}
    >
      {/* Top Header: Category, Citation, Confidence */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border',
              details.color,
            )}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{details.label}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border/40">
            {t('pageCitation', { page: insight.sourcePage })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {t('confidenceBadge', { score: insight.confidenceScore })}
          </span>
          {isReviewed && (
            <span
              className={clsx(
                'px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider',
                insight.status === 'approved' && 'text-green-600 dark:text-green-400 bg-green-500/10',
                insight.status === 'edited' && 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
                insight.status === 'rejected' && 'text-muted-foreground bg-muted',
              )}
            >
              {insight.status}
            </span>
          )}
        </div>
      </div>

      {/* Content / Edit Form */}
      {isEditing ? (
        <div className="space-y-2 pt-1">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={400}
            rows={3}
            className="w-full text-sm rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 resize-none"
            placeholder="Edit insight text..."
            aria-label="Edit insight text"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{editText.length} / 400</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={submitting}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                {t('cancelEditAction')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('edit')}
                disabled={submitting || editText.trim().length === 0}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-button text-on-button hover:opacity-90 transition-colors shadow disabled:opacity-50"
              >
                {submitting && <IconLoader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('saveEditAction')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground/90 leading-relaxed font-normal">
            {insight.editedText || insight.rawText}
          </p>
          {conflict && !isReviewed && (
            <InsightConflictBadge
              conflict={conflict}
              onUseProfile={() => handleAction('reject')}
              onUseProposal={() => handleAction('accept')}
            />
          )}
        </>
      )}

      {/* Review Actions (only if pending or can re-review) */}
      {!isEditing && !isReviewed && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => handleAction('reject')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <IconX className="w-4 h-4" />
            <span>{t('rejectAction')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <IconEdit className="w-4 h-4" />
            <span>{t('editAction')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('accept')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-button text-on-button hover:opacity-90 rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <IconLoader2 className="w-4 h-4 animate-spin" />
            ) : (
              <IconCheck className="w-4 h-4" />
            )}
            <span>{t('acceptAction')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
