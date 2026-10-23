'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';

interface FreeTierNoticeProps {
  acknowledged: boolean;
  onAcknowledgeChange: (acknowledged: boolean) => void;
  disabled?: boolean;
}

export function FreeTierNotice({
  acknowledged,
  onAcknowledgeChange,
  disabled = false,
}: FreeTierNoticeProps) {
  const t = useTranslations('Keys');

  return (
    <div
      role="region"
      aria-label={t('freeTierNoticeTitle')}
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground space-y-3"
    >
      <div className="flex items-start gap-3">
        <IconAlertTriangle
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <h4 className="font-semibold text-amber-600 dark:text-amber-400">
            {t('freeTierNoticeTitle')}
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            {t('freeTierNoticeBody')}
          </p>
          <a
            href="https://ai.google.dev/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline pt-1"
          >
            {t('providerTermsLink')}
            <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-500/20">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAcknowledgeChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
          <span className="text-xs text-foreground font-medium">
            {t('consentCheckbox')}
          </span>
        </label>
      </div>
    </div>
  );
}
