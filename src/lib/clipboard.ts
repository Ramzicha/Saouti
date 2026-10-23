/**
 * Resilient Clipboard Utility
 * Preserves exact formatting (double line breaks, Unicode emojis, hashtags)
 * and uses modern Clipboard API with resilient DOM execCommand fallback.
 */

export interface FormatPostOptions {
  content: string;
  hashtags?: string[] | undefined;
}

/**
 * Serializes a post for pasting directly into social networks.
 * Preserves exact line breaks, emojis, and normalizes trailing hashtags.
 */
export function formatPostForClipboard({
  content,
  hashtags = [],
}: FormatPostOptions): string {
  let text = content.trim();

  if (hashtags.length > 0) {
    // Format hashtags ensuring leading '#'
    const formattedTags = hashtags
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .filter((tag) => !text.includes(tag));

    if (formattedTags.length > 0) {
      text = `${text}\n\n${formattedTags.join(' ')}`;
    }
  }

  return text;
}

/**
 * Copies text to system clipboard with fallback support.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // 1. Try modern Async Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  // 2. Fallback using hidden textarea and document.execCommand('copy')
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}
