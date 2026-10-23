'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconX, IconCheck } from '@tabler/icons-react';
import type { PostWithTags } from '@/lib/library/post-service';

interface MarkPostedModalProps {
  post: PostWithTags | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { publishedUrl?: string | undefined; publishedAt?: string | undefined }) => Promise<void>;
}

export function MarkPostedModal({
  post,
  isOpen,
  onClose,
  onSubmit,
}: MarkPostedModalProps) {
  const t = useTranslations('Library');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (publishedUrl && !publishedUrl.startsWith('https://')) {
      setError('Published URL must use HTTPS protocol');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        publishedUrl: publishedUrl.trim() || undefined,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark post as posted');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-posted-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
          <h2 id="mark-posted-title" className="text-base font-semibold text-foreground">
            {t('markPosted')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            aria-label={t('cancel')}
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('publishedUrl')}
            </label>
            <input
              type="url"
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('publishedUrlPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('publishedAt')}
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-surface border border-border rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <IconCheck size={16} />
              <span>{isSubmitting ? t('saving') : t('markPosted')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
