'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandReddit,
  IconBrandX,
  IconBrandFacebook,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import clsx from 'clsx';

export function Step7Platforms() {
  const t = useTranslations('Onboarding');
  const { register, watch, control } = useFormContext();

  const selectedPlatforms: string[] = watch('platformSelection') || [];
  const isRedditSelected = selectedPlatforms.includes('reddit');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'redditSubreddits',
  });

  const platformsList = [
    { id: 'linkedin', label: 'LinkedIn', icon: IconBrandLinkedin },
    { id: 'instagram', label: 'Instagram', icon: IconBrandInstagram },
    { id: 'reddit', label: 'Reddit', icon: IconBrandReddit },
    { id: 'x', label: 'X (Twitter)', icon: IconBrandX },
    { id: 'facebook', label: 'Facebook', icon: IconBrandFacebook },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step7Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step7Desc')}</p>
      </div>

      <div className="space-y-5">
        <label className="block text-sm font-medium text-foreground">
          {t('platformsTitle')} <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platformsList.map((p) => {
            const Icon = p.icon;
            const isChecked = selectedPlatforms.includes(p.id);

            return (
              <label
                key={p.id}
                className={clsx(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                  isChecked
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-input bg-card hover:bg-muted/40',
                )}
              >
                <input
                  type="checkbox"
                  value={p.id}
                  {...register('platformSelection')}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-input"
                />
                <Icon className={clsx('w-5 h-5', isChecked ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-sm font-semibold text-foreground">
                  {p.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Reddit specific configuration */}
        {isRedditSelected && (
          <div className="p-4 sm:p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t('subredditsLabel')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Specify where you post and local community etiquette to avoid bans.
                </p>
              </div>
              <button
                type="button"
                onClick={() => append({ name: 'r/', rulesSummary: '' })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>{t('addSubreddit')}</span>
              </button>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2 relative"
              >
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    {...register(`redditSubreddits.${idx}.name` as const)}
                    placeholder={t('subredditName')}
                    className="w-1/2 px-2.5 py-1.5 rounded-md border border-input text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  {...register(`redditSubreddits.${idx}.rulesSummary` as const)}
                  placeholder={t('subredditRules')}
                  className="w-full px-2.5 py-1.5 rounded-md border border-input text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
