'use client';

import React, { useState, useEffect } from 'react';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { formatPostForClipboard, copyToClipboard } from '@/lib/clipboard';
import { useTranslations } from 'next-intl';

interface CopyButtonProps {
  content: string;
  hashtags?: string[] | undefined;
  className?: string;
  showText?: boolean;
}

export function CopyButton({
  content,
  hashtags = [],
  className = '',
  showText = true,
}: CopyButtonProps) {
  const t = useTranslations('Library');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const formatted = formatPostForClipboard({ content, hashtags });
    const success = await copyToClipboard(formatted);
    if (success) {
      setCopied(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid="copy-post-button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
        copied
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          : 'bg-surface text-foreground hover:bg-surface-elevated border border-border'
      } ${className}`}
      aria-label={copied ? t('copied') : t('copy')}
      title={copied ? t('copied') : t('copy')}
    >
      {copied ? (
        <>
          <IconCheck size={14} className="text-emerald-500" />
          {showText && <span>{t('copied')}</span>}
        </>
      ) : (
        <>
          <IconCopy size={14} className="text-muted-foreground" />
          {showText && <span>{t('copy')}</span>}
        </>
      )}

      {/* Screen reader announcement for accessibility */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? t('copied') : ''}
      </span>
    </button>
  );
}
