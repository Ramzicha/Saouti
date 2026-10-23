import { describe, it, expect } from 'vitest';
import { exportPostsToMarkdown, exportPostsToText } from '@/lib/export/post-exporter';
import type { PostWithTags } from '@/lib/library/post-service';

const mockPosts: PostWithTags[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    runId: 'run-1',
    platform: 'linkedin',
    language: 'en',
    status: 'ready',
    content: 'Building agentic AI systems with strict specs and zero regressions.',
    hashtags: ['#ai', '#systems'],
    imagePrompt: 'A futuristic clean blueprint of an agent graph',
    imageAltText: 'Blueprint visualization of AI agents collaborating',
    imageAspectRatio: '1:1',
    publishedUrl: null,
    publishedAt: null,
    deletedAt: null,
    searchVector: '',
    createdAt: new Date('2026-10-23T12:00:00Z'),
    updatedAt: new Date('2026-10-23T12:00:00Z'),
    tags: [{ id: 't1', name: 'AI', color: '#6366f1' }],
    versionCount: 1,
  },
  {
    id: 'post-2',
    userId: 'user-1',
    runId: null,
    platform: 'x',
    language: 'ar',
    status: 'posted',
    content: 'الذكاء الاصطناعي في الجزائر يشهد تطوراً ملحوظاً اليوم.',
    hashtags: ['#الجزائر', '#ذكاء_اصطناعي'],
    imagePrompt: null,
    imageAltText: null,
    imageAspectRatio: null,
    publishedUrl: 'https://x.com/status/123456',
    publishedAt: new Date('2026-10-23T14:00:00Z'),
    deletedAt: null,
    searchVector: '',
    createdAt: new Date('2026-10-23T13:00:00Z'),
    updatedAt: new Date('2026-10-23T14:00:00Z'),
    tags: [],
    versionCount: 2,
  },
];

describe('Post Exporter', () => {
  it('formats posts into structured Markdown with platform headers and metadata', () => {
    const md = exportPostsToMarkdown(mockPosts);

    expect(md).toContain('# Saouti Post Library Export');
    expect(md).toContain('## LinkedIn (READY)');
    expect(md).toContain('Building agentic AI systems with strict specs');
    expect(md).toContain('**Image Prompt:** A futuristic clean blueprint');
    expect(md).toContain('## X (POSTED)');
    expect(md).toContain('الذكاء الاصطناعي في الجزائر');
    expect(md).toContain('**Published URL:** https://x.com/status/123456');
  });

  it('formats posts into plain text with separators', () => {
    const text = exportPostsToText(mockPosts);

    expect(text).toContain('=== LINKEDIN (READY) ===');
    expect(text).toContain('Building agentic AI systems with strict specs');
    expect(text).toContain('=== X (POSTED) ===');
    expect(text).toContain('الذكاء الاصطناعي في الجزائر');
  });
});
