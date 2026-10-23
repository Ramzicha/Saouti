'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconChartBar, IconAlertTriangle } from '@tabler/icons-react';

export interface UsageStatItem {
  date: string;
  requestCount: number;
  errorCount: number;
  quotaErrorCount: number;
}

export function UsageIndicator() {
  const t = useTranslations('Keys');
  const [stats, setStats] = useState<UsageStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/keys/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.stats)) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalQuotaErrors = stats.reduce((acc, s) => acc + s.quotaErrorCount, 0);

  return (
    <div
      role="region"
      aria-labelledby="usage-heading"
      className="rounded-xl border border-border bg-card p-6 space-y-4"
    >
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <IconChartBar className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 id="usage-heading" className="text-base font-semibold text-foreground">
          {t('usageTitle')}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">
            {t('requestsToday')}
          </span>
          <p className="text-2xl font-bold text-foreground">
            {stats[0]?.requestCount || 0}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">
            {t('quotaErrors')}
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {totalQuotaErrors}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Loading usage data...
        </div>
      ) : stats.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground italic">
          {t('emptyUsage')}
        </p>
      ) : (
        <div className="space-y-2 pt-2">
          <div className="space-y-1.5">
            {stats.map((stat) => (
              <div
                key={stat.date}
                className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50 transition-colors"
              >
                <span className="font-mono text-muted-foreground">{stat.date}</span>
                <div className="flex items-center gap-3 font-medium">
                  <span className="text-foreground">{stat.requestCount} reqs</span>
                  {stat.quotaErrorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <IconAlertTriangle className="w-3 h-3" />
                      {stat.quotaErrorCount} pauses
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
