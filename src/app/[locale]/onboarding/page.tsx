'use client';

import React, { useState, useEffect } from 'react';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';
import { ProfilerChat } from '@/components/profile/ProfilerChat';
import { AppHeader } from '@/components/layout/AppHeader';
import { TavilyKeyStep } from '@/components/onboarding/TavilyKeyStep';

export default function OnboardingPage() {
  const [stage, setStage] = useState<'loading' | 'tavily' | 'profile'>('loading');
  const [mode, setMode] = useState<'wizard' | 'profiler'>('wizard');

  useEffect(() => {
    // Check if the user already has a Tavily key configured
    fetch('/api/settings/keys/tavily')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.hasKey) {
          setStage('profile');
        } else {
          setStage('tavily');
        }
      })
      .catch(() => {
        setStage('profile');
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader title="Onboarding" />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {stage === 'loading' ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : stage === 'tavily' ? (
          <TavilyKeyStep
            onNext={() => setStage('profile')}
            onSkip={() => setStage('profile')}
          />
        ) : mode === 'wizard' ? (
          <OnboardingWizard onSwitchToProfiler={() => setMode('profiler')} />
        ) : (
          <ProfilerChat onSwitchToWizard={() => setMode('wizard')} />
        )}
      </main>
    </div>
  );
}
