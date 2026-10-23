'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconDownload,
  IconSparkles,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';

export interface GalleryImageItem {
  id: string;
  postId: string;
  versionNumber: number;
  isPrimary: boolean;
  aspectRatio: string;
  prompt: string;
  altText?: string | null | undefined;
  refinementInstruction?: string | null | undefined;
  createdAt: string | Date;
}

export interface ImagePreviewGalleryProps {
  postId: string;
  images: GalleryImageItem[];
  onRegenerateClick?: (() => void) | undefined;
  onSetPrimary?: ((imageId: string) => Promise<void>) | undefined;
  onDeleteImage?: ((imageId: string) => Promise<void>) | undefined;
}

export const ImagePreviewGallery: React.FC<ImagePreviewGalleryProps> = ({
  postId,
  images,
  onRegenerateClick,
  onSetPrimary,
  onDeleteImage,
}) => {
  const t = useTranslations('Visuals');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  // Active image is selected image or default primary (or latest)
  const activeImage =
    images.find((img) => img.id === selectedImageId) ||
    images.find((img) => img.isPrimary) ||
    images[images.length - 1];

  if (!activeImage) return null;

  const imageUrl = `/api/posts/${postId}/images/${activeImage.id}`;
  const downloadUrl = `/api/posts/${postId}/images/${activeImage.id}/download`;

  const handleSetPrimary = async () => {
    if (!onSetPrimary || activeImage.isPrimary || isSettingPrimary) return;
    try {
      setIsSettingPrimary(true);
      await onSetPrimary(activeImage.id);
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteImage || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDeleteImage(activeImage.id);
      setSelectedImageId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      {/* Primary Image Preview Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-900/90 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={activeImage.altText || t('altText')}
          className="h-full w-full object-contain"
          loading="lazy"
        />

        {/* Top Badges: Aspect Ratio & Primary Status */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {activeImage.isPrimary ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-600/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-xs backdrop-blur-xs">
                <IconCheck className="h-3 w-3" />
                <span>{t('primaryBadge')}</span>
              </span>
            ) : onSetPrimary ? (
              <button
                type="button"
                onClick={handleSetPrimary}
                disabled={isSettingPrimary}
                className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-black/80 backdrop-blur-xs transition-colors"
              >
                {isSettingPrimary ? '...' : t('setPrimary')}
              </button>
            ) : null}
          </div>

          <span className="pointer-events-auto rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-xs">
            {activeImage.aspectRatio}
          </span>
        </div>

        {/* Floating Download & Delete Controls */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-black/60 p-1 backdrop-blur-xs">
          <a
            href={downloadUrl}
            download
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/90 hover:bg-white/20 hover:text-white transition-colors"
            title={t('downloadImage')}
            aria-label={t('downloadImage')}
          >
            <IconDownload className="h-4 w-4" />
          </a>

          {onDeleteImage && images.length > 1 && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              title={t('deleteImage')}
              aria-label={t('deleteImage')}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Information & Version Thumbnails */}
      <div className="p-3 text-xs space-y-2.5">
        {activeImage.altText && (
          <p className="text-muted-foreground line-clamp-2">
            <span className="font-semibold text-foreground">{t('altText')}:</span>{' '}
            {activeImage.altText}
          </p>
        )}

        {/* Thumbnail Version Carousel if multiple versions exist */}
        {images.length > 1 && (
          <div className="border-t border-border/60 pt-2">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t('versionNumber', { version: activeImage.versionNumber })}</span>
              <span>{images.length} / 5</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageId(img.id)}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border transition-all ${
                    img.id === activeImage.id
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-border/80 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Select iteration ${img.versionNumber}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/posts/${postId}/images/${img.id}`}
                    alt={`Iteration ${img.versionNumber}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {img.isPrimary && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary-600/90 py-0.2 text-[9px] text-center font-bold text-white">
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar: Regenerate button */}
        {onRegenerateClick && (
          <div className="flex items-center justify-end border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={onRegenerateClick}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40 transition-colors"
            >
              <IconSparkles className="h-3.5 w-3.5" />
              <span>{t('regenerateImage')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
