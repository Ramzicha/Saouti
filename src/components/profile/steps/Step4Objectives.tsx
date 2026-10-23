'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function Step4Objectives() {
  const t = useTranslations('Onboarding');
  const { register } = useFormContext();

  const objectives = [
    { id: 'authority', label: t('objAuthority') },
    { id: 'leads', label: t('objLeads') },
    { id: 'hiring', label: t('objHiring') },
    { id: 'community', label: t('objCommunity') },
    { id: 'sales', label: t('objSales') },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step4Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step4Desc')}</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          {t('primaryObjectiveLabel')}
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {objectives.map((obj) => (
            <label
              key={obj.id}
              className="flex items-center gap-3 p-3.5 rounded-lg border border-input bg-card hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <input
                type="radio"
                value={obj.id}
                {...register('objectives.primaryObjective')}
                className="w-4 h-4 text-primary focus:ring-primary border-input"
              />
              <span className="text-sm font-medium text-foreground">
                {obj.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
