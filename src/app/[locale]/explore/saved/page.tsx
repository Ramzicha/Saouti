import React from 'react';
import { validateCurrentSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { savedArticles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { AppHeader } from '@/components/layout/AppHeader';
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
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader title="Saved Articles" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <SavedArticlesView initialArticles={initialSaved} />
      </main>
    </div>
  );
}
