'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  IconUser,
  IconEye,
  IconHistory,
  IconDeviceFloppy,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconFileText,
} from '@tabler/icons-react';
import clsx from 'clsx';
import { CompletenessMeter } from './CompletenessMeter';
import { AgentPromptPreview } from './AgentPromptPreview';
import { RevisionHistoryList } from './RevisionHistoryList';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Principles } from './steps/Step2Principles';
import { Step3Audience } from './steps/Step3Audience';
import { Step4Objectives } from './steps/Step4Objectives';
import { Step5StyleLanguage } from './steps/Step5StyleLanguage';
import { Step6VoiceSamples } from './steps/Step6VoiceSamples';
import { Step7Platforms } from './steps/Step7Platforms';
import { DocumentsManagerView } from './documents/DocumentsManagerView';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';

interface ProfileFormValues {
  identity?: {
    role?: string;
    industry?: string;
    expertiseRaw?: string;
    positioning?: string;
  };
  principles?: {
    valuesRaw?: string;
    topicsAvoidRaw?: string;
    toneRedLinesRaw?: string;
  };
  audience?: {
    persona?: string;
    expertiseLevel?: 'general' | 'beginner' | 'intermediate' | 'expert';
    interestsRaw?: string;
  };
  objectives?: {
    primaryObjective?: 'authority' | 'leads' | 'hiring' | 'community' | 'sales';
  };
  style?: {
    formality?: number;
    length?: 'short' | 'medium' | 'long';
    emoji?: 'none' | 'minimal' | 'frequent';
    hookStyle?: 'bold_statement' | 'question' | 'story' | 'statistic';
  };
  languages?: {
    primaryLanguage?: 'en' | 'fr' | 'ar';
    arabicDialect?: 'none' | 'msa' | 'darija' | 'both';
  };
  samples?: Array<{ title?: string; content?: string }>;
  platformSelection?: string[];
  redditSubreddits?: Array<{ name?: string; rulesSummary?: string }>;
}

