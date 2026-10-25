import React from 'react';
import { KeySetupDialog, type KeySummary } from '@/components/keys/KeySetupDialog';
import { KeyCreationGuide } from '@/components/keys/KeyCreationGuide';
import { UsageIndicator } from '@/components/keys/UsageIndicator';
import { TavilyKeySettingsCard, type TavilyKeyInfo } from '@/components/settings/TavilyKeySettingsCard';
import { ModelSelector } from '@/components/keys/ModelSelector';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { SettingsNav } from '@/components/settings/SettingsNav';

interface KeysSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function KeysSettingsPage({ params }: KeysSettingsPageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  // Fetch initial Gemini key state server-side
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

  // Fetch initial Tavily search key state server-side
  const tavilyRecords = await db
    .select({
      provider: apiKeys.provider,
      lastFour: apiKeys.lastFour,
      status: apiKeys.status,
      lastValidatedAt: apiKeys.lastValidatedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, 'tavily')))
    .limit(1);

  const initialTavilyKey: TavilyKeyInfo | null = tavilyRecords[0]
    ? {
        provider: 'tavily',
        lastFour: tavilyRecords[0].lastFour,
        status: tavilyRecords[0].status,
        lastValidatedAt: tavilyRecords[0].lastValidatedAt?.toISOString() || null,
      }
    : null;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <SettingsNav activeTab="keys" />

        <KeySetupDialog initialKey={initialKey} />

        <TavilyKeySettingsCard initialKey={initialTavilyKey} />

        <ModelSelector />

        <UsageIndicator />

        <KeyCreationGuide />
      </div>
    </div>
  );
}
