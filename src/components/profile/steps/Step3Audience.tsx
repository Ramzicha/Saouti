'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function Step3Audience() {
  const t = useTranslations('Onboarding');
  const { register } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step3Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step3Desc')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="audience_persona"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('audiencePersonaLabel')}
          </label>
          <textarea
            id="audience_persona"
            rows={3}
            {...register('audience.persona')}
            placeholder={t('audiencePersonaPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="audience_level"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('expertiseLevelLabel')}
          </label>
          <select
            id="audience_level"
            {...register('audience.expertiseLevel')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm"
          >
            <option value="general">{t('levelGeneral')}</option>
            <option value="beginner">{t('levelBeginner')}</option>
            <option value="intermediate">{t('levelIntermediate')}</option>
            <option value="expert">{t('levelExpert')}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="audience_interests"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Reader Interests
          </label>
          <input
            id="audience_interests"
            type="text"
            {...register('audience.interestsRaw')}
            placeholder="e.g. System design, Career growth, Cloud costs"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate topics with commas.
          </p>
        </div>
      </div>
    </div>
  );
}
