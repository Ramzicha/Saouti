/**
 * Platform Formatting Rules & Community Norms
 * Provides guidelines for multi-platform post generation.
 */

export interface PlatformRule {
  platform: string;
  displayName: string;
  maxLength: number;
  recommendedLength: string;
  hashtagLimit: number;
  aspectRatio: string;
  guidelines: string[];
}

export const PLATFORM_RULES: Record<string, PlatformRule> = {
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    maxLength: 3000,
    recommendedLength: '150-300 words',
    hashtagLimit: 3,
    aspectRatio: '16:9',
    guidelines: [
      'Strong opening hook that encourages clicking "see more".',
      'Generous paragraph breaks and whitespace for mobile legibility.',
      'Professional, actionable, thought-leadership tone.',
      'Conclude with an engaging open-ended question.',
      '2-3 relevant hashtags placed at the end.',
    ],
  },
  x: {
    platform: 'x',
    displayName: 'X (Twitter)',
    maxLength: 280,
    recommendedLength: '150-250 characters',
    hashtagLimit: 2,
    aspectRatio: '16:9',
    guidelines: [
      'Direct, high-impact hook in the first sentence.',
      'Concise, punchy phrasing without filler words.',
      'Maximum 1-2 relevant hashtags.',
      'Clear single takeaway or question.',
    ],
  },
  reddit: {
    platform: 'reddit',
    displayName: 'Reddit',
    maxLength: 40000,
    recommendedLength: '200-400 words',
    hashtagLimit: 0,
    aspectRatio: '16:9',
    guidelines: [
      'Zero promotional fluff, buzzwords, or corporate jargon.',
      'Community-first, transparent, conversational voice.',
      'NEVER use hashtags on Reddit.',
      'Present an authentic problem, insight, or open discussion topic.',
      'Respect subreddit-specific community rules.',
    ],
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    maxLength: 2200,
    recommendedLength: '100-200 words',
    hashtagLimit: 5,
    aspectRatio: '1:1',
    guidelines: [
      'Visually evocative and storytelling-driven caption.',
      'Compelling first sentence before the "...more" fold.',
      'Relatable, human, and authentic tone.',
      '3-5 focused hashtags separated from the main caption.',
    ],
  },
  facebook: {
    platform: 'facebook',
    displayName: 'Facebook',
    maxLength: 5000,
    recommendedLength: '100-250 words',
    hashtagLimit: 2,
    aspectRatio: '16:9',
    guidelines: [
      'Warm, conversational, and community-oriented tone.',
      'Encourages peer comments, shared experiences, or feedback.',
      'Accessible phrasing suitable for a broad audience.',
    ],
  },
};

/**
 * Returns formatted platform guidelines string to include in XML prompt context.
 */
export function formatPlatformRules(
  platforms: string[],
  subredditContext?: Array<{ name: string; rules?: string | undefined }> | undefined,
): string {
  const parts: string[] = [];

  for (const p of platforms) {
    const key = p.toLowerCase() === 'twitter' ? 'x' : p.toLowerCase();
    const rule = PLATFORM_RULES[key];
    if (rule) {
      parts.push(`[${rule.displayName}]`);
      parts.push(`- Recommended Length: ${rule.recommendedLength}`);
      parts.push(`- Hashtags: ${rule.hashtagLimit > 0 ? `Max ${rule.hashtagLimit}` : 'None'}`);
      parts.push(`- Norms:`);
      for (const g of rule.guidelines) {
        parts.push(`  * ${g}`);
      }
    } else {
      parts.push(`[${p}] Follow platform conventions and appropriate professional register.`);
    }

    if (key === 'reddit' && subredditContext && subredditContext.length > 0) {
      parts.push(`- Target Subreddits & Rules:`);
      for (const sub of subredditContext) {
        parts.push(`  * ${sub.name}: ${sub.rules || 'No specific custom rules provided.'}`);
      }
    }
    parts.push('');
  }

  return parts.join('\n').trim();
}
