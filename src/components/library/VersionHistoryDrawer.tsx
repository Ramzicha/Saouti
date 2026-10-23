'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconX, IconHistory, IconArrowBackUp } from '@tabler/icons-react';
import type { PostWithTags } from '@/lib/library/post-service';
import type { PostVersion } from '@/lib/db/schema';

interface VersionHistoryDrawerProps {
  post: PostWithTags | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<void>;
}

export function VersionHistoryDrawer({
  post,
  isOpen,
  onClose,
  onRestore,
}: VersionHistoryDrawerProps) {
  const t = useTranslations('Library');
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !post) return;

    setIsLoading(true);
    fetch(`/api/posts/${post.id}/versions`)
      .then((res) => (res.ok ? res.json() : { versions: [] }))
      .then((data) => setVersions(data.versions || []))
      .catch(() => setVersions([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleRestore = async (versionId: string) => {
    try {
      setRestoringId(versionId);
      await onRestore(versionId);
      onClose();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-md bg-surface border-s border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-end duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2">
            <IconHistory size={20} className="text-accent" />
            <h2 id="version-drawer-title" className="text-base font-semibold text-foreground">
              {t('versionTitle')} ({versions.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            aria-label={t('cancel')}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center p-8 text-sm text-muted-foreground">
              No historical versions recorded yet.
            </div>
          ) : (
            versions.map((version) => {
              const wordCount = version.content.split(/\s+/).filter(Boolean).length;
              const dateStr = new Date(version.createdAt).toLocaleString();
              const isRestoring = restoringId === version.id;

              return (
                <div
                  key={version.id}
                  className="bg-surface-elevated border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent">
                      {t('versionNumber', { version: version.versionNumber })}
                    </span>
                    <span className="text-xs text-muted-foreground">{dateStr}</span>
                  </div>

                  <div className="text-xs text-foreground font-normal whitespace-pre-wrap line-clamp-4 bg-background p-2.5 rounded border border-border/50">
                    {version.content}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {wordCount} words
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      disabled={isRestoring}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 border border-accent/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      <IconArrowBackUp size={14} />
                      <span>{isRestoring ? t('restoring') : t('restoreVersion')}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
