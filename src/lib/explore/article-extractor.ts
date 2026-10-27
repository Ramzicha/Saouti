import { db } from '@/lib/db/client';
import { articles, savedArticles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getDecryptedKey } from '@/lib/auth/keys';
import { normalizeCanonicalUrl } from '@/lib/search/url-normalizer';
import { logger } from '@/lib/logger';

/**
 * Clean and normalize extracted HTML text to readable plain text.
 */
export function cleanHtmlToText(html: string): string {
  // 1. Remove scripts, styles, noscript, svg, nav, header, footer
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');

  // 2. Prefer <article> or <main> if available
  const articleMatch = text.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch && articleMatch[1] && articleMatch[1].length > 300) {
    text = articleMatch[1];
  } else if (mainMatch && mainMatch[1] && mainMatch[1].length > 300) {
    text = mainMatch[1];
  }

  // 3. Convert paragraphs, line breaks, and list items
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  // 4. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // 5. Clean whitespace
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n');

  return text.trim();
}

/**
 * Extracts the full article text from a URL using Tavily /extract (if API key available)
 * or via server-side direct HTML extraction.
 */
export async function extractArticleContent(
  url: string,
  userId?: string,
): Promise<string | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }

  const normalizedUrl = normalizeCanonicalUrl(url);

  // 1. Check if database already has cached full content
  if (userId) {
    try {
      const cached = await db
        .select({ content: articles.content })
        .from(articles)
        .where(and(eq(articles.userId, userId), eq(articles.canonicalUrl, normalizedUrl)))
        .limit(1);

      if (cached[0]?.content && cached[0].content.trim().length > 150) {
        return cached[0].content.trim();
      }

      const saved = await db
        .select({ content: savedArticles.content })
        .from(savedArticles)
        .where(and(eq(savedArticles.userId, userId), eq(savedArticles.canonicalUrl, normalizedUrl)))
        .limit(1);

      if (saved[0]?.content && saved[0].content.trim().length > 150) {
        return saved[0].content.trim();
      }
    } catch {
      // Continue to live extraction
    }
  }

  // 2. Try Tavily Extract API if user has a configured Tavily key
  if (userId) {
    try {
      const tavilyKey = await getDecryptedKey(userId, 'tavily');
      if (tavilyKey && tavilyKey.startsWith('tvly-') && !tavilyKey.startsWith('tvly-test')) {
        const response = await fetch('https://api.tavily.com/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tavilyKey.trim()}`,
          },
          body: JSON.stringify({
            urls: [url],
            extract_depth: 'basic',
            format: 'markdown',
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data?.results?.[0]?.raw_content;
          if (typeof raw === 'string' && raw.trim().length > 150) {
            const content = raw.trim().slice(0, 20000); // Protect context budget
            await cacheExtractedContent(userId, normalizedUrl, content);
            return content;
          }
        }
      }
    } catch (err) {
      logger.warn({ err, url }, 'Tavily /extract failed, falling back to direct fetch');
    }
  }

  // 3. Fallback: Direct server-side HTTP fetch and HTML text extraction
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (Saouti Content Reader)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en,fr;q=0.9,ar;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();
      const extracted = cleanHtmlToText(html);
      if (extracted.length > 150) {
        const content = extracted.slice(0, 20000);
        if (userId) {
          await cacheExtractedContent(userId, normalizedUrl, content);
        }
        return content;
      }
    }
  } catch (err) {
    logger.warn({ err, url }, 'Direct article HTML fetch failed');
  }

  return null;
}

async function cacheExtractedContent(
  userId: string,
  canonicalUrl: string,
  content: string,
): Promise<void> {
  try {
    await db
      .update(articles)
      .set({ content })
      .where(and(eq(articles.userId, userId), eq(articles.canonicalUrl, canonicalUrl)));

    await db
      .update(savedArticles)
      .set({ content })
      .where(and(eq(savedArticles.userId, userId), eq(savedArticles.canonicalUrl, canonicalUrl)));
  } catch {
    // Non-blocking
  }
}
