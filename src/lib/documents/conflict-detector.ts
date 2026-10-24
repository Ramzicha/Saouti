import type { DocumentInsight } from '@/lib/db/schema';

export interface ProfileSnapshot {
  role?: string | undefined;
  industry?: string | undefined;
  expertise?: string[] | undefined;
  primaryLanguage?: string | undefined;
}

export interface ConflictResult {
  hasConflict: boolean;
  field: 'role' | 'industry' | 'language';
  profileValue: string;
  documentValue: string;
  resolutionHint: string;
}

/**
 * Normalizes text for comparison by trimming, lowercasing, and stripping punctuation.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Compares an extracted DocumentInsight against the user's active ProfileSnapshot.
 * Flags discrepancies between existing profile settings and document proposals.
 */
export function detectInsightConflict(
  insight: Pick<DocumentInsight, 'category' | 'rawText'>,
  profile?: ProfileSnapshot | null,
): ConflictResult | null {
  if (!profile) return null;

  const raw = insight.rawText;
  const normRaw = normalize(raw);

  // 1. Roles & Experience conflict check
  if (insight.category === 'roles_experience' && profile.role) {
    const normProfileRole = normalize(profile.role);
    // If the proposed text contains the exact role, no conflict
    if (normRaw.includes(normProfileRole) || normProfileRole.includes(normRaw)) {
      return null;
    }

    // Role keywords to distinguish title proposals
    const roleKeywords = [
      'director',
      'manager',
      'engineer',
      'officer',
      'president',
      'architect',
      'lead',
      'head',
      'founder',
      'consultant',
      'specialist',
    ];
    const containsRoleKeyword = roleKeywords.some((kw) => normRaw.includes(kw));

    if (containsRoleKeyword) {
      return {
        hasConflict: true,
        field: 'role',
        profileValue: profile.role,
        documentValue: raw,
        resolutionHint: 'Your profile has a different primary role.',
      };
    }
  }

  // 2. Language disparity check
  if (insight.category === 'languages' && profile.primaryLanguage) {
    const langCode = profile.primaryLanguage.toLowerCase();
    const langNames: Record<string, string[]> = {
      en: ['english'],
      fr: ['french', 'français'],
      ar: ['arabic', 'العربية'],
    };

    const targetNames = langNames[langCode] || [langCode];
    const mentionsPrimaryLang = targetNames.some((name) => normRaw.includes(name));

    if (!mentionsPrimaryLang) {
      return {
        hasConflict: true,
        field: 'language',
        profileValue: profile.primaryLanguage,
        documentValue: raw,
        resolutionHint: 'Document highlights languages differing from your primary language.',
      };
    }
  }

  return null;
}
