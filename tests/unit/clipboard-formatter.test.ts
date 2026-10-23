import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard, formatPostForClipboard } from '@/lib/clipboard';

describe('formatPostForClipboard', () => {
  it('preserves exact line breaks and paragraph spacing', () => {
    const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph with details.';
    const result = formatPostForClipboard({ content });
    expect(result).toBe(content);
  });

  it('preserves Unicode emojis including flags and skin tones', () => {
    const content = '🚀 Launching today in Algeria 🇩🇿! Great work team 👍🏽✨';
    const result = formatPostForClipboard({ content });
    expect(result).toBe(content);
  });

  it('appends hashtags cleanly with blank line if hashtags array provided', () => {
    const content = 'Excited to announce our new product release.';
    const hashtags = ['#AI', '#Tech', 'Startup'];
    const result = formatPostForClipboard({ content, hashtags });
    expect(result).toBe('Excited to announce our new product release.\n\n#AI #Tech #Startup');
  });

  it('does not duplicate hashtags if already in content', () => {
    const content = 'Excited to announce our new product release. #AI #Tech';
    const hashtags = ['#AI', '#Tech'];
    const result = formatPostForClipboard({ content, hashtags });
    expect(result).toBe('Excited to announce our new product release. #AI #Tech');
  });
});

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const success = await copyToClipboard('Hello, World! 🚀');
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('Hello, World! 🚀');
  });

  it('falls back to textarea and execCommand when navigator.clipboard throws or is undefined', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const success = await copyToClipboard('Fallback text copy');
    expect(success).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith('copy');
  });
});
