export interface CompletenessInput {
  role?: string | undefined;
  identityData?: {
    role?: string | undefined;
    industry?: string | undefined;
    expertise?: string[] | undefined;
    positioning?: string | undefined;
  } | undefined;
  principlesData?: {
    values?: string[] | undefined;
    topicsToAvoid?: string[] | undefined;
    toneRedLines?: string[] | undefined;
  } | undefined;
  audienceData?: {
    persona?: string | undefined;
    expertiseLevel?: string | undefined;
    interests?: string[] | undefined;
  } | undefined;
  objectivesData?: {
    primaryObjective?: string | undefined;
  } | undefined;
  styleData?: {
    formality?: number | undefined;
    length?: string | undefined;
    emoji?: string | undefined;
    hookStyle?: string | undefined;
  } | undefined;
  samplesCount?: number | undefined;
  platformsCount?: number | undefined;
  hasRedditRules?: boolean | undefined;
}

export interface CompletenessResult {
  score: number;
  level: 'starter' | 'basic' | 'strong' | 'optimal';
  nextTip?: string | undefined;
}

export function calculateProfileCompleteness(
  input: CompletenessInput,
): CompletenessResult {
  let score = 0;
  const tips: string[] = [];

  // Identity (30 pts max)
  const role = input.identityData?.role || input.role;
  if (role && role.trim().length >= 2) {
    score += 15;
  } else {
    tips.push('Specify your professional role to build your baseline voice.');
  }

  if (input.identityData?.industry?.trim()) {
    score += 5;
  } else {
    tips.push('Add your industry to tailor technical vocabulary.');
  }

  if (
    input.identityData?.expertise &&
    input.identityData.expertise.length > 0
  ) {
    score += 5;
  } else {
    tips.push('Add key areas of expertise.');
  }

  if (input.identityData?.positioning?.trim()) {
    score += 5;
  }

  // Principles (15 pts max)
  if (
    input.principlesData?.values &&
    input.principlesData.values.length > 0
  ) {
    score += 5;
  } else {
    tips.push('Define core values to guide agent decisions.');
  }

  if (
    input.principlesData?.topicsToAvoid &&
    input.principlesData.topicsToAvoid.length > 0
  ) {
    score += 5;
  }

  if (
    input.principlesData?.toneRedLines &&
    input.principlesData.toneRedLines.length > 0
  ) {
    score += 5;
  } else {
    tips.push('Set tone red lines to prevent clichés or undesirable phrasing.');
  }

  // Audience (10 pts max)
  if (input.audienceData?.persona?.trim()) {
    score += 10;
  } else {
    tips.push('Describe your target reader persona.');
  }

  // Objectives & Style (15 pts max)
  if (input.objectivesData?.primaryObjective) {
    score += 5;
  }

  if (input.styleData?.hookStyle || input.styleData?.formality) {
    score += 10;
  }

  // Platforms (15 pts max)
  const platformsCount = input.platformsCount ?? 0;
  if (platformsCount > 0) {
    score += 10;
    if (input.hasRedditRules) {
      score += 5;
    }
  } else {
    tips.push('Select at least one social media platform.');
  }

  // Voice Samples (15 pts max)
  const samples = input.samplesCount ?? 0;
  if (samples >= 3) {
    score += 15;
  } else if (samples === 2) {
    score += 10;
    tips.push('Add a 3rd voice sample for higher stylistic calibration.');
  } else if (samples === 1) {
    score += 5;
    tips.push('Add 2 more voice samples to refine agent imitation.');
  } else {
    tips.push('Paste at least one writing sample to activate your profile.');
  }

  // Cap at 100
  score = Math.min(score, 100);

  let level: 'starter' | 'basic' | 'strong' | 'optimal' = 'starter';
  if (score >= 90) {
    level = 'optimal';
  } else if (score >= 70) {
    level = 'strong';
  } else if (score >= 40) {
    level = 'basic';
  }

  const result: CompletenessResult = {
    score,
    level,
  };
  if (tips.length > 0) {
    result.nextTip = tips[0];
  }

  return result;
}
