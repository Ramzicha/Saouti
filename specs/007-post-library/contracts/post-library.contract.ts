/**
 * Post Library API Contracts: 007 — Post Library
 * Defines request and response wire contracts for Post Library endpoints.
 */

export interface PostResponseDto {
  id: string;
  userId: string;
  runId: string | null;
  platform: 'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook';
  language: string;
  status: 'draft' | 'ready' | 'posted';
  content: string;
  hashtags: string[];
  imagePrompt: string | null;
  imageAltText: string | null;
  imageAspectRatio: string | null;
  publishedUrl: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponseDto {
  posts: PostResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export interface PostVersionResponseDto {
  id: string;
  postId: string;
  versionNumber: number;
  content: string;
  hashtags: string[];
  imagePrompt: string | null;
  changeSummary: string | null;
  createdAt: string;
}

export interface TagResponseDto {
  id: string;
  name: string;
  color: string;
  postCount?: number;
}

export interface UpdatePostRequestDto {
  content: string;
  hashtags?: string[];
  imagePrompt?: string;
  imageAltText?: string;
  status?: 'draft' | 'ready' | 'posted';
  changeSummary?: string;
}

export interface MarkAsPostedRequestDto {
  publishedUrl?: string;
  publishedAt?: string;
}

export interface AddTagRequestDto {
  name: string;
  color?: string;
}

export interface ExportPostsRequestDto {
  format: 'markdown' | 'text';
  postIds?: string[];
  filter?: {
    platform?: string;
    status?: string;
    tag?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}
