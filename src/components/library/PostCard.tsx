'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconBrandLinkedin,
  IconBrandX,
  IconBrandReddit,
  IconBrandInstagram,
  IconBrandFacebook,
  IconEdit,
  IconHistory,
  IconTrash,
  IconChecklist,
  IconExternalLink,
  IconSparkles,
  IconClock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { CopyButton } from './CopyButton';
import { ImagePromptCard } from './ImagePromptCard';
import { ImagePreviewGallery, GalleryImageItem } from './ImagePreviewGallery';
import { ImageCapabilityBanner } from './ImageCapabilityBanner';
import { ImageRegenerateModal } from './ImageRegenerateModal';
import type { PostWithTags } from '@/lib/library/post-service';

interface PostCardProps {
  post: PostWithTags;
  onEdit: (post: PostWithTags) => void;
  onDelete: (postId: string) => void;
  onOpenVersions: (post: PostWithTags) => void;
  onMarkPosted: (post: PostWithTags) => void;
  onGenerateImage?: ((post: PostWithTags) => void) | undefined;
  isGeneratingImage?: boolean | undefined;
  canGenerateImage?: boolean | undefined;
}

export function PostCard({
  post,
  onEdit,
  onDelete,
  onOpenVersions,
  onMarkPosted,
}: PostCardProps) {
  const t = useTranslations('Library');
  const tVisuals = useTranslations('Visuals');

  // Image & Visual State
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [artDirectorState, setArtDirectorState] = useState<string | null>(null);
  const [quotaCountdown, setQuotaCountdown] = useState<number | null>(null);
  const [showCapabilityBanner, setShowCapabilityBanner] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch images for this post on mount
  useEffect(() => {
    let isMounted = true;
    async function loadImages() {
      try {
        const res = await fetch(`/api/posts/${post.id}/images`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.images) {
            setImages(data.images);
          }
        }
      } catch {
        // Non-fatal if loading fails initially
      }
    }
    loadImages();
    return () => {
      isMounted = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [post.id]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setShowCapabilityBanner(false);
      setArtDirectorState(tVisuals('artDirectorStateGenerating'));

      const res = await fetch(`/api/posts/${post.id}/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: post.imagePrompt || undefined,
          aspectRatio: post.imageAspectRatio || '16:9',
          altText: post.imageAltText || undefined,
        }),
      });

      if (res.status === 422) {
        setShowCapabilityBanner(true);
        setArtDirectorState(null);
        return;
      }

      if (res.status === 429) {
        const data = await res.json();
        const waitSec = data.retryAfterSeconds || 20;
        setQuotaCountdown(waitSec);
        setArtDirectorState(tVisuals('artDirectorStateQuota', { seconds: waitSec }));

        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setQuotaCountdown((prev) => {
            if (prev === null || prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setArtDirectorState(null);
              return null;
            }
            const next = prev - 1;
            setArtDirectorState(tVisuals('artDirectorStateQuota', { seconds: next }));
            return next;
          });
        }, 1000);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setArtDirectorState(
          tVisuals('artDirectorStateFailed', { reason: data.error?.message || 'Error' }),
        );
        return;
      }

      const data = await res.json();
      if (data.image) {
        setImages((prev) => [
          ...prev.map((img) => ({ ...img, isPrimary: false })),
          data.image,
        ]);
        setArtDirectorState(null);
      }
    } catch {
      setArtDirectorState(tVisuals('artDirectorStateFailed', { reason: 'Network error' }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSubmit = async (data: { instruction: string; aspectRatio: string }) => {
    setIsGenerating(true);
    setArtDirectorState(tVisuals('artDirectorStateGenerating'));

    try {
      const res = await fetch(`/api/posts/${post.id}/images/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.status === 422) {
        setShowCapabilityBanner(true);
        setArtDirectorState(null);
        return;
      }

      if (res.status === 429) {
        const errData = await res.json();
        const waitSec = errData.retryAfterSeconds || 20;
        setQuotaCountdown(waitSec);
        setArtDirectorState(tVisuals('artDirectorStateQuota', { seconds: waitSec }));
        return;
      }

      if (res.ok) {
        const resp = await res.json();
        if (resp.image) {
          setImages((prev) => [
            ...prev.map((img) => ({ ...img, isPrimary: false })),
            resp.image,
          ]);
          setArtDirectorState(null);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    const res = await fetch(`/api/posts/${post.id}/images/${imageId}/primary`, {
      method: 'PATCH',
    });
    if (res.ok) {
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        })),
      );
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const res = await fetch(`/api/posts/${post.id}/images/${imageId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  };

  const cancelQuotaPause = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setQuotaCountdown(null);
    setArtDirectorState(null);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <IconBrandLinkedin size={16} className="text-[#0a66c2]" />;
      case 'x':
        return <IconBrandX size={16} className="text-foreground" />;
      case 'reddit':
        return <IconBrandReddit size={16} className="text-[#ff4500]" />;
      case 'instagram':
        return <IconBrandInstagram size={16} className="text-[#e4405f]" />;
      case 'facebook':
        return <IconBrandFacebook size={16} className="text-[#1877f2]" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {t('statusPosted')}
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {t('statusReady')}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
            {t('statusDraft')}
          </span>
        );
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
    >
      <div>
        {/* Card Header: Platform, Status & Copy */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-elevated border border-border">
              {getPlatformIcon(post.platform)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {post.platform}
            </span>
            {getStatusBadge(post.status)}
          </div>

          <div className="flex items-center gap-1">
            <CopyButton content={post.content} hashtags={post.hashtags} />
          </div>
        </div>

        {/* Post Text Content (Preserving line breaks) */}
        <div className="text-sm text-foreground font-normal leading-relaxed whitespace-pre-wrap mb-4 line-clamp-6">
          {post.content}
        </div>

        {/* Capability Banner if unsupported */}
        {showCapabilityBanner && (
          <div className="mb-4">
            <ImageCapabilityBanner onDismiss={() => setShowCapabilityBanner(false)} />
          </div>
        )}

        {/* Art Director Live Status / Rate Limit Banner */}
        {artDirectorState && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-primary-500/30 bg-primary-500/[0.08] p-3 text-xs text-primary-950 dark:border-primary-400/30 dark:bg-primary-400/[0.06] dark:text-primary-100"
          >
            <div className="flex items-center gap-2">
              {quotaCountdown !== null ? (
                <IconClock className="h-4 w-4 animate-pulse text-amber-500 shrink-0" />
              ) : isGenerating ? (
                <IconSparkles className="h-4 w-4 animate-spin text-primary-500 shrink-0" />
              ) : (
                <IconAlertCircle className="h-4 w-4 text-primary-500 shrink-0" />
              )}
              <span className="font-medium">{artDirectorState}</span>
            </div>

            {quotaCountdown !== null && (
              <button
                type="button"
                onClick={cancelQuotaPause}
                className="rounded-md border border-primary-500/40 bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground hover:bg-surface-elevated transition-colors"
              >
                {tVisuals('cancelGeneration')}
              </button>
            )}
          </div>
        )}

        {/* Visual Assets Preview Gallery (if generated) */}
        {images.length > 0 ? (
          <div className="mb-4">
            <ImagePreviewGallery
              postId={post.id}
              images={images}
              onRegenerateClick={() => setIsRegenerateOpen(true)}
              onSetPrimary={handleSetPrimary}
              onDeleteImage={handleDeleteImage}
            />
          </div>
        ) : post.imagePrompt ? (
          /* Editable Visual Prompt Card (if prompt exists and not yet generated) */
          <div className="mb-4">
            <ImagePromptCard
              prompt={post.imagePrompt}
              aspectRatio={post.imageAspectRatio || '16:9'}
              altText={post.imageAltText || undefined}
              onEdit={() => onEdit(post)}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              canGenerate={quotaCountdown === null}
            />
          </div>
        ) : null}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-elevated border border-border text-foreground"
                style={{ borderColor: tag.color }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Published link if marked as posted */}
        {post.status === 'posted' && post.publishedUrl && (
          <div className="mb-3">
            <a
              href={post.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <IconExternalLink size={12} />
              <span>{post.publishedUrl}</span>
            </a>
          </div>
        )}
      </div>

      {/* Card Footer: Metadata and Action triggers */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formattedDate}</span>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {post.status !== 'posted' && (
            <button
              type="button"
              onClick={() => onMarkPosted(post)}
              className="p-1.5 hover:text-foreground hover:bg-surface-elevated rounded-md transition-colors"
              title={t('markPosted')}
              aria-label={t('markPosted')}
            >
              <IconChecklist size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenVersions(post)}
            className="p-1.5 hover:text-foreground hover:bg-surface-elevated rounded-md transition-colors flex items-center gap-1"
            title={t('versions')}
            aria-label={t('versions')}
          >
            <IconHistory size={16} />
            {post.versionCount > 1 && <span>{post.versionCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => onEdit(post)}
            className="p-1.5 hover:text-foreground hover:bg-surface-elevated rounded-md transition-colors"
            title={t('edit')}
            aria-label={t('edit')}
          >
            <IconEdit size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title={t('delete')}
            aria-label={t('delete')}
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {/* Image Regeneration Modal */}
      <ImageRegenerateModal
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        onSubmit={handleRegenerateSubmit}
        currentAspectRatio={post.imageAspectRatio || '16:9'}
      />
    </article>
  );
}
