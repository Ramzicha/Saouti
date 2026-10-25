'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconSearch,
  IconX,
  IconArrowRight,
  IconSparkles,
  IconLoader2,
} from '@tabler/icons-react';
import Link from 'next/link';

interface TavilyKeyPromptCardProps {
  onDismiss?: () => void;
  onAddKeyClick?: () => void;
}

export function TavilyKeyPromptCard({
  onDismiss,
  onAddKeyClick,
}: TavilyKeyPromptCardProps) {
  const t = useTranslations('Explore');
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch('/api/onboarding/tavily-prompt/dismiss', {
        method: 'POST',
      });
      setDismissed(true);
      if (onDismiss) onDismiss();
    } catch {
      setDismissed(true);
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 shadow-sm transition-all animate-in fade-in">
      <button
        type="button"
        onClick={handleDismiss}
        disabled={dismissing}
        aria-label={t('dismissPrompt')}
        className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <IconX className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-border text-foreground shadow-xs">
            <IconSparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {t('tavilyKeyBannerTitle')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {t('tavilyKeyBannerDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={dismissing}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('dismissPrompt')}
          </button>

          {onAddKeyClick ? (
            <button
              type="button"
              onClick={onAddKeyClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <span>{t('addTavilyKey')}</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href="/settings/keys"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <span>{t('addTavilyKey')}</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
