'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconX, IconDeviceFloppy } from '@tabler/icons-react';
import type { PostWithTags } from '@/lib/library/post-service';

interface PostEditorModalProps {
  post: PostWithTags | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: {
    content: string;
    hashtags: string[];
    imagePrompt?: string | undefined;
    imageAltText?: string | undefined;
    imageAspectRatio?: string | undefined;
    status: 'draft' | 'ready' | 'posted';
  }) => Promise<void>;
}

export function PostEditorModal({
  post,
  isOpen,
  onClose,
  onSave,
}: PostEditorModalProps) {
  const t = useTranslations('Library');
  const [content, setContent] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9');
  const [status, setStatus] = useState<'draft' | 'ready' | 'posted'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setHashtagsStr((post.hashtags || []).join(' '));
      setImagePrompt(post.imagePrompt || '');
      setImageAltText(post.imageAltText || '');
      setImageAspectRatio(post.imageAspectRatio || '16:9');
      setStatus((post.status as 'draft' | 'ready' | 'posted') || 'draft');
      setError(null);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const parsedHashtags = hashtagsStr
        .split(/\s+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

      await onSave({
        content: content.trim(),
        hashtags: parsedHashtags,
        imagePrompt: imagePrompt.trim() || undefined,
        imageAltText: imageAltText.trim() || undefined,
        imageAspectRatio: imageAspectRatio || undefined,
        status,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
          <h2 id="post-editor-title" className="text-lg font-semibold text-foreground">
            {t('edit')} ({post.platform.toUpperCase()})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            aria-label={t('cancel')}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-sans whitespace-pre-wrap"
              placeholder="Enter post text..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Hashtags (space separated)
            </label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="#AI #Strategy #Productivity"
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-surface-elevated/40 p-3.5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('imagePrompt')}
            </h3>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t('imagePrompt')}
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Visual description for image generation..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('imageAspectRatio')}
                </label>
                <select
                  value={imageAspectRatio}
                  onChange={(e) => setImageAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Portrait)</option>
                  <option value="9:16">9:16 (Story)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t('imageAltText')}
                </label>
                <input
                  type="text"
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Accessibility alt description..."
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'ready' | 'posted')}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="draft">{t('statusDraft')}</option>
              <option value="ready">{t('statusReady')}</option>
              <option value="posted">{t('statusPosted')}</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-surface border border-border rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <IconDeviceFloppy size={16} />
              {isSaving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
