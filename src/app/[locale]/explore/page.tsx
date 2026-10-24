import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { topics, articles, apiKeys, users } from '@/lib/db/schema';
import { eq, desc, asc, and, gt } from 'drizzle-orm';
import { AppHeader } from '@/components/layout/AppHeader';
import { ExploreFeedView } from '@/components/explore/ExploreFeedView';

interface ExplorePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ExplorePage({ params }: ExplorePageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  // 1. Fetch user topics
  const initialTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.userId, user.id))
    .orderBy(desc(topics.isPinned), asc(topics.orderIndex), desc(topics.createdAt));

  // 2. Fetch initial cached articles
  const now = new Date();
  const initialArticles = await db
    .select()
    .from(articles)
    .where(and(eq(articles.userId, user.id), gt(articles.cachedUntil, now)))
    .orderBy(desc(articles.createdAt))
    .limit(20);

  // 3. Check if user has Tavily search key configured
  const keyRecords = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, 'tavily')))
    .limit(1);

  const hasTavilyKey = keyRecords.length > 0;

  // 4. Check if user dismissed prompt
  const userRecord = await db
    .select({ hasDismissedTavilyPrompt: users.hasDismissedTavilyPrompt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const hasDismissedPrompt = userRecord[0]?.hasDismissedTavilyPrompt ?? false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader title="Explore" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ExploreFeedView
          initialTopics={initialTopics}
          initialArticles={initialArticles}
          hasTavilyKey={hasTavilyKey}
          hasDismissedPrompt={hasDismissedPrompt}
        />
      </main>
    </div>
  );
}