export function ProfileSettingsView() {
  const t = useTranslations('Profile');
  const tOnboarding = useTranslations('Onboarding');
  const tDocs = useTranslations('Documents');

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'versions' | 'documents'>('editor');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<ProfileFormValues>({
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

  const { reset, handleSubmit, watch } = methods;
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
    samplesCount:
      watchedValues.samples?.filter((s) => s.content && s.content.trim().length > 0).length || 0,
    platformsCount: watchedValues.platformSelection?.length || 0,
    hasRedditRules: watchedValues.redditSubreddits?.some(
      (r) => r.rulesSummary && r.rulesSummary.trim().length > 0,
    ),
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await res.json();
      if (data.profile) {
        const p = data.profile;
        const samples = data.samples || [];
        const platforms = data.platforms || [];

        interface PlatformItem {
          platform: string;
          subreddits?: Array<{ name: string; rulesSummary?: string }>;
        }
        interface SampleItem {
          title?: string;
          content: string;
        }

        const reddit = (platforms as PlatformItem[]).find((pl) => pl.platform === 'reddit');
        const redditSubs =
          reddit?.subreddits && reddit.subreddits.length > 0
            ? reddit.subreddits
            : [{ name: 'r/', rulesSummary: '' }];

        reset({
          identity: {
            role: p.identityData?.role || '',
            industry: p.identityData?.industry || '',
            expertiseRaw: (p.identityData?.expertise || []).join(', '),
            positioning: p.identityData?.positioning || '',
          },
          principles: {
            valuesRaw: (p.principlesData?.values || []).join(', '),
            topicsAvoidRaw: (p.principlesData?.topicsToAvoid || []).join(', '),
            toneRedLinesRaw: (p.principlesData?.toneRedLines || []).join(', '),
          },
          audience: {
            persona: p.audienceData?.persona || '',
            expertiseLevel: p.audienceData?.expertiseLevel || 'general',
            interestsRaw: (p.audienceData?.interests || []).join(', '),
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
            samples.length > 0
              ? (samples as SampleItem[]).map((s) => ({ title: s.title || '', content: s.content }))
              : [{ title: 'Writing Sample 1', content: '' }],
          platformSelection: (platforms as PlatformItem[]).map((pl) => pl.platform),
          redditSubreddits: redditSubs,
        });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onSave = async (values: ProfileFormValues) => {
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload = {
        identity: {
          role: values.identity?.role || '',
          industry: values.identity?.industry || '',
          expertise: values.identity?.expertiseRaw
            ? values.identity.expertiseRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          positioning: values.identity?.positioning || '',
        },
        principles: {
          values: values.principles?.valuesRaw
            ? values.principles.valuesRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          topicsToAvoid: values.principles?.topicsAvoidRaw
            ? values.principles.topicsAvoidRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          toneRedLines: values.principles?.toneRedLinesRaw
            ? values.principles.toneRedLinesRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        },
        audience: {
          persona: values.audience?.persona || '',
          expertiseLevel: values.audience?.expertiseLevel || 'general',
          interests: values.audience?.interestsRaw
            ? values.audience.interestsRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        },
        objectives: {
          primaryObjective: values.objectives?.primaryObjective || 'authority',
        },
        style: {
          formality: Number(values.style?.formality || 3),
          length: values.style?.length || 'medium',
          emoji: values.style?.emoji || 'minimal',
          hookStyle: values.style?.hookStyle || 'bold_statement',
        },
        languages: {
          primaryLanguage: values.languages?.primaryLanguage || 'en',
          arabicDialect: values.languages?.arabicDialect || 'none',
        },
        samples:
          values.samples?.filter((s) => s.content && s.content.trim().length > 0) || [],
        platforms:
          values.platformSelection?.map((platform: string) => ({
            platform,
            primaryObjective: values.objectives?.primaryObjective || 'authority',
            subreddits:
              platform === 'reddit'
                ? values.redditSubreddits?.filter((r) => r.name && r.name !== 'r/')
                : undefined,
          })) || [],
        changeSummary: 'Updated profile settings',
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to save changes');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground gap-2">
        <IconLoader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span>Loading voice profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      {/* Completeness Meter */}
      <CompletenessMeter
        score={completeness.score}
        level={completeness.level}
        tip={completeness.nextTip}
      />

      {/* Tab Switcher */}
      <div className="flex border-b border-border/60 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-[1px]',
            activeTab === 'editor'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <IconUser className="w-4 h-4" />
          <span>{t('tabEdit')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-[1px]',
            activeTab === 'preview'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <IconEye className="w-4 h-4" />
          <span>{t('tabPreview')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('versions')}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-[1px]',
            activeTab === 'versions'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <IconHistory className="w-4 h-4" />
          <span>{t('tabVersions')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-[1px]',
            activeTab === 'documents'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <IconFileText className="w-4 h-4" />
          <span>{tDocs('tabTitle')}</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-3 text-sm">
          <IconAlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl border border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-3 text-sm animate-in fade-in duration-200">
          <IconCheck className="w-5 h-5 shrink-0" />
          <span>{t('savedSuccess')}</span>
        </div>
      )}

      {/* Tab 1: Profile Editor */}
      {activeTab === 'editor' && (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-8">
            <div className="space-y-8 bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/60">
              <Step1Identity />
              <div className="border-t border-border/40 pt-6">
                <Step2Principles />
              </div>
              <div className="border-t border-border/40 pt-6">
                <Step3Audience />
              </div>
              <div className="border-t border-border/40 pt-6">
                <Step4Objectives />
              </div>
              <div className="border-t border-border/40 pt-6">
                <Step5StyleLanguage />
              </div>
              <div className="border-t border-border/40 pt-6">
                <Step6VoiceSamples />
              </div>
              <div className="border-t border-border/40 pt-6">
                <Step7Platforms />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="sticky bottom-4 z-10 p-4 bg-background/90 backdrop-blur-md rounded-xl border border-border/80 shadow-lg flex justify-end items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-button text-on-button font-semibold text-sm shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconDeviceFloppy className="w-4 h-4" />
                )}
                <span>{saving ? tOnboarding('saving') : t('saveChanges')}</span>
              </button>
            </div>
          </form>
        </FormProvider>
      )}

      {/* Tab 2: Agent View Preview */}
      {activeTab === 'preview' && (
        <div className="bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/60">
          <AgentPromptPreview />
        </div>
      )}

      {/* Tab 3: Revision History */}
      {activeTab === 'versions' && (
        <div className="bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/60">
          <RevisionHistoryList onRollbackComplete={loadProfile} />
        </div>
      )}

      {/* Tab 4: Profile Documents */}
      {activeTab === 'documents' && (
        <div className="bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/60">
          <DocumentsManagerView />
        </div>
      )}
    </div>
  );
}
