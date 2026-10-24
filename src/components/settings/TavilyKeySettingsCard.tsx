'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconSearch,
  IconKey,
  IconCheck,
  IconTrash,
  IconRefresh,
  IconLoader2,
  IconAlertCircle,
  IconExternalLink,
} from '@tabler/icons-react';

export interface TavilyKeyInfo {
  provider: 'tavily';
  lastFour: string | null;
  status: string | null;
  lastValidatedAt: string | null;
}

interface TavilyKeySettingsCardProps {
  initialKey?: TavilyKeyInfo | null;
}

export function TavilyKeySettingsCard({ initialKey = null }: TavilyKeySettingsCardProps) {
  const t = useTranslations('Explore');
  const [currentKey, setCurrentKey] = useState<TavilyKeyInfo | null>(initialKey);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch status on mount if not provided
  useEffect(() => {
    if (initialKey === null) {
      fetch('/api/settings/keys/tavily')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.hasKey && data.key) {
            setCurrentKey(data.key);
          }
        })
        .catch(() => {});
    }
  }, [initialKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage(t('keyInputLabel') + ' is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/keys/tavily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to validate API key');
      }

      setCurrentKey({
        provider: 'tavily',
        lastFour: data.lastFour,
        status: 'active',
        lastValidatedAt: new Date().toISOString(),
      });
      setApiKeyInput('');
      setIsReplacing(false);
      setSuccessMessage('Tavily search key configured successfully');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save Tavily key',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    try {
      const res = await fetch('/api/settings/keys/tavily', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete search key');
      }

      setCurrentKey(null);
      setShowDeleteConfirm(false);
      setIsReplacing(false);
      setSuccessMessage(t('keyDeleted'));
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete key',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconSearch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t('settingsCardTitle')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('settingsCardSubtitle')}
            </p>
          </div>
        </div>

        <a
          href="https://tavily.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium shrink-0"
        >
          <span>tavily.com</span>
          <IconExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs animate-in fade-in">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* State: Key Configured */}
      {currentKey && !isReplacing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-raised border border-border/70">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('keyConfigured', { last4: currentKey.lastFour || '••••' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  1,000 monthly free searches active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReplacing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-foreground hover:bg-muted/80 border border-border transition-colors"
              >
                <IconRefresh className="w-3.5 h-3.5" />
                <span>{t('replaceKey')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={t('deleteKey')}
              >
                <IconTrash className="w-3.5 h-3.5" />
                <span>{t('deleteKey')}</span>
              </button>
            </div>
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
              <p className="text-xs text-destructive font-medium">
                Are you sure you want to remove your Tavily search key? Explore will automatically fall back to free curated news feeds.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Remove'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* State: Add or Replace Key Form */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="tavily-settings-key-input"
              className="text-xs font-medium text-foreground"
            >
              {t('keyInputLabel')}
            </label>
            <div className="relative">
              <input
                id="tavily-settings-key-input"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={t('keyPlaceholder')}
                autoComplete="off"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 transition-colors"
              />
              <IconKey className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground">
              Stored securely with AES-256-GCM encryption. Never logged or exposed.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {isReplacing && (
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false);
                  setApiKeyInput('');
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !apiKeyInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors ml-auto"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <span>{isReplacing ? t('replaceKey') : t('saveKey')}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
