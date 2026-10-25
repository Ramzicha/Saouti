'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconCoins,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconShieldCheck,
} from '@tabler/icons-react';
import type { QuotaStatus } from '@/lib/explore/quota-guard';

interface QuotaEstimateBadgeProps {
  quota?: QuotaStatus | undefined;
  hasTavilyKey?: boolean | undefined;
  className?: string | undefined;
}

export function QuotaEstimateBadge({
  quota,
  hasTavilyKey = false,
  className = '',
}: QuotaEstimateBadgeProps) {
  const t = useTranslations('Explore');

  const creditsCost = hasTavilyKey ? 1 : 0;
  const isFeed = !hasTavilyKey;

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap text-xs ${className}`}>
      {/* Credit Estimate Pill */}
      {isFeed ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
          <IconCheck className="w-3.5 h-3.5" />
          <span>{t('creditsUsed', { count: 0 })}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium">
          <IconCoins className="w-3.5 h-3.5" />
          <span>{t('creditsUsed', { count: creditsCost })}</span>
        </span>
      )}

      {/* Daily Limit Tracker */}
      {quota && (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
            quota.isDailyLimitReached
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-surface border-border text-muted-foreground'
          }`}
          title={`${quota.dailyCount} of ${quota.dailyLimit} daily searches used`}
        >
          <IconClock className="w-3 h-3" />
          <span>{t('dailyRemaining', { count: quota.dailyRemaining })}</span>
        </span>
      )}

      {/* Monthly Budget Guard Alert */}
      {quota?.isMonthlyGuardTriggered && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold animate-pulse">
          <IconAlertTriangle className="w-3 h-3" />
          <span>{t('quotaGuardWarning')}</span>
        </span>
      )}
    </div>
  );
}
