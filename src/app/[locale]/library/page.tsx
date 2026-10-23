'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { PostCard } from '@/components/library/PostCard';
import { PostFilters, type FilterState } from '@/components/library/PostFilters';
import { SearchInput } from '@/components/library/SearchInput';
import { PostEditorModal } from '@/components/library/PostEditorModal';
import { VersionHistoryDrawer } from '@/components/library/VersionHistoryDrawer';
import { MarkPostedModal } from '@/components/library/MarkPostedModal';
import { UndoToast } from '@/components/library/UndoToast';
import { ExportMenu } from '@/components/library/ExportMenu';
import { IconTrash, IconLoader2, IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import type { PostWithTags } from '@/lib/library/post-service';

export default function LibraryPage() {
  const t = useTranslations('Library');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data state
  const [posts, setPosts] = useState<PostWithTags[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters & Search
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Active modals & drawers
  const [editingPost, setEditingPost] = useState<PostWithTags | null>(null);
  const [versionsPost, setVersionsPost] = useState<PostWithTags | null>(null);
  const [markingPostedPost, setMarkingPostedPost] = useState<PostWithTags | null>(null);

  // 10-second undo deletion state
  const [undoToastOpen, setUndoToastOpen] = useState(false);
  const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(null);
  const [cachedDeletedPost, setCachedDeletedPost] = useState<PostWithTags | null>(null);

  // Fetch available user tags
  useEffect(() => {
    fetch('/api/tags')
      .then((res) => (res.ok ? res.json() : { tags: [] }))
      .then((data) => setAvailableTags(data.tags || []))
      .catch(() => setAvailableTags([]));
  }, []);

  // Fetch posts query
  const fetchPosts = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor;
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      const params = new URLSearchParams();
      if (filters.platform) params.set('platform', filters.platform);
      if (filters.status) params.set('status', filters.status);
      if (filters.tag) params.set('tag', filters.tag);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      try {
        const res = await fetch(`/api/posts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isInitial) {
            setPosts(data.posts || []);
          } else {
            setPosts((prev) => [...prev, ...(data.posts || [])]);
          }
          setNextCursor(data.nextCursor || null);
          setHasMore(Boolean(data.hasMore));
        }
      } catch {
        if (isInitial) setPosts([]);
      } finally {
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [filters, searchQuery],
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle post edit save
  const handleSavePost = async (updated: {
    content: string;
    hashtags: string[];
    imagePrompt?: string | undefined;
    status: 'draft' | 'ready' | 'posted';
  }) => {
    if (!editingPost) return;

    const res = await fetch(`/api/posts/${editingPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? data.post : p)),
      );
    }
  };

  // Handle mark as posted submit
  const handleMarkPostedSubmit = async (data: {
    publishedUrl?: string | undefined;
    publishedAt?: string | undefined;
  }) => {
    if (!markingPostedPost) return;

    const res = await fetch(`/api/posts/${markingPostedPost.id}/mark-posted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const resp = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === markingPostedPost.id ? resp.post : p)),
      );
    }
  };

  // Handle version restore
  const handleRestoreVersion = async (versionId: string) => {
    if (!versionsPost) return;

    const res = await fetch(
      `/api/posts/${versionsPost.id}/versions/${versionId}/restore`,
      { method: 'POST' },
    );

    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === versionsPost.id ? data.post : p)),
      );
      setVersionsPost(data.post);
    }
  };

  // Handle delete action (optimistic hide + 10s undo toast)
  const handleDeletePost = (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete) return;

    // Cache deleted post and remove optimistically from UI
    setCachedDeletedPost(postToDelete);
    setPendingDeletePostId(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setUndoToastOpen(true);
  };

  // Handle undo within 10s
  const handleUndoDelete = () => {
    if (cachedDeletedPost) {
      setPosts((prev) => [cachedDeletedPost, ...prev]);
    }
    setUndoToastOpen(false);
    setPendingDeletePostId(null);
    setCachedDeletedPost(null);
  };

  // Handle undo expiration (call soft delete / trash API)
  const handleUndoExpire = async () => {
    if (pendingDeletePostId) {
      await fetch(`/api/posts/${pendingDeletePostId}/trash`, { method: 'POST' });
    }
    setUndoToastOpen(false);
    setPendingDeletePostId(null);
    setCachedDeletedPost(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AppHeader onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          {/* Top Headline & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <ExportMenu filters={filters} searchQuery={searchQuery} />

              <Link
                href="/library/trash"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-surface-elevated hover:bg-surface border border-border rounded-lg transition-colors"
              >
                <IconTrash size={15} />
                <span>{t('trash')}</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-surface p-3 border border-border rounded-xl">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 max-w-md"
            />

            <PostFilters
              filters={filters}
              onChange={setFilters}
              availableTags={availableTags}
            />
          </div>

          {/* Post Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <IconLoader2 size={32} className="animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading library posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-2xl bg-surface/40">
              <div className="p-3 bg-accent/10 text-accent rounded-full mb-3">
                <IconSparkles size={28} />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t('emptyStateTitle')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                {t('emptyStateDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={setEditingPost}
                    onDelete={handleDeletePost}
                    onOpenVersions={setVersionsPost}
                    onMarkPosted={setMarkingPostedPost}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8 pb-8">
                  <button
                    type="button"
                    onClick={() => fetchPosts(nextCursor || undefined)}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-foreground bg-surface-elevated hover:bg-surface border border-border rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore && <IconLoader2 size={16} className="animate-spin" />}
                    <span>Load more posts</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <PostEditorModal
        post={editingPost}
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        onSave={handleSavePost}
      />

      <VersionHistoryDrawer
        post={versionsPost}
        isOpen={Boolean(versionsPost)}
        onClose={() => setVersionsPost(null)}
        onRestore={handleRestoreVersion}
      />

      <MarkPostedModal
        post={markingPostedPost}
        isOpen={Boolean(markingPostedPost)}
        onClose={() => setMarkingPostedPost(null)}
        onSubmit={handleMarkPostedSubmit}
      />

      <UndoToast
        isOpen={undoToastOpen}
        onUndo={handleUndoDelete}
        onExpire={handleUndoExpire}
        durationSeconds={10}
      />
    </div>
  );
}
