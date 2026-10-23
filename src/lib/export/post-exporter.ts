import type { PostWithTags } from '@/lib/library/post-service';

function formatPlatformName(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return 'LinkedIn';
    case 'x':
      return 'X';
    case 'reddit':
      return 'Reddit';
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}

/**
 * Formats a list of posts into structured Markdown (.md).
 */
export function exportPostsToMarkdown(posts: PostWithTags[]): string {
  const sections: string[] = [
    `# Saouti Post Library Export`,
    `Generated on: ${new Date().toISOString()}`,
    `Total posts: ${posts.length}`,
    `---`,
  ];

  for (const post of posts) {
    const platformName = formatPlatformName(post.platform);
    const platformTitle = post.platform.toUpperCase();
    const statusLabel = post.status.toUpperCase();
    const tagsStr = post.tags.map((t) => `#${t.name}`).join(' ');

    const postSection = [
      `## ${platformName} (${statusLabel})`,
      `*Created: ${new Date(post.createdAt).toLocaleDateString()} | Platform: ${platformTitle}*`,
      tagsStr ? `*Tags: ${tagsStr}*` : '',
      '',
      post.content,
      '',
      post.hashtags.length ? post.hashtags.join(' ') : '',
      post.imagePrompt ? `\n> **Image Prompt:** ${post.imagePrompt}` : '',
      post.imageAltText ? `> **Alt Text:** ${post.imageAltText}` : '',
      post.publishedUrl ? `\n**Published URL:** ${post.publishedUrl}` : '',
      `---`,
    ].filter((line) => line !== null && line !== undefined);

    sections.push(postSection.join('\n'));
  }

  return sections.join('\n\n');
}

/**
 * Formats a list of posts into plain text (.txt).
 */
export function exportPostsToText(posts: PostWithTags[]): string {
  const sections: string[] = [
    `SAOUTI POST LIBRARY EXPORT`,
    `Generated: ${new Date().toISOString()}`,
    `Total Posts: ${posts.length}`,
    `==================================================`,
  ];

  for (const post of posts) {
    const platformTitle = post.platform.toUpperCase();
    const statusLabel = post.status.toUpperCase();

    const postBlock = [
      `=== ${platformTitle} (${statusLabel}) ===`,
      `Date: ${new Date(post.createdAt).toLocaleDateString()}`,
      '',
      post.content,
      '',
      post.hashtags.length ? post.hashtags.join(' ') : '',
      post.imagePrompt ? `[Image Prompt: ${post.imagePrompt}]` : '',
      post.publishedUrl ? `[Published URL: ${post.publishedUrl}]` : '',
      `--------------------------------------------------`,
    ].filter(Boolean);

    sections.push(postBlock.join('\n'));
  }

  return sections.join('\n\n');
}
