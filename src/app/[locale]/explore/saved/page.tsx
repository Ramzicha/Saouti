import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { savedArticles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ExploreShell } from '@/components/explore/ExploreShell';
import { SavedArticlesView } from '@/components/explore/SavedArticlesView';

interface SavedArticlesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SavedArticlesPage({ params }: SavedArticlesPageProps) {
  const { locale } = await params;
  const { session, user } = await validateCurrentSession();

  if (!session || !user) {
    redirect(`/${locale}/login`);
  }

  // Fetch all saved articles for user
  const initialSaved = await db
    .select()
    .from(savedArticles)
    .where(eq(savedArticles.userId, user.id))
    .orderBy(desc(savedArticles.createdAt));

  return (
    <ExploreShell title="Saved Articles">
      <SavedArticlesView initialArticles={initialSaved} />
    </ExploreShell>
  );
}
