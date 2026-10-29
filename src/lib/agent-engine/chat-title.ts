/**
 * Automatic chat/run title formatter for Saouti.
 * Generates unique, highly relevant, and concise titles for chats and runs.
 */

export interface ChatTitleArticle {
  title?: string | null | undefined;
  sourceDomain?: string | null | undefined;
  url?: string | null | undefined;
  summary?: string | null | undefined;
  content?: string | null | undefined;
}

export interface ChatTitlePost {
  text?: string | null | undefined;
  platform?: string | null | undefined;
}

export interface ChatTitleContext {
  topicBrief?: string | null | undefined;
  sourceArticle?: ChatTitleArticle | null | undefined;
  posts?: ChatTitlePost[] | null | undefined;
}

/**
 * Extracts or formats a unique, short, human-readable title.
 * Max length is ~30-32 characters to fit cleanly in the sidebar.
 */
export function formatChatTitle(
  topicBriefOrContext?: string | ChatTitleContext | null | undefined,
  maybeSourceArticle?: ChatTitleArticle | null | undefined,
  maybePosts?: ChatTitlePost[] | null | undefined,
): string {
  let topicBrief = '';
  let sourceArticle: ChatTitleArticle | null = null;
  let posts: ChatTitlePost[] | null = null;

  if (topicBriefOrContext && typeof topicBriefOrContext === 'object') {
    topicBrief = topicBriefOrContext.topicBrief || '';
    sourceArticle = topicBriefOrContext.sourceArticle || null;
    posts = topicBriefOrContext.posts || null;
  } else {
    topicBrief = typeof topicBriefOrContext === 'string' ? topicBriefOrContext : '';
    sourceArticle = maybeSourceArticle || null;
    posts = maybePosts || null;
  }

  // 1. If explicit article metadata is present with a title, use it
  if (sourceArticle && typeof sourceArticle.title === 'string' && sourceArticle.title.trim()) {
    const cleaned = cleanArticleTitle(sourceArticle.title);
    if (cleaned) {
      return truncateTitle(cleaned, 30);
    }
  }

  if (!topicBrief || typeof topicBrief !== 'string' || !topicBrief.trim()) {
    const postFallback = extractTitleFromPosts(posts);
    return postFallback || 'Untitled Chat';
  }

  let text = topicBrief.trim();

  // 2. Check for quoted article/subject title inside the brief (e.g. « Title », "Title", “Title”)
  const quoteMatch = text.match(/[«“"']([^»”"']{3,120})[»”"']/);
  if (quoteMatch && quoteMatch[1]) {
    const quotedSubject = cleanArticleTitle(quoteMatch[1]);
    if (quotedSubject && quotedSubject.length >= 3) {
      return truncateTitle(quotedSubject, 30);
    }
  }

  // 3. Strip French / English / Arabic Explore starter brief prefixes
  const exploreStarterPrefixes = [
    // French: "Partagez une perspective (authentique) sur..."
    /^(?:partagez|partager|partage)\s+(?:une\s+perspective(?:\s+authentique)?|une\s+analyse|votre\s+avis)\s+(?:sur|concernant|à\s+propos\s+de)\s*:?\s*/i,
    // English: "Share an (authentic) perspective on..."
    /^(?:share\s+(?:an?\s+)?(?:authentic\s+)?perspective\s+(?:on|about|regarding))\s*:?\s*/i,
    // Arabic: "شارك وجهة نظر (مهنية متعمقة) حول..."
    /^(?:شارك\s+(?:وجهة\s+نظر|رأياً|تحليلاً)(?:\s+مهنية)?(?:\s+متعمقة)?\s+(?:حول|عن|بخصوص))\s*:?\s*/,
  ];

  for (const prefix of exploreStarterPrefixes) {
    if (prefix.test(text)) {
      text = text.replace(prefix, '').trim();
      break;
    }
  }

  // 4. Strip Explore starter brief suffixes (e.g. "de domain.com, en analysant...", "from domain.com...")
  text = text.replace(/\s+(?:de|from|من)\s+[a-z0-9.-]+\.[a-z]{2,}(?:,.*)?$/i, '').trim();
  text = text.replace(/,\s*(?:en\s+analysant|discussing|مع\s+استعراض).*$/i, '').trim();
  text = text.replace(/\s*[:–—]\s*(?:en\s+analysant|discussing|مع\s+استعراض).*$/i, '').trim();

  // 5. Strip common conversational/command prompt prefixes
  const conversationalPrefixes = [
    /^(?:please\s+)?(?:can\s+you\s+)?draft\s+(?:a\s+fresh\s+alternative\s+version\s+of\s+(?:the\s+)?post\s+about:?\s*)/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:write|draft|create|generate|make)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:social\s+media\s+|new\s+)?(?:post|thread|article|content|update)\s+(?:about|on|regarding|discussing):?\s*/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:write|draft|create|generate)\s+(?:about|on|regarding):?\s*/i,
    /^(?:start\s+with\s+(?:something\s+different\s+(?:about|on)?|a\s+post\s+about)?)\s*/i,
    /^(?:start\s+with\s+(?:a\s+fresh\s+topic\s+on)?)\s*/i,
    /^(?:post\s+about|topic:?|brief:?)\s*/i,
    // Arabic prefixes
    /^(?:اكتب\s+(?:لي\s+)?|صغ\s+(?:لي\s+)?|انشئ\s+|قم\s+بكتابة\s+|اعمل\s+)(?:منشور\s+|محتوى\s+|بوست\s+|مقال\s+)?(?:عن|حول|بخصوص):?\s*/,
    // French prefixes
    /^(?:rédige|écris|crée|créer|génère|fais|propose|donne(?:-moi)?)\s+(?:un\s+post|une\s+publication|un\s+texte|un\s+article|du\s+contenu)?\s*(?:sur|concernant|à\s+propos\s+de):?\s*/i,
    /^(?:je\s+veux|peux-tu|pourrais-tu)\s+(?:rédiger|écrire|créer|générer)\s+(?:un\s+post|une\s+publication)?\s*(?:sur|concernant|à\s+propos\s+de):?\s*/i,
  ];

  for (const prefix of conversationalPrefixes) {
    if (prefix.test(text)) {
      text = text.replace(prefix, '').trim();
      break;
    }
  }

  // Strip wrapping quotes again
  text = text.replace(/^["'`“”«»]+|["'`“”«»]+$/g, '').trim();

  // 6. Check if what's left is overly generic filler like "This 1", "This", "Hello", "Testing"
  const isGeneric = /^(?:this\s*\d*|that\s*\d*|test\w*|hello|hi|hey|draft|post|content|something|different)$/i.test(text);

  if (isGeneric) {
    const postFallback = extractTitleFromPosts(posts);
    if (postFallback) {
      return postFallback;
    }
  }

  // Take first sentence / line
  const firstLine = text.split(/\r?\n/)[0]?.trim() || text;
  const firstSentence = firstLine.split(/[.!?؟]\s+/)[0]?.trim() || firstLine;
  const target = firstSentence || text;

  // Clean and format
  const cleanedTarget = cleanArticleTitle(target);
  return truncateTitle(cleanedTarget, 30);
}

function cleanArticleTitle(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Strip HTML entities / tags
  str = str.replace(/<[^>]+>/g, '').replace(/&[a-z0-9#]+;/gi, ' ');

  // Strip trailing site/publisher names: "Google Genie 4 - TechCrunch" or "... | Reuters"
  str = str.replace(/\s+[-–—|]\s+[a-z0-9\s.]+$/i, '').trim();

  // Strip leading site tags: "TechCrunch: Google Genie 4"
  str = str.replace(/^[a-z0-9\s.]+:\s+/i, '').trim();

  // Strip wrapping quotes
  str = str.replace(/^["'`“”«»]+|["'`“”«»]+$/g, '').trim();

  // Capitalize first letter properly
  if (str.length > 0) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str;
}

function extractTitleFromPosts(posts?: ChatTitlePost[] | null): string | null {
  if (!posts || !Array.isArray(posts) || posts.length === 0) return null;
  const post = posts.find((p) => p && typeof p.text === 'string' && p.text.trim());
  if (!post || !post.text) return null;

  let text = post.text.trim();
  // Strip leading greetings / boilerplate in social media posts
  text = text.replace(
    /^(?:we are witnessing (?:a|an)?|in today'?s (?:fast-paced)? world,?|here'?s my take on|excited to share|stop looking for|the world moves fast\.?)\s*/i,
    '',
  );
  text = text.replace(/^[#*>\-\s]+/, '');

  const firstSentence = text.split(/[.\n!?؟]/)[0]?.trim();
  if (firstSentence && firstSentence.length >= 4) {
    return truncateTitle(cleanArticleTitle(firstSentence), 28);
  }
  return null;
}

function truncateTitle(str: string, maxChars = 30): string {
  if (!str) return 'Untitled Chat';
  const trimmed = str.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 14) {
    return `${slice.slice(0, lastSpace).trim()}...`;
  }
  return `${slice}...`;
}
