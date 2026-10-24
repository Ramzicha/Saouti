'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconSearch,
  IconKey,
  IconArrowRight,
  IconLoader2,
  IconAlertCircle,
  IconExternalLink,
  IconCheck,
} from '@tabler/icons-react';

interface TavilyKeyStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function TavilyKeyStep({ onNext, onSkip }: TavilyKeyStepProps) {
  const t = useTranslations('Explore');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError(t('keyInputLabel') + ' is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings/keys/tavily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || t('keyInvalid', { error: 'Unknown error' }));
      }

      onNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
          <IconSearch className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('onboardingStepTitle')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {t('onboardingStepSubtitle')}
        </p>
      </div>

      {/* Guide Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>{t('onboardingGuideTitle')}</span>
          <a
            href="https://tavily.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium text-xs normal-case ml-auto"
          >
            tavily.com
            <IconExternalLink className="w-3.5 h-3.5" />
          </a>
        </h3>

        <ol className="space-y-2.5 text-sm text-foreground/90">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              1
            </span>
            <span>{t('onboardingGuideStep1')}</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              2
            </span>
            <span>{t('onboardingGuideStep2')}</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              3
            </span>
            <span>{t('onboardingGuideStep3')}</span>
          </li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="tavily-key-input"
            className="text-xs font-medium text-foreground"
          >
            {t('keyInputLabel')}
          </label>
          <div className="relative">
            <input
              id="tavily-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('keyPlaceholder')}
              autoComplete="off"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 transition-colors"
            />
            <IconKey className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t('onboardingSkip')}
          </button>

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <IconLoader2 className="w-4 h-4 animate-spin" />
                <span>{t('saveKey')}...</span>
              </>
            ) : (
              <>
                <span>{t('saveKey')}</span>
                <IconArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
