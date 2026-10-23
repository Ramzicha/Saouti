'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FreeTierNotice } from './FreeTierNotice';
import {
  IconKey,
  IconCheck,
  IconTrash,
  IconRefresh,
  IconLoader2,
  IconAlertCircle,
  IconShieldLock,
} from '@tabler/icons-react';

export interface KeySummary {
  provider: 'gemini';
  lastFour: string;
  status: 'active' | 'invalid' | 'quota_exceeded';
  lastValidatedAt: string | null;
  createdAt: string;
}

interface KeySetupDialogProps {
  initialKey?: KeySummary | null;
  onKeySaved?: (key: KeySummary) => void;
  onKeyDeleted?: () => void;
}

export function KeySetupDialog({
  initialKey = null,
  onKeySaved,
  onKeyDeleted,
}: KeySetupDialogProps) {
  const t = useTranslations('Keys');

  const [currentKey, setCurrentKey] = useState<KeySummary | null>(initialKey);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acknowledged) {
      setErrorMessage(t('consentCheckbox'));
      return;
    }

    if (apiKeyInput.trim().length < 10) {
      setErrorMessage('API key must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          apiKey: apiKeyInput.trim(),
          acknowledgedTerms: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to validate API key');
      }

      setCurrentKey(data.key);
      setApiKeyInput('');
      setIsReplacing(false);
      setSuccessMessage(t('saveSuccess'));
      if (onKeySaved) onKeySaved(data.key);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save API key',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    try {
      const res = await fetch('/api/settings/keys', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete key');
      }

      setCurrentKey(null);
      setShowDeleteConfirm(false);
      setIsReplacing(false);
      setSuccessMessage(t('deleteSuccess'));
      if (onKeyDeleted) onKeyDeleted();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete API key',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: KeySummary['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('statusActive')}
          </span>
        );
      case 'quota_exceeded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t('statusQuota')}
          </span>
        );
      case 'invalid':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {t('statusInvalid')}
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconShieldLock className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400"
        >
          <IconAlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <IconCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {currentKey && !isReplacing ? (
        <div className="rounded-lg border border-border/80 bg-muted/30 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                {t('maskedKeyLabel')}
              </span>
              <div className="flex items-center gap-3">
                <code
                  dir="ltr"
                  className="font-mono text-sm tracking-wider font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border"
                >
                  ••••••••••••••{currentKey.lastFour}
                </code>
                {getStatusBadge(currentKey.status)}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsReplacing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <IconRefresh className="w-3.5 h-3.5" aria-hidden="true" />
                {t('replaceKey')}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 transition-colors"
              >
                <IconTrash className="w-3.5 h-3.5" aria-hidden="true" />
                {t('deleteKey')}
              </button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 space-y-3">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {t('deleteConfirm')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteKey}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {t('deleteKey')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="gemini-api-key"
              className="text-xs font-semibold text-foreground block"
            >
              {t('keyPlaceholder')}
            </label>
            <div className="relative">
              <input
                id="gemini-api-key"
                type="password"
                dir="ltr"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                disabled={isSubmitting}
                required
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          <FreeTierNotice
            acknowledged={acknowledged}
            onAcknowledgeChange={setAcknowledged}
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !acknowledged || apiKeyInput.trim().length < 10}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{t('verifying')}</span>
                </>
              ) : (
                <>
                  <IconKey className="w-4 h-4" aria-hidden="true" />
                  <span>{t('saveButton')}</span>
                </>
              )}
            </button>

            {isReplacing && (
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false);
                  setApiKeyInput('');
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
