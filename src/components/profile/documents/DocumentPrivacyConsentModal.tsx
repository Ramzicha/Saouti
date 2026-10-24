'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconShieldCheck,
  IconKey,
  IconLock,
  IconTrash,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';

interface DocumentPrivacyConsentModalProps {
  isOpen: boolean;
  onConsentSuccess: () => void;
  onCancel: () => void;
}

export function DocumentPrivacyConsentModal({
  isOpen,
  onConsentSuccess,
  onCancel,
}: DocumentPrivacyConsentModalProps) {
  const t = useTranslations('Documents');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const acknowledgeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      acknowledgeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleAcknowledge = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/documents/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noticeVersion: 'v1' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to record consent');
      }

      onConsentSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      aria-describedby="privacy-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg overflow-hidden bg-surface border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <IconShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-xl font-bold tracking-tight text-foreground">
                {t('privacyModalTitle')}
              </h2>
              <p id="privacy-modal-desc" className="text-xs text-muted-foreground mt-0.5">
                {t('privacyModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('privacyModalCancel')}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Guarantees List */}
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised border border-border/60">
            <IconKey className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {t('privacyPointKey')}
            </p>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised border border-border/60">
            <IconLock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {t('privacyPointStorage')}
            </p>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised border border-border/60">
            <IconTrash className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {t('privacyPointDelete')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('privacyModalCancel')}
          </button>
          <button
            ref={acknowledgeBtnRef}
            type="button"
            onClick={handleAcknowledge}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {submitting && <IconLoader2 className="w-4 h-4 animate-spin" />}
            <span>{t('privacyModalAcknowledge')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
