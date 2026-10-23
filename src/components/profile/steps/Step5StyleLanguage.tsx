'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function Step5StyleLanguage() {
  const t = useTranslations('Onboarding');
  const { register, watch } = useFormContext();

  const selectedLanguage = watch('languages.primaryLanguage');
  const formalityValue = watch('style.formality') || 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('step5Title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('step5Desc')}</p>
      </div>

      <div className="space-y-5">
        {/* Languages & Arabic Dialect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-card border border-border/50">
          <div>
            <label
              htmlFor="lang_primary"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t('languageLabel')}
            </label>
            <select
              id="lang_primary"
              {...register('languages.primaryLanguage')}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="lang_dialect"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t('arabicDialectLabel')}
            </label>
            <select
              id="lang_dialect"
              {...register('languages.arabicDialect')}
              disabled={selectedLanguage !== 'ar'}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-50"
            >
              <option value="none">{t('dialectNone')}</option>
              <option value="darija">{t('dialectDarija')}</option>
              <option value="both">{t('dialectBoth')}</option>
            </select>
          </div>
        </div>

        {/* Formality slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="style_formality"
              className="text-sm font-medium text-foreground"
            >
              {t('formalityLabel')}
            </label>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
              Level {formalityValue} / 5
            </span>
          </div>
          <input
            id="style_formality"
            type="range"
            min="1"
            max="5"
            step="1"
            {...register('style.formality', { valueAsNumber: true })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 (Casual / Conversational)</span>
            <span>5 (Academic / Executive)</span>
          </div>
        </div>

        {/* Post Length */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('lengthLabel')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'short', label: t('lenShort') },
              { id: 'medium', label: t('lenMedium') },
              { id: 'long', label: t('lenLong') },
            ].map((len) => (
              <label
                key={len.id}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-input bg-card hover:bg-muted/50 cursor-pointer text-xs sm:text-sm font-medium"
              >
                <input
                  type="radio"
                  value={len.id}
                  {...register('style.length')}
                  className="w-3.5 h-3.5 text-primary focus:ring-primary border-input"
                />
                <span>{len.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Emoji usage */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('emojiLabel')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'none', label: t('emojiNone') },
              { id: 'minimal', label: t('emojiMinimal') },
              { id: 'frequent', label: t('emojiFrequent') },
            ].map((emo) => (
              <label
                key={emo.id}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-input bg-card hover:bg-muted/50 cursor-pointer text-xs sm:text-sm font-medium"
              >
                <input
                  type="radio"
                  value={emo.id}
                  {...register('style.emoji')}
                  className="w-3.5 h-3.5 text-primary focus:ring-primary border-input"
                />
                <span>{emo.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hook Style */}
        <div>
          <label
            htmlFor="style_hook"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('hookStyleLabel')}
          </label>
          <select
            id="style_hook"
            {...register('style.hookStyle')}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="bold_statement">{t('hookBold')}</option>
            <option value="question">{t('hookQuestion')}</option>
            <option value="story">{t('hookStory')}</option>
            <option value="statistic">{t('hookData')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
