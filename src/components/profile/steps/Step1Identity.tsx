'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function Step1Identity() {
  const t = useTranslations('Onboarding');
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step1Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step1Desc')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="identity_role"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('roleLabel')} <span className="text-destructive">*</span>
          </label>
          <input
            id="identity_role"
            type="text"
            {...register('identity.role')}
            placeholder={t('rolePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm"
          />
          {(errors.identity as Record<string, { message?: string }> | undefined)?.role && (
            <p className="text-xs text-destructive mt-1">
              {(errors.identity as Record<string, { message?: string }>).role?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="identity_industry"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('industryLabel')}
          </label>
          <input
            id="identity_industry"
            type="text"
            {...register('identity.industry')}
            placeholder={t('industryPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm"
          />
        </div>

        <div>
          <label
            htmlFor="identity_expertise"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('expertiseLabel')}
          </label>
          <input
            id="identity_expertise"
            type="text"
            {...register('identity.expertiseRaw')}
            placeholder={t('expertisePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate topics with commas.
          </p>
        </div>

        <div>
          <label
            htmlFor="identity_positioning"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('positioningLabel')}
          </label>
          <textarea
            id="identity_positioning"
            rows={3}
            {...register('identity.positioning')}
            placeholder={t('positioningPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
