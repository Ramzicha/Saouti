'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function Step2Principles() {
  const t = useTranslations('Onboarding');
  const { register } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step2Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step2Desc')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="principles_values"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('valuesLabel')}
          </label>
          <input
            id="principles_values"
            type="text"
            {...register('principles.valuesRaw')}
            placeholder={t('valuesPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate values with commas.
          </p>
        </div>

        <div>
          <label
            htmlFor="principles_topics"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('topicsAvoidLabel')}
          </label>
          <textarea
            id="principles_topics"
            rows={2}
            {...register('principles.topicsAvoidRaw')}
            placeholder={t('topicsAvoidPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="principles_tone"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('toneRedLinesLabel')}
          </label>
          <textarea
            id="principles_tone"
            rows={3}
            {...register('principles.toneRedLinesRaw')}
            placeholder={t('toneRedLinesPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
