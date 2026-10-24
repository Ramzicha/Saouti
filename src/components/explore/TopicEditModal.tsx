'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { IconX, IconPin, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import type { Topic } from '@/lib/db/schema';

interface TopicEditModalProps {
  isOpen: boolean;
  topic?: Topic | null | undefined;
  onClose: () => void;
  onSave: (data: { phrase: string; reason?: string | undefined; isPinned?: boolean | undefined }) => Promise<void>;
}

export function TopicEditModal({
  isOpen,
  topic = null,
  onClose,
  onSave,
}: TopicEditModalProps) {
  const t = useTranslations('Explore');
  const [phrase, setPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhrase(topic?.phrase || '');
      setReason(topic?.reason || '');
      setIsPinned(topic?.isPinned || false);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, topic]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = phrase.trim();
    if (trimmed.length < 2) {
      setError('Topic must be at least 2 characters');
      return;
    }
    if (trimmed.length > 120) {
      setError('Topic cannot exceed 120 characters');
      return;
    }

    setSubmitting(true);
    try {
      const payload: { phrase: string; reason?: string; isPinned?: boolean } = {
        phrase: trimmed,
        isPinned,
      };
      if (reason.trim()) {
        payload.reason = reason.trim();
      }
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save topic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-surface border border-border shadow-2xl rounded-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-3">
          <h3 id="topic-modal-title" className="text-lg font-bold text-foreground">
            {topic ? t('editTopic') : t('addTopic')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="topic-phrase-input"
              className="text-xs font-semibold text-foreground"
            >
              {t('topicPhraseLabel')}
            </label>
            <input
              ref={inputRef}
              id="topic-phrase-input"
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t('topicPhrasePlaceholder')}
              maxLength={120}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">
              Between 2 and 6 words. Only this topic phrase is queried, never your personal profile details.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="topic-pinned-checkbox"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/40 h-4 w-4"
            />
            <label
              htmlFor="topic-pinned-checkbox"
              className="text-xs text-foreground cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <IconPin className="w-3.5 h-3.5 text-primary" />
              <span>{t('pinTopic')}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !phrase.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Topic</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
