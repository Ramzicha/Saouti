'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconCopy, IconCheck, IconExternalLink } from '@tabler/icons-react';

export interface ImageQuotaBannerProps {
  prompt?: string | undefined;
  onDismiss?: (() => void) | undefined;
}

export const ImageQuotaBanner: React.FC<ImageQuotaBannerProps> = ({
  prompt,
  onDismiss,
}) => {
  const t = useTranslations('Visuals');
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="status"
      className="relative rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4 text-xs text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/[0.06] dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <IconAlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-semibold text-amber-950 dark:text-amber-100 text-sm">
              {t('quotaExceededTitle')}
            </p>
            <p className="mt-1 leading-relaxed opacity-90 text-xs">
              {t('quotaExceededDescription')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {prompt && (
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-xs font-medium shadow-sm transition-colors dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                <span>{copied ? t('copiedPrompt') : t('copyArtDirectorPrompt')}</span>
              </button>
            )}

            <a
              href="https://ai.google.dev/gemini-api/docs/rate-limits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline dark:text-amber-300"
            >
              <span>Google Quota Docs</span>
              <IconExternalLink size={12} />
            </a>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 p-1"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
