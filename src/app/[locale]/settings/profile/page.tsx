import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { ProfileSettingsView } from '@/components/profile/ProfileSettingsView';

interface ProfileSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfileSettingsPage({ params }: ProfileSettingsPageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  return (
    <SettingsShell title="Voice Profile">
      <div className="space-y-6">
        <SettingsNav activeTab="voice" />
        <ProfileSettingsView />
      </div>
    </SettingsShell>
  );
}
