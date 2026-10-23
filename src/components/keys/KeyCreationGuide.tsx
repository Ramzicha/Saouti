'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconKey,
  IconExternalLink,
  IconDeviceLaptop,
  IconCopy,
} from '@tabler/icons-react';

export function KeyCreationGuide() {
  const t = useTranslations('Keys');

  const steps = [
    {
      number: '1',
      icon: IconDeviceLaptop,
      title: t('step1'),
      description: t('step1Desc'),
      actionLabel: 'aistudio.google.com',
      actionUrl: 'https://aistudio.google.com',
    },
    {
      number: '2',
      icon: IconKey,
      title: t('step2'),
      description: t('step2Desc'),
      actionLabel: null,
      actionUrl: null,
    },
    {
      number: '3',
      icon: IconCopy,
      title: t('step3'),
      description: t('step3Desc'),
      actionLabel: null,
      actionUrl: null,
    },
  ];

  return (
    <section
      aria-labelledby="guide-heading"
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <IconKey className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 id="guide-heading" className="text-base font-semibold text-foreground">
          {t('guideTitle')}
        </h3>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3 list-none p-0 m-0">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.number}
              className="flex flex-col justify-between rounded-lg border border-border/70 bg-muted/40 p-4 space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.number}
                  </span>
                  <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {step.actionUrl && (
                <a
                  href={step.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                >
                  {step.actionLabel}
                  <IconExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
