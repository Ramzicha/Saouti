'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconHistory,
  IconArrowBackUp,
  IconClock,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';

interface VersionItem {
  id: string;
  versionNumber: number;
  changeSummary: string | null;
  createdAt: string;
}

interface RevisionHistoryListProps {
  onRollbackComplete?: () => void;
}

export function RevisionHistoryList({ onRollbackComplete }: RevisionHistoryListProps) {
  const t = useTranslations('Profile');

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  const fetchVersions = async () => {
    try {
      const res = await fetch('/api/profile/versions');
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        setCurrentVersion(data.currentVersion || 1);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleRollback = async (versionNumber: number) => {
    if (
      !confirm(
        `Are you sure you want to roll back your voice profile to Version ${versionNumber}?`,
      )
    ) {
      return;
    }

    setRollingBack(versionNumber);
    try {
      const res = await fetch(`/api/profile/versions/${versionNumber}/rollback`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Rollback failed');
      }

      await fetchVersions();
      onRollbackComplete?.();
    } catch {
      alert('Failed to roll back to requested version');
    } finally {
      setRollingBack(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm gap-2">
        <IconLoader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Loading revision history...</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
        <IconHistory className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
        <p>No revision history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {versions.map((ver) => {
          const isCurrent = ver.versionNumber === currentVersion;
          const formattedDate = new Date(ver.createdAt).toLocaleString();

          return (
            <div
              key={ver.id}
              className="p-4 rounded-xl border border-input bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    Version {ver.versionNumber}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                      <IconCheck className="w-3 h-3" />
                      <span>{t('currentActive')}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ver.changeSummary || 'Profile updated'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <IconClock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {!isCurrent && (
                <button
                  type="button"
                  disabled={rollingBack !== null}
                  onClick={() => handleRollback(ver.versionNumber)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
                >
                  {rollingBack === ver.versionNumber ? (
                    <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <IconArrowBackUp className="w-3.5 h-3.5" />
                  )}
                  <span>{t('rollbackButton')}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
