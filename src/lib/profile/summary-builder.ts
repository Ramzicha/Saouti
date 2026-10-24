export interface SummaryProfileInput {
  role?: string | null | undefined;
  identityData?: {
    role?: string | undefined;
    industry?: string | undefined;
    expertise?: string[] | undefined;
    positioning?: string | undefined;
  } | null | undefined;
  principlesData?: {
    values?: string[] | undefined;
    topicsToAvoid?: string[] | undefined;
    toneRedLines?: string[] | undefined;
  } | null | undefined;
  audienceData?: {
    persona?: string | undefined;
    expertiseLevel?: string | undefined;
    interests?: string[] | undefined;
  } | null | undefined;
  objectivesData?: {
    primaryObjective?: string | undefined;
    platformRankings?: Record<string, string[]> | undefined;
  } | null | undefined;
  styleData?: {
    formality?: number | undefined;
    length?: string | undefined;
    emoji?: string | undefined;
    hookStyle?: string | undefined;
  } | null | undefined;
  primaryLanguage?: string | null | undefined;
  arabicDialect?: string | null | undefined;
}

export interface SummarySampleInput {
  title?: string | undefined;
  content: string;
  orderIndex?: number | undefined;
}

export interface SummaryPlatformInput {
  platform: string;
  primaryObjective?: string | undefined;
  subreddits?: Array<{ name: string; rulesSummary?: string | undefined }> | undefined;
  customInstructions?: string | undefined;
}

export interface SummaryFactInput {
  factText: string;
  sourceCitation?: string | undefined;
  factCategory?: string | undefined;
}

/**
 * Escapes sensitive XML/HTML-like delimiter tags inside user-provided content.
 * Prevents delimiter breakout attacks (e.g. user pasting "</voice_profile>" inside a sample).
 */
export function sanitizeTagContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Pure, versioned function that builds the exact <voice_profile> prompt context
 * injected into autonomous agents (Writer, Critic, Art Director).
 */
export function buildVoiceProfileSummary(
  profile: SummaryProfileInput,
  samples: SummarySampleInput[] = [],
  platforms: SummaryPlatformInput[] = [],
  version = '1.0',
  approvedFacts: SummaryFactInput[] = [],
): string {
  const role = profile.identityData?.role || profile.role || 'Professional';
  const industry = profile.identityData?.industry || 'Unspecified';
  const expertise = profile.identityData?.expertise?.join(', ') || 'General';
  const positioning = profile.identityData?.positioning || 'Authentic perspective';

  const values = profile.principlesData?.values?.join(', ') || 'Integrity, clarity';
  const topicsToAvoid =
    profile.principlesData?.topicsToAvoid?.join(', ') || 'None specified';
  const toneRedLines =
    profile.principlesData?.toneRedLines?.join(', ') || 'Avoid generic platitudes';

  const audiencePersona =
    profile.audienceData?.persona || 'Professional peers and industry stakeholders';
  const audienceLevel = profile.audienceData?.expertiseLevel || 'general';
  const audienceInterests =
    profile.audienceData?.interests?.join(', ') || 'Industry insights';

  const primaryObjective =
    profile.objectivesData?.primaryObjective || 'authority';

  const formality = profile.styleData?.formality ?? 3;
  const length = profile.styleData?.length || 'medium';
  const emoji = profile.styleData?.emoji || 'minimal';
  const hookStyle = profile.styleData?.hookStyle || 'bold_statement';

  const primaryLanguage = profile.primaryLanguage || 'en';
  const arabicDialect = profile.arabicDialect || 'none';

  const lines: string[] = [];

  lines.push(`<voice_profile version="${version}">`);
  lines.push('  <identity>');
  lines.push(`    <role>${sanitizeTagContent(role)}</role>`);
  lines.push(`    <industry>${sanitizeTagContent(industry)}</industry>`);
  lines.push(`    <expertise>${sanitizeTagContent(expertise)}</expertise>`);
  lines.push(`    <positioning>${sanitizeTagContent(positioning)}</positioning>`);
  lines.push('  </identity>');

  lines.push('  <principles>');
  lines.push(`    <values>${sanitizeTagContent(values)}</values>`);
  lines.push(`    <topics_to_avoid>${sanitizeTagContent(topicsToAvoid)}</topics_to_avoid>`);
  lines.push(`    <tone_red_lines>${sanitizeTagContent(toneRedLines)}</tone_red_lines>`);
  lines.push('  </principles>');

  lines.push('  <audience>');
  lines.push(`    <persona>${sanitizeTagContent(audiencePersona)}</persona>`);
  lines.push(`    <expertise_level>${sanitizeTagContent(audienceLevel)}</expertise_level>`);
  lines.push(`    <interests>${sanitizeTagContent(audienceInterests)}</interests>`);
  lines.push('  </audience>');

  lines.push('  <objectives>');
  lines.push(`    <primary_objective>${sanitizeTagContent(primaryObjective)}</primary_objective>`);
  lines.push('  </objectives>');

  lines.push(
    `  <style formality="${formality}" length="${length}" emoji="${emoji}" hook="${hookStyle}" />`,
  );
  lines.push(
    `  <languages primary="${primaryLanguage}" arabic_dialect="${arabicDialect}" />`,
  );

  if (platforms.length > 0) {
    lines.push('  <platform_guidelines>');
    for (const p of platforms) {
      const obj = p.primaryObjective || primaryObjective;
      if (p.platform === 'reddit' && p.subreddits && p.subreddits.length > 0) {
        lines.push(`    <platform name="reddit" objective="${sanitizeTagContent(obj)}">`);
        lines.push('      <subreddits>');
        for (const sub of p.subreddits) {
          const rules = sub.rulesSummary
            ? `: ${sanitizeTagContent(sub.rulesSummary)}`
            : '';
          lines.push(`        <subreddit name="${sanitizeTagContent(sub.name)}"${rules ? ` rules="${sanitizeTagContent(sub.rulesSummary || '')}"` : ''} />`);
        }
        lines.push('      </subreddits>');
        lines.push('    </platform>');
      } else {
        lines.push(
          `    <platform name="${sanitizeTagContent(p.platform)}" objective="${sanitizeTagContent(obj)}"${p.customInstructions ? ` instructions="${sanitizeTagContent(p.customInstructions)}"` : ''} />`,
        );
      }
    }
    lines.push('  </platform_guidelines>');
  }

  if (samples.length > 0) {
    lines.push('  <voice_samples>');
    samples.forEach((sample, idx) => {
      const title = sample.title || `Sample ${idx + 1}`;
      lines.push(
        `    <sample index="${idx + 1}" label="${sanitizeTagContent(title)}">`,
      );
      lines.push(`      ${sanitizeTagContent(sample.content.trim())}`);
      lines.push('    </sample>');
    });
    lines.push('  </voice_samples>');
  }

  if (approvedFacts && approvedFacts.length > 0) {
    lines.push('  <approved_facts>');
    approvedFacts.forEach((fact, idx) => {
      const citationAttr = fact.sourceCitation ? ` source="${sanitizeTagContent(fact.sourceCitation)}"` : '';
      const categoryAttr = fact.factCategory ? ` category="${sanitizeTagContent(fact.factCategory)}"` : '';
      lines.push(`    <fact index="${idx + 1}"${categoryAttr}${citationAttr}>${sanitizeTagContent(fact.factText.trim())}</fact>`);
    });
    lines.push('  </approved_facts>');
  }

  lines.push('</voice_profile>');

  return lines.join('\n');
}
