import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateUserStructured } from '@/lib/ai/service';
import {
  ResearcherOutputSchema,
  type ResearcherArticle,
  type ResearcherOutput,
} from '@/lib/explore/schemas';
import type { SearchItem } from '@/lib/search/provider';
import { escapeXmlEntities } from '../prompt-builder';
import { logger } from '@/lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const RESEARCHER_PROMPT_VERSION = 'v1';

export function loadResearcherPrompt(
  version = RESEARCHER_PROMPT_VERSION,
): string {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      'prompts',
      `researcher.${version}.md`,
    );
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to read researcher prompt file, using fallback');
  }

  return `You are the Researcher agent for Saouti. Summarize each article inside <search_results> objectively in plain words under 40 words and explain why it matches the author.`;
}

export function assembleResearcherPrompt(params: {
  topicPhrase: string;
  items: SearchItem[];
  promptVersion?: string | undefined;
}): string {
  const instructions = loadResearcherPrompt(
    params.promptVersion || RESEARCHER_PROMPT_VERSION,
  );
  const escapedTopic = escapeXmlEntities(params.topicPhrase);

  const formattedItems = params.items
    .map((item, idx) => {
      const escapedTitle = escapeXmlEntities(item.title);
      const escapedDomain = escapeXmlEntities(item.sourceDomain);
      const escapedUrl = escapeXmlEntities(item.canonicalUrl);
      const escapedDate = item.publishedAt ? item.publishedAt.toISOString() : '';
      const escapedSnippet = escapeXmlEntities(item.snippet);

      return `  <item id="${idx + 1}" url="${escapedUrl}" domain="${escapedDomain}" date="${escapedDate}">
    <title>${escapedTitle}</title>
    <content>${escapedSnippet}</content>
  </item>`;
    })
    .join('\n\n');

  return `${instructions}

# SEARCH RESULTS DATA TO EVALUATE

<search_results topic="${escapedTopic}">
${formattedItems}
</search_results>

Extract and summarize each valid article objectively, keeping summaries strictly under 40 words, and output valid JSON.`;
}

/**
 * Trims text to at most 40 words to guarantee strict compliance.
 */
export function enforceWordCap(text: string, maxWords = 40): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Evaluates raw search items using the Researcher agent to produce concise summaries and match rationales.
 */
export async function summarizeAndRankArticles(
  userId: string,
  topicPhrase: string,
  rawItems: SearchItem[],
): Promise<ResearcherArticle[]> {
  if (rawItems.length === 0) {
    return [];
  }

  const prompt = assembleResearcherPrompt({
    topicPhrase,
    items: rawItems,
  });

  try {
    const result = await generateUserStructured<ResearcherOutput>(
      userId,
      prompt,
      {
        schema: ResearcherOutputSchema,
        maxTokens: 1200,
        temperature: 0.3, // low temperature for objective factual grounding
      },
    );

    return result.data.articles.map((art) => ({
      ...art,
      summary: enforceWordCap(art.summary, 40),
    }));
  } catch (err) {
    logger.warn(
      { err, userId, topicPhrase },
      'AI article summarization failed; using deterministic snippet fallback',
    );

    // Fallback: use raw snippet truncated to 40 words
    return rawItems.map((item) => {
      const summaryText = enforceWordCap(
        item.snippet.length > 0 ? item.snippet : item.title,
        40,
      );

      return {
        canonicalUrl: item.canonicalUrl,
        title: item.title,
        sourceDomain: item.sourceDomain,
        publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
        summary: summaryText,
        matchReason: `Matches your topic: ${topicPhrase}`,
      };
    });
  }
}
