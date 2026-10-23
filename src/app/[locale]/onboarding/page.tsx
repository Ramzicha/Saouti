'use client';

import React, { useState } from 'react';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';
import { ProfilerChat } from '@/components/profile/ProfilerChat';
import { AppHeader } from '@/components/layout/AppHeader';

export default function OnboardingPage() {
  const [mode, setMode] = useState<'wizard' | 'profiler'>('wizard');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader title="Voice Profile Setup" />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {mode === 'wizard' ? (
          <OnboardingWizard onSwitchToProfiler={() => setMode('profiler')} />
        ) : (
          <ProfilerChat onSwitchToWizard={() => setMode('wizard')} />
        )}
      </main>
    </div>
  );
}
