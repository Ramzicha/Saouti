'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconTrash,
  IconLoader2,
  IconX,
  IconBookmark,
  IconTrashX,
} from '@tabler/icons-react';
import type { Document } from '@/lib/db/schema';
import clsx from 'clsx';

interface DocumentDeleteModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

export function DocumentDeleteModal({
  isOpen,
  document,
  onClose,
  onDeleteSuccess,
}: DocumentDeleteModalProps) {
  const t = useTranslations('Documents');
  const [keepFacts, setKeepFacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setKeepFacts(true);
      setError(null);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/profile/documents/${document.id}?keepApprovedFacts=${keepFacts}`,
        {
          method: 'DELETE',
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete document');
      }

      onDeleteSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deletion failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-surface border border-border shadow-2xl rounded-2xl p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <IconTrash className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-modal-title" className="text-base font-bold text-foreground">
                {t('deleteModalTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                {document.originalFileName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('deleteModalConfirmMessage', { fileName: document.originalFileName })}
        </p>

        {/* Options Radio Cards */}
        <div className="space-y-2.5">
          {/* Option A: Keep Facts */}
          <label
            onClick={() => setKeepFacts(true)}
            className={clsx(
              'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
              keepFacts
                ? 'border-foreground/80 bg-surface-raised ring-1 ring-border'
                : 'border-border/60 hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name="keepFacts"
              checked={keepFacts}
              onChange={() => setKeepFacts(true)}
              className="mt-0.5 text-foreground focus:ring-border accent-foreground"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <IconBookmark className="w-4 h-4 text-foreground" />
                <span>{t('keepFactsOption')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('keepFactsDescription')}
              </p>
            </div>
          </label>

          {/* Option B: Remove Facts */}
          <label
            onClick={() => setKeepFacts(false)}
            className={clsx(
              'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all',
              !keepFacts
                ? 'border-destructive bg-destructive/5 ring-1 ring-destructive'
                : 'border-border/60 hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name="keepFacts"
              checked={!keepFacts}
              onChange={() => setKeepFacts(false)}
              className="mt-0.5 text-destructive focus:ring-destructive"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <IconTrashX className="w-4 h-4" />
                <span>{t('removeFactsOption')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('removeFactsDescription')}
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            {t('deleteCancelButton')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {submitting && <IconLoader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t('deleteConfirmButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
