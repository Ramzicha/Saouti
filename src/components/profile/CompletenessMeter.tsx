'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { IconSparkles, IconInfoCircle } from '@tabler/icons-react';
import clsx from 'clsx';

interface CompletenessMeterProps {
  score: number;
  level?: 'starter' | 'basic' | 'strong' | 'optimal';
  tip?: string | undefined;
  className?: string;
}

export function CompletenessMeter({
  score,
  level = 'starter',
  tip,
  className,
}: CompletenessMeterProps) {
  const t = useTranslations('Profile');

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border border-border/60 bg-card/60 space-y-2.5',
        className,
      )}
    >
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <IconSparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{t('completeness')}</span>
        </div>
        <span
          className={clsx(
            'font-bold px-2 py-0.5 rounded-full text-[11px]',
            score >= 90
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : score >= 70
                ? 'bg-surface-raised text-foreground border border-border'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {score}% ({level})
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-500 rounded-full',
            score >= 90
              ? 'bg-emerald-500'
              : score >= 70
                ? 'bg-foreground'
                : 'bg-amber-500',
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      {tip && (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-0.5">
          <IconInfoCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>{tip}</span>
        </div>
      )}
    </div>
  );
}
