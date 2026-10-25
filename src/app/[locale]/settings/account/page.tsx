import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
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
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <SettingsNav activeTab="profile" />
        <UserProfileSettingsView />
      </div>
    </div>
  );
}
