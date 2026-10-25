'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { IconPlus, IconTrash, IconFileText } from '@tabler/icons-react';
import { countWords } from '@/lib/profile/schemas';
import clsx from 'clsx';

export function Step6VoiceSamples() {
  const t = useTranslations('Onboarding');
  const { register, control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'samples',
  });

  const watchedSamples = watch('samples') || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t('step6Title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('step6Desc')}</p>
        </div>
        {fields.length < 5 && (
          <button
            type="button"
            onClick={() => append({ title: `Sample ${fields.length + 1}`, content: '' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised text-foreground text-xs font-medium hover:bg-surface transition-colors"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>{t('addSample')}</span>
          </button>
        )}
      </div>

      <div className="space-y-5">
        {fields.map((field, index) => {
          const content = watchedSamples[index]?.content || '';
          const words = countWords(content);
          const isTooShort = content.length > 0 && words < 50;
          const isTooLong = words > 1000;
          const isValid = words >= 50 && words <= 1000;

          return (
            <div
              key={field.id}
              className="p-4 rounded-xl border border-input bg-card/60 space-y-3 relative group transition-all"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IconFileText className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    {...register(`samples.${index}.title` as const)}
                    placeholder={`Sample ${index + 1} Title`}
                    className="text-sm font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-border rounded px-1"
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t('removeSample')}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <textarea
                  rows={6}
                  {...register(`samples.${index}.content` as const)}
                  placeholder={t('sampleContentLabel')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-border shadow-sm resize-y"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span
                  className={clsx(
                    'font-medium',
                    words === 0 && 'text-muted-foreground',
                    isValid && 'text-green-600 dark:text-green-400',
                    (isTooShort || isTooLong) && 'text-destructive',
                  )}
                >
                  {words} / 1,000 words
                  {isTooShort && ` (${t('sampleTooShort')})`}
                  {isTooLong && ` (${t('sampleTooLong')})`}
                </span>
                <span className="text-muted-foreground">Min 50 words</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
