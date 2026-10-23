'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { IconInfoCircle } from '@tabler/icons-react';

export interface ImageCapabilityBannerProps {
  onDismiss?: (() => void) | undefined;
}

export const ImageCapabilityBanner: React.FC<ImageCapabilityBannerProps> = ({
  onDismiss,
}) => {
  const t = useTranslations('Visuals');

  return (
    <div
      role="status"
      className="relative rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/[0.04] dark:text-amber-200"
    >
      <div className="flex items-start gap-3">
        <IconInfoCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            {t('unsupportedTitle')}
          </p>
          <p className="leading-relaxed opacity-90">
            {t('unsupportedDescription')}
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
