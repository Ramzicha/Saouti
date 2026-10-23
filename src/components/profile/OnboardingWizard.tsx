'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './StepIndicator';
import { CompletenessMeter } from './CompletenessMeter';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Principles } from './steps/Step2Principles';
import { Step3Audience } from './steps/Step3Audience';
import { Step4Objectives } from './steps/Step4Objectives';
import { Step5StyleLanguage } from './steps/Step5StyleLanguage';
import { Step6VoiceSamples } from './steps/Step6VoiceSamples';
import { Step7Platforms } from './steps/Step7Platforms';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDeviceFloppy,
  IconRobot,
  IconAlertCircle,
  IconLoader2,
} from '@tabler/icons-react';

interface OnboardingWizardProps {
  onSwitchToProfiler?: () => void;
}

export function OnboardingWizard({ onSwitchToProfiler }: OnboardingWizardProps) {
  const t = useTranslations('Onboarding');
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  const methods = useForm({
    defaultValues: {
      identity: {
        role: '',
        industry: '',
        expertiseRaw: '',
        positioning: '',
      },
      principles: {
        valuesRaw: '',
        topicsAvoidRaw: '',
        toneRedLinesRaw: '',
      },
      audience: {
        persona: '',
        expertiseLevel: 'general',
        interestsRaw: '',
      },
      objectives: {
        primaryObjective: 'authority',
      },
      style: {
        formality: 3,
        length: 'medium',
        emoji: 'minimal',
        hookStyle: 'bold_statement',
      },
      languages: {
        primaryLanguage: 'en',
        arabicDialect: 'none',
      },
      samples: [
        {
          title: 'Writing Sample 1',
          content: '',
        },
      ],
      platformSelection: ['linkedin'],
      redditSubreddits: [{ name: 'r/', rulesSummary: '' }],
    },
  });

  const { reset, getValues, watch } = methods;
  const watchedValues = watch();

  const completeness = calculateProfileCompleteness({
    role: watchedValues.identity?.role,
    identityData: {
      role: watchedValues.identity?.role,
      industry: watchedValues.identity?.industry,
      expertise: watchedValues.identity?.expertiseRaw
        ? watchedValues.identity.expertiseRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      positioning: watchedValues.identity?.positioning,
    },
    principlesData: {
      values: watchedValues.principles?.valuesRaw
        ? watchedValues.principles.valuesRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      topicsToAvoid: watchedValues.principles?.topicsAvoidRaw
        ? watchedValues.principles.topicsAvoidRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      toneRedLines: watchedValues.principles?.toneRedLinesRaw
        ? watchedValues.principles.toneRedLinesRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    },
    audienceData: {
      persona: watchedValues.audience?.persona,
      expertiseLevel: watchedValues.audience?.expertiseLevel,
      interests: watchedValues.audience?.interestsRaw
        ? watchedValues.audience.interestsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    },
    objectivesData: {
      primaryObjective: watchedValues.objectives?.primaryObjective,
    },
    styleData: {
      formality: watchedValues.style?.formality,
      length: watchedValues.style?.length,
      emoji: watchedValues.style?.emoji,
      hookStyle: watchedValues.style?.hookStyle,
    },
    samplesCount: watchedValues.samples?.filter((s) => s.content && s.content.trim().length > 0).length || 0,
    platformsCount: watchedValues.platformSelection?.length || 0,
    hasRedditRules: watchedValues.redditSubreddits?.some((r) => r.rulesSummary && r.rulesSummary.trim().length > 0),
  });

  // Load existing draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch('/api/profile/draft');
        if (!res.ok) {
          setLoadingDraft(false);
          return;
        }
        const data = await res.json();
        if (data.hasDraft && data.profile) {
          const p = data.profile;
          reset({
            identity: {
              role: p.identityData?.role || '',
              industry: p.identityData?.industry || '',
              expertiseRaw: p.identityData?.expertise?.join(', ') || '',
              positioning: p.identityData?.positioning || '',
            },
            principles: {
              valuesRaw: p.principlesData?.values?.join(', ') || '',
              topicsAvoidRaw: p.principlesData?.topicsToAvoid?.join(', ') || '',
              toneRedLinesRaw: p.principlesData?.toneRedLines?.join(', ') || '',
            },
            audience: {
              persona: p.audienceData?.persona || '',
              expertiseLevel: p.audienceData?.expertiseLevel || 'general',
              interestsRaw: p.audienceData?.interests?.join(', ') || '',
            },
            objectives: {
              primaryObjective: p.objectivesData?.primaryObjective || 'authority',
            },
            style: {
              formality: p.styleData?.formality ?? 3,
              length: p.styleData?.length || 'medium',
              emoji: p.styleData?.emoji || 'minimal',
              hookStyle: p.styleData?.hookStyle || 'bold_statement',
            },
            languages: {
              primaryLanguage: p.primaryLanguage || 'en',
              arabicDialect: p.arabicDialect || 'none',
            },
            samples:
              data.samples && data.samples.length > 0
                ? data.samples
                : [{ title: 'Writing Sample 1', content: '' }],
            platformSelection:
              data.platforms && data.platforms.length > 0
                ? data.platforms.map((pl: { platform: string }) => pl.platform)
                : ['linkedin'],
            redditSubreddits:
              data.platforms?.find(
                (pl: { platform: string; subreddits?: Array<{ name: string; rulesSummary?: string }> }) =>
                  pl.platform === 'reddit',
              )?.subreddits || [{ name: 'r/', rulesSummary: '' }],
          });
          if (p.currentStep && p.currentStep <= 7) {
            setCurrentStep(p.currentStep);
          }
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      } finally {
        setLoadingDraft(false);
      }
    }
    loadDraft();
  }, [reset]);

  const saveCurrentStepDraft = useCallback(
    async (stepNumber: number) => {
      setSavingDraft(true);
      setErrorMessage(null);
      const values = getValues();

      const payload: Record<string, unknown> = {
        step: stepNumber,
      };

      if (stepNumber === 1) {
        payload.identity = {
          role: values.identity.role,
          industry: values.identity.industry,
          expertise: values.identity.expertiseRaw
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          positioning: values.identity.positioning,
        };
      } else if (stepNumber === 2) {
        payload.principles = {
          values: values.principles.valuesRaw
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          topicsToAvoid: values.principles.topicsAvoidRaw
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          toneRedLines: values.principles.toneRedLinesRaw
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        };
      } else if (stepNumber === 3) {
        payload.audience = {
          persona: values.audience.persona,
          expertiseLevel: values.audience.expertiseLevel,
          interests: values.audience.interestsRaw
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        };
      } else if (stepNumber === 4) {
        payload.objectives = {
          primaryObjective: values.objectives.primaryObjective,
        };
      } else if (stepNumber === 5) {
        payload.style = values.style;
        payload.languages = values.languages;
      } else if (stepNumber === 6) {
        payload.samples = values.samples;
      } else if (stepNumber === 7) {
        payload.platforms = values.platformSelection.map((platformKey) => {
          if (platformKey === 'reddit') {
            return {
              platform: 'reddit',
              primaryObjective: values.objectives.primaryObjective || 'authority',
              subreddits: values.redditSubreddits.filter(
                (sub) => sub.name && sub.name !== 'r/',
              ),
            };
          }
          return {
            platform: platformKey,
            primaryObjective: values.objectives.primaryObjective || 'authority',
          };
        });
      }

      try {
        const res = await fetch('/api/profile/draft/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to save draft');
        }

        setDraftSavedToast(true);
        setTimeout(() => setDraftSavedToast(false), 2500);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error saving draft');
      } finally {
        setSavingDraft(false);
      }
    },
    [getValues],
  );

  const handleNext = async () => {
    // If on Step 1, ensure role is non-empty
    if (currentStep === 1) {
      const role = getValues('identity.role');
      if (!role || role.trim().length < 2) {
        setErrorMessage('Professional role is required to continue.');
        return;
      }
    }

    await saveCurrentStepDraft(currentStep);
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setErrorMessage(null);

    // Save final step first
    await saveCurrentStepDraft(7);

    try {
      const res = await fetch('/api/profile/activate', {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Activation failed');
      }

      // Profile activated successfully! Redirect to workspace
      router.push('/');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to activate voice profile.',
      );
      setActivating(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your voice profile...</p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 bg-card rounded-2xl border border-border/60 shadow-lg relative">
        {/* Header with Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
          </div>
          {onSwitchToProfiler && (
            <button
              type="button"
              onClick={onSwitchToProfiler}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all shrink-0"
            >
              <IconRobot className="w-4 h-4" />
              <span>{t('orInterview')}</span>
            </button>
          )}
        </div>

        {/* Step Stepper */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={7}
          onSelectStep={(step) => {
            saveCurrentStepDraft(currentStep);
            setCurrentStep(step);
          }}
        />

        {/* Live Completeness Meter */}
        <div className="mb-6">
          <CompletenessMeter
            score={completeness.score}
            level={completeness.level}
            tip={completeness.nextTip}
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-3 text-sm">
            <IconAlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Active Step Content */}
        <div className="min-h-[340px] py-2">
          {currentStep === 1 && <Step1Identity />}
          {currentStep === 2 && <Step2Principles />}
          {currentStep === 3 && <Step3Audience />}
          {currentStep === 4 && <Step4Objectives />}
          {currentStep === 5 && <Step5StyleLanguage />}
          {currentStep === 6 && <Step6VoiceSamples />}
          {currentStep === 7 && <Step7Platforms />}
        </div>

        {/* Navigation & Actions Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-6 border-t border-border/40">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                <span>{t('back')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => saveCurrentStepDraft(currentStep)}
              disabled={savingDraft}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
            >
              {draftSavedToast ? (
                <IconCheck className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <IconDeviceFloppy className="w-3.5 h-3.5" />
              )}
              <span>
                {savingDraft
                  ? t('saving')
                  : draftSavedToast
                    ? 'Saved'
                    : t('draftSaved')}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={savingDraft}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md w-full sm:w-auto"
              >
                <span>{t('next')}</span>
                <IconArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={activating || savingDraft}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md w-full sm:w-auto"
              >
                {activating ? (
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconCheck className="w-4 h-4" />
                )}
                <span>{t('activate')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Fast-Track Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">{t('fastTrackNote')}</p>
        </div>
      </div>
    </FormProvider>
  );
}
