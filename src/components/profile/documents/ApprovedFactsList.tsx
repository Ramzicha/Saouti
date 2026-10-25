'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconCheck,
  IconLoader2,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { ApprovedFact } from '@/lib/db/schema';

interface ApprovedFactsListProps {
  refreshTrigger?: number;
}

export function ApprovedFactsList({ refreshTrigger }: ApprovedFactsListProps) {
  const t = useTranslations('Documents');
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFacts = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/facts');
      if (res.ok) {
        const data = await res.json();
        setFacts(data.facts || []);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
        <IconLoader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs">Loading approved facts...</span>
      </div>
    );
  }

  if (facts.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border/70 text-center space-y-2 bg-card/40">
        <IconInfoCircle className="w-6 h-6 mx-auto text-muted-foreground opacity-60" />
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {t('noFacts')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <IconCheck className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('factsTitle')} ({facts.length})
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('factsSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2 flex flex-col justify-between"
          >
            <p className="text-xs font-normal text-foreground/90 leading-relaxed">
              {fact.factText}
            </p>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
              <span className="capitalize font-medium text-foreground/80">
                {fact.factCategory.replace('_', ' ')}
              </span>

              {fact.sourceCitation ? (
                <span className="truncate max-w-[180px] font-medium" title={fact.sourceCitation}>
                  {fact.sourceCitation}
                </span>
              ) : (
                <span className="italic text-muted-foreground/70">
                  {t('standaloneFact')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
