'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import {
  IconUser,
  IconShieldLock,
  IconUsers,
  IconTargetArrow,
  IconPencil,
  IconFileText,
  IconShare,
  IconCheck,
} from '@tabler/icons-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onSelectStep?: (step: number) => void;
}

const STEP_ICONS = [
  IconUser,
  IconShieldLock,
  IconUsers,
  IconTargetArrow,
  IconPencil,
  IconFileText,
  IconShare,
];

export function StepIndicator({
  currentStep,
  totalSteps = 7,
  onSelectStep,
}: StepIndicatorProps) {
  const t = useTranslations('Onboarding');

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Onboarding Progress"
      className="w-full py-4 mb-6 border-b border-border/40"
    >
      <ol className="flex items-center justify-between w-full relative">
        {/* Background Connecting Bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-muted -z-0"
          aria-hidden="true"
        >
          <div
            className="h-full bg-foreground/70 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step) => {
          const Icon = STEP_ICONS[step - 1] || IconUser;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          type StepTitleKey =
            | 'step1Title'
            | 'step2Title'
            | 'step3Title'
            | 'step4Title'
            | 'step5Title'
            | 'step6Title'
            | 'step7Title';
          const stepTitle = t(`step${step}Title` as StepTitleKey);

          return (
            <li key={step} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => onSelectStep?.(step)}
                aria-current={isCurrent ? 'step' : undefined}
                className={clsx(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-foreground/40 focus:ring-offset-2',
                  isCurrent &&
                    'bg-button text-on-button ring-2 ring-foreground/40 ring-offset-2 ring-offset-background shadow-md',
                  isCompleted &&
                    'bg-surface-raised text-foreground hover:bg-surface-raised/80 border border-border',
                  !isCurrent &&
                    !isCompleted &&
                    'bg-background text-muted-foreground border border-muted',
                )}
              >
                {isCompleted ? (
                  <IconCheck className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <Icon className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  Step {step}: {stepTitle}
                </span>
              </button>
              <span
                className={clsx(
                  'hidden md:block mt-1.5 text-xs text-center max-w-[80px] truncate font-medium',
                  isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}
                title={stepTitle}
              >
                {stepTitle}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
