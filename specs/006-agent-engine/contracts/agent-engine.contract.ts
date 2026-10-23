/**
 * API Contract: Agent Engine Pipeline Endpoints
 */

export interface CreateRunRequest {
  topicBrief: string;
  selectedPlatforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'>;
  targetLanguage?: 'en' | 'fr' | 'ar';
  arabicDialect?: 'none' | 'msa' | 'darija' | 'both';
  skipCritic?: boolean;
}

export interface CreateRunResponse {
  runId: string;
  status: 'pending' | 'running';
  eventsUrl: string; // `/api/runs/${runId}/events`
}

export interface GeneratedPost {
  platform: 'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook';
  language: string;
  text: string;
  hashtags: string[];
  imagePrompt?: string;
  imageAltText?: string;
  imageAspectRatio?: string;
  criticVerdict?: 'pass' | 'revise';
  criticScores?: {
    voiceMatch: number;
    principleCompliance: number;
    audienceFit: number;
    platformFit: number;
    specificity: number;
    factualSafety: number;
  };
  criticIssues?: Array<{
    exactPhrase: string;
    problem: string;
    suggestedFix: string;
  }>;
}

export interface RunDetailsResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timed_out';
  topicBrief: string;
  selectedPlatforms: string[];
  targetLanguage: string;
  skipCritic: boolean;
  posts: GeneratedPost[];
  totalDurationMs: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CancelRunResponse {
  success: boolean;
  runId: string;
  status: 'cancelled';
}
