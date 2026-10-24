/**
 * Composer Bridge for Explore Articles
 * Connects article discovery cards with the post creation composer workspace.
 */

export interface ComposerArticlePayload {
  title: string;
  sourceDomain: string;
  url: string;
  summary: string;
}

export interface ComposerPreloadState {
  brief: string;
  sourceArticle: ComposerArticlePayload;
  selectedPlatforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'>;
}

export const COMPOSER_PRELOAD_KEY = 'saouti_composer_preload';

/**
 * Generates an authentic starter brief referencing the article and publisher in the active language.
 */
export function generateArticleStarterBrief(
  article: { title: string; sourceDomain: string },
  locale = 'en',
): string {
  const domain = article.sourceDomain.replace(/^www\./i, '');
  const title = article.title.trim();

  switch (locale) {
    case 'fr':
      return `Partagez une perspective authentique sur « ${title} » de ${domain}, en analysant les points essentiels et ce que cela signifie pour notre secteur.`;
    case 'ar':
      return `شارك وجهة نظر مهنية متعمقة حول "${title}" من ${domain}، مع استعراض أهم الأفكار وتأثيرها على مجالنا.`;
    case 'en':
    default:
      return `Share an authentic perspective on "${title}" from ${domain}, discussing the key takeaways and what this means for industry professionals.`;
  }
}

/**
 * Creates the complete composer preload state for an article.
 */
export function createComposerPreloadState(
  article: ComposerArticlePayload,
  locale = 'en',
  platforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'> = ['linkedin', 'x'],
): ComposerPreloadState {
  return {
    brief: generateArticleStarterBrief(article, locale),
    sourceArticle: {
      title: article.title,
      sourceDomain: article.sourceDomain,
      url: article.url,
      summary: article.summary,
    },
    selectedPlatforms: platforms,
  };
}

/**
 * Persists article preload state into sessionStorage for seamless navigation to the composer.
 */
export function setComposerPreload(state: ComposerPreloadState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(COMPOSER_PRELOAD_KEY, JSON.stringify(state));
  } catch {
    // SessionStorage may fail in restricted environments; fail gracefully
  }
}

/**
 * Retrieves and clears the article preload state from sessionStorage.
 */
export function consumeComposerPreload(): ComposerPreloadState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(COMPOSER_PRELOAD_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(COMPOSER_PRELOAD_KEY);
    return JSON.parse(raw) as ComposerPreloadState;
  } catch {
    return null;
  }
}
