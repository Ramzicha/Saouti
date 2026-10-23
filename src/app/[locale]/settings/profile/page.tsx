import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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

  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? IconChevronRight : IconChevronLeft;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="w-4 h-4" aria-hidden="true" />
            <span>Workspace</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <Link
            href={`/${locale}/settings/account`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-xs font-semibold text-foreground">Voice Profile</span>
        </div>

        <ProfileSettingsView />
      </div>
    </div>
  );
}
