/**
 * Prompt Tagged-Data Isolation Utilities (Principle 2)
 *
 * Enforces that user-supplied content (voice profiles, samples, briefs)
 * is passed to models strictly inside tagged, delimited data blocks,
 * escaping any attempts to break out of delimiters or inject system commands.
 */

/**
 * Sanitizes user content to neutralize delimiter breakout attempts.
 */
export function sanitizeUserData(content: string, tagToEscape?: string): string {
  if (!content) return '';

  let sanitized = content.trim();

  // If a tag is specified, escape closing and opening variants
  if (tagToEscape) {
    const closingTag = `</${tagToEscape}>`;
    const openingTag = `<${tagToEscape}>`;
    sanitized = sanitized
      .replaceAll(closingTag, `&lt;/${tagToEscape}&gt;`)
      .replaceAll(openingTag, `&lt;${tagToEscape}&gt;`);
  }

  // Escape any generic system instruction injections
  sanitized = sanitized.replaceAll('</', '&lt;/');

  return sanitized;
}

/**
 * Wraps user-supplied content inside tagged delimiters: <tag>\ncontent\n</tag>
 */
export function formatTaggedBlock(tag: string, content: string): string {
  const sanitized = sanitizeUserData(content, tag);
  return `<${tag}>\n${sanitized}\n</${tag}>`;
}

export interface IsolatedPromptOptions {
  taskInstruction: string;
  profile?: string;
  brief?: string;
  samples?: string[];
  additionalData?: Record<string, string>;
}

/**
 * Assembles a complete prompt where system instructions and user data are strictly isolated.
 */
export function buildPromptWithIsolatedData({
  taskInstruction,
  profile,
  brief,
  samples,
  additionalData,
}: IsolatedPromptOptions): string {
  const sections: string[] = [taskInstruction.trim(), ''];

  if (profile) {
    sections.push(formatTaggedBlock('profile', profile));
  }

  if (brief) {
    sections.push(formatTaggedBlock('brief', brief));
  }

  if (samples && samples.length > 0) {
    const samplesBlock = samples
      .map((s, idx) => `<sample index="${idx + 1}">\n${sanitizeUserData(s)}\n</sample>`)
      .join('\n\n');
    sections.push(`<voice_samples>\n${samplesBlock}\n</voice_samples>`);
  }

  if (additionalData) {
    for (const [key, val] of Object.entries(additionalData)) {
      sections.push(formatTaggedBlock(key, val));
    }
  }

  return sections.join('\n\n').trim();
}
