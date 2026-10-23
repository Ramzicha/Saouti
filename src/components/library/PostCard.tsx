'use client';

import React from 'react';
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
} from '@tabler/icons-react';
import { CopyButton } from './CopyButton';
import type { PostWithTags } from '@/lib/library/post-service';

interface PostCardProps {
  post: PostWithTags;
  onEdit: (post: PostWithTags) => void;
  onDelete: (postId: string) => void;
  onOpenVersions: (post: PostWithTags) => void;
  onMarkPosted: (post: PostWithTags) => void;
}

export function PostCard({
  post,
  onEdit,
  onDelete,
  onOpenVersions,
  onMarkPosted,
}: PostCardProps) {
  const t = useTranslations('Library');

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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
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
      className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
    >
      <div>
        {/* Card Header: Platform, Status & Action menu */}
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
    </article>
  );
}
