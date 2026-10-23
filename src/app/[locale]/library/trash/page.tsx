'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import {
  IconTrash,
  IconArrowBackUp,
  IconAlertCircle,
  IconArrowLeft,
  IconLoader2,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { PostWithTags } from '@/lib/library/post-service';

export default function TrashPage() {
  const t = useTranslations('Library');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [posts, setPosts] = useState<PostWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts?isTrash=true&limit=100');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/restore`, { method: 'POST' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handlePermanentDelete = async (postId: string) => {
    if (!window.confirm(t('permanentDeleteConfirm'))) return;

    const res = await fetch(`/api/posts/${postId}?permanent=true`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          {/* Back link & Title */}
          <div className="mb-6">
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <IconArrowLeft size={16} />
              <span>Back to Library</span>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <IconTrash size={26} className="text-destructive" />
              <span>{t('trashTitle')}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('trashSubtitle')}
            </p>
          </div>

          {/* Retention notice alert */}
          <div className="flex items-center gap-2.5 p-3.5 mb-6 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <IconAlertCircle size={18} className="shrink-0" />
            <span>{t('trashRetentionNotice')}</span>
          </div>

          {/* Trash Items List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <IconLoader2 size={32} className="animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading trash...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-2xl bg-surface/40">
              <p className="text-sm text-muted-foreground">{t('trashEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {post.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Deleted: {new Date(post.deletedAt || post.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-foreground line-clamp-2">
                      {post.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(post.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 border border-accent/20 rounded-lg transition-colors"
                    >
                      <IconArrowBackUp size={15} />
                      <span>{t('restoreFromTrash')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(post.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg transition-colors"
                    >
                      <IconTrash size={15} />
                      <span>{t('permanentDelete')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
