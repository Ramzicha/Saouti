import { db } from '@/lib/db/client';
import {
  articles,
  savedArticles,
  articleDismissals,
  topics,
  searchUsageCounters,
  type Article,
} from '@/lib/db/schema';
import { eq, and, desc, notInArray, gt, sql } from 'drizzle-orm';
import { searchPipeline } from '@/lib/search/pipeline';
import { summarizeAndRankArticles } from '@/lib/agent-engine/agents/researcher';
import { recordSearchUsage } from '@/lib/explore/quota-guard';
import { logger } from '@/lib/logger';

export interface FeedResponse {
  articles: Article[];
  sourceProvider: 'tavily' | 'feed' | 'gemini_grounding';
  fallbackNotice: string | null;
  savedUrls: string[];
}

export class ExploreService {
  /**
   * Retrieves active feed articles for a user and topic, filtering out dismissed items.
   */
  async getFeedArticles(
    userId: string,
    topicPhrase?: string,
    filters?: { freshness?: 'day' | 'week' | 'month'; language?: 'en' | 'fr' | 'ar' },
  ): Promise<FeedResponse> {
    const now = new Date();

    // 1. Get dismissed URLs
    const dismissedRecords = await db
      .select({ canonicalUrl: articleDismissals.canonicalUrl })
      .from(articleDismissals)
      .where(eq(articleDismissals.userId, userId));
    const dismissedUrls = dismissedRecords.map((d) => d.canonicalUrl);

    // 2. Get saved URLs to show bookmark status
    const savedRecords = await db
      .select({ canonicalUrl: savedArticles.canonicalUrl })
      .from(savedArticles)
      .where(eq(savedArticles.userId, userId));
    const savedUrls = savedRecords.map((s) => s.canonicalUrl);

    // 3. Query active cached articles
    const conditions = [
      eq(articles.userId, userId),
      gt(articles.cachedUntil, now),
    ];

    if (topicPhrase && topicPhrase.trim().length > 0) {
      conditions.push(eq(articles.topicPhrase, topicPhrase.trim()));
    }

    if (filters?.freshness) {
      const ms =
        filters.freshness === 'day'
          ? 24 * 3600 * 1000
          : filters.freshness === 'month'
            ? 30 * 24 * 3600 * 1000
            : 7 * 24 * 3600 * 1000;
      const minDate = new Date(Date.now() - ms);
      conditions.push(gt(articles.publishedAt, minDate));
    }

    if (dismissedUrls.length > 0) {
      conditions.push(notInArray(articles.canonicalUrl, dismissedUrls));
    }

    const cachedList = await db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.createdAt))
      .limit(20);

    return {
      articles: cachedList,
      sourceProvider: 'tavily',
      fallbackNotice: null,
      savedUrls,
    };
  }

  /**
   * Dispatches search, invokes the Researcher agent, and caches results.
   */
  async refreshFeedForTopic(
    userId: string,
    topicPhrase: string,
    filters?: { freshness?: 'day' | 'week' | 'month'; language?: 'en' | 'fr' | 'ar' },
  ): Promise<FeedResponse> {
    const normalizedTopic = topicPhrase.trim();

    // 1. Execute search pipeline
    const searchOptions: { query: string; limit: number; freshness?: 'day' | 'week' | 'month'; language?: 'en' | 'fr' | 'ar' } = {
      query: normalizedTopic,
      limit: 7,
    };
    if (filters?.freshness) searchOptions.freshness = filters.freshness;
    if (filters?.language) searchOptions.language = filters.language;

    const searchResult = await searchPipeline.executeSearch(userId, searchOptions);

    // 2. Filter out already dismissed items
    const dismissedRecords = await db
      .select({ canonicalUrl: articleDismissals.canonicalUrl })
      .from(articleDismissals)
      .where(eq(articleDismissals.userId, userId));
    const dismissedSet = new Set(dismissedRecords.map((d) => d.canonicalUrl));

    const freshItems = searchResult.items.filter(
      (item) => !dismissedSet.has(item.canonicalUrl),
    );

    // 3. Run Researcher agent for concise summaries and profile matching
    const summarizedArticles = await summarizeAndRankArticles(
      userId,
      normalizedTopic,
      freshItems,
    );

    // 4. Cache articles in DB for 24 hours
    const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const savedArticlesList: Article[] = [];

    for (const art of summarizedArticles) {
      try {
        const inserted = await db
          .insert(articles)
          .values({
            userId,
            canonicalUrl: art.canonicalUrl,
            title: art.title,
            sourceDomain: art.sourceDomain,
            publishedAt: art.publishedAt ? new Date(art.publishedAt) : null,
            summary: art.summary,
            matchReason: art.matchReason,
            topicPhrase: normalizedTopic,
            cachedUntil,
          })
          .onConflictDoUpdate({
            target: [articles.userId, articles.canonicalUrl],
            set: {
              title: art.title,
              summary: art.summary,
              matchReason: art.matchReason,
              topicPhrase: normalizedTopic,
              cachedUntil,
            },
          })
          .returning();

        if (inserted[0]) {
          savedArticlesList.push(inserted[0]);
        }
      } catch (err) {
        logger.warn({ err, url: art.canonicalUrl }, 'Failed to insert cached article');
      }
    }

    // 5. Track daily and monthly credit usage via Quota Guard
    await recordSearchUsage(
      userId,
      searchResult.sourceProvider === 'tavily' ? 'tavily' : 'feed',
      searchResult.creditsUsed,
    );

    // 6. Get saved URLs to show bookmark status
    const savedRecords = await db
      .select({ canonicalUrl: savedArticles.canonicalUrl })
      .from(savedArticles)
      .where(eq(savedArticles.userId, userId));
    const savedUrls = savedRecords.map((s) => s.canonicalUrl);

    return {
      articles: savedArticlesList,
      sourceProvider: searchResult.sourceProvider,
      fallbackNotice: searchResult.fallbackReason,
      savedUrls,
    };
  }
}

export const exploreService = new ExploreService();
