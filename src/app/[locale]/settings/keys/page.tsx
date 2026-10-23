import React from 'react';
import { KeySetupDialog, type KeySummary } from '@/components/keys/KeySetupDialog';
import { KeyCreationGuide } from '@/components/keys/KeyCreationGuide';
import { UsageIndicator } from '@/components/keys/UsageIndicator';
import { ModelSelector } from '@/components/keys/ModelSelector';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface KeysSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function KeysSettingsPage({ params }: KeysSettingsPageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  // Fetch initial key state server-side
  const records = await db
    .select({
      provider: apiKeys.provider,
      lastFour: apiKeys.lastFour,
      status: apiKeys.status,
      lastValidatedAt: apiKeys.lastValidatedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, 'gemini')))
    .limit(1);

  const initialKey: KeySummary | null = records[0]
    ? {
        provider: 'gemini',
        lastFour: records[0].lastFour,
        status: records[0].status as KeySummary['status'],
        lastValidatedAt: records[0].lastValidatedAt?.toISOString() || null,
        createdAt: records[0].createdAt.toISOString(),
      }
    : null;

  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? IconChevronRight : IconChevronLeft;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/settings/account`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="w-4 h-4" aria-hidden="true" />
            <span>Settings</span>
          </Link>
        </div>

        <KeySetupDialog initialKey={initialKey} />

        <ModelSelector />

        <UsageIndicator />

        <KeyCreationGuide />
      </div>
    </div>
  );
}
