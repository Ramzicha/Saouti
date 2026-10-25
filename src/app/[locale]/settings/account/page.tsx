import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { UserProfileSettingsView } from '@/components/settings/UserProfileSettingsView';

interface AccountSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountSettingsPage({ params }: AccountSettingsPageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  return (
    <SettingsShell title="Settings">
      <div className="space-y-6">
        <SettingsNav activeTab="profile" />
        <UserProfileSettingsView />
      </div>
    </SettingsShell>
  );
}
