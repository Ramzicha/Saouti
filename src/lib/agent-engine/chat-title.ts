/**
 * Automatic chat/run title formatter for Saouti.
 * Extracts a concise, human-readable title from the initial topic brief.
 */
export function formatChatTitle(topicBrief: string): string {
  if (!topicBrief || typeof topicBrief !== 'string' || !topicBrief.trim()) {
    return 'Untitled Run';
  }

  let text = topicBrief.trim();

  // Strip wrapping quotes or markdown formatting
  text = text.replace(/^["'`“”«»]+|["'`“”«»]+$/g, '').trim();

  // Strip common conversational/command prompt prefixes (case-insensitive)
  const prefixes = [
    /^(?:please\s+)?(?:can\s+you\s+)?draft\s+(?:a\s+fresh\s+alternative\s+version\s+of\s+(?:the\s+)?post\s+about:?\s*)/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:write|draft|create|generate|make)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:social\s+media\s+|new\s+)?(?:post|thread|article|content|update)\s+(?:about|on|regarding|discussing):?\s*/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:write|draft|create|generate)\s+(?:about|on|regarding):?\s*/i,
    /^(?:post\s+about|topic:?|brief:?)\s*/i,
    // Arabic prefixes
    /^(?:اكتب\s+(?:لي\s+)?|صغ\s+(?:لي\s+)?|انشئ\s+|قم\s+بكتابة\s+)(?:منشور\s+|محتوى\s+|بوست\s+)?(?:عن|حول|بخصوص):?\s*/,
    // French prefixes
    /^(?:rédige|écris|crée|génère)\s+(?:un\s+post|une\s+publication)?\s*(?:sur|à propos de):?\s*/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(text)) {
      text = text.replace(prefix, '').trim();
      break;
    }
  }

  // Strip inner quotes if left (e.g. "AI in healthcare")
  text = text.replace(/^["'`“”«»]+|["'`“”«»]+$/g, '').trim();

  // Take first line and first sentence
  const firstLine = text.split(/\r?\n/)[0]?.trim() || text;
  const firstSentence = firstLine.split(/[.!?؟]\s+/)[0]?.trim() || firstLine;

  const target = firstSentence || text;

  // Capitalize first letter
  const capitalized = target.charAt(0).toUpperCase() + target.slice(1);

  // Truncate cleanly up to ~36 characters without breaking words abruptly
  const maxChars = 36;
  if (capitalized.length <= maxChars) {
    return capitalized;
  }

  const truncated = capitalized.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 18) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}
