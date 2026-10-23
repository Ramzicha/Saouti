'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconPalette,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconEdit,
  IconPhoto,
} from '@tabler/icons-react';
import { copyToClipboard } from '@/lib/clipboard';

export interface ImagePromptCardProps {
  prompt: string;
  aspectRatio?: string | undefined;
  altText?: string | undefined;
  onEdit?: (() => void) | undefined;
  onGenerate?: (() => void) | undefined;
  isGenerating?: boolean | undefined;
  canGenerate?: boolean | undefined;
}

export const ImagePromptCard: React.FC<ImagePromptCardProps> = ({
  prompt,
  aspectRatio = '16:9',
  altText,
  onEdit,
  onGenerate,
  isGenerating = false,
  canGenerate = true,
}) => {
  const t = useTranslations('Visuals');
  const tAgent = useTranslations('Agent');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-primary-500/20 bg-primary-500/[0.03] p-4 text-xs transition-colors dark:border-primary-400/20 dark:bg-primary-400/[0.02]">
      {/* Header with Agent & Ratio Badge */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-primary-700 dark:text-primary-300">
          <IconPalette className="h-4 w-4" />
          <span>{tAgent('art')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* Visual Prompt Text */}
      <p className="mb-2 leading-relaxed text-neutral-800 dark:text-neutral-200">
        &ldquo;{prompt}&rdquo;
      </p>

      {/* Alt Text if available */}
      {altText && (
        <div className="mb-3 rounded-lg bg-neutral-100/60 p-2 text-[11px] text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {t('altText')}:
          </span>{' '}
          {altText}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/60 pt-2.5 dark:border-neutral-800/60">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
          aria-label={t('copyPrompt')}
        >
          {copied ? (
            <>
              <IconCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">{t('promptCopied')}</span>
            </>
          ) : (
            <>
              <IconCopy className="h-3.5 w-3.5" />
              <span>{t('copyPrompt')}</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <IconEdit className="h-3.5 w-3.5" />
              <span>{t('refinementLabel')}</span>
            </button>
          )}

          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !canGenerate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {isGenerating ? (
                <>
                  <IconSparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <IconPhoto className="h-3.5 w-3.5" />
                  <span>{t('generateImage')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
