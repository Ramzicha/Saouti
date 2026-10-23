/**
 * Profile and Onboarding API Contract
 * Feature: 005-voice-profile
 */

export interface GetProfileResponse {
  profile: {
    id: string;
    userId: string;
    status: 'draft' | 'active';
    currentStep: number;
    currentVersion: number;
    primaryLanguage: string;
    arabicDialect: string;
    identity: {
      role: string;
      industry?: string;
      expertise?: string[];
      positioning?: string;
    };
    principles: {
      values?: string[];
      topicsToAvoid?: string[];
      toneRedLines?: string[];
    };
    audience: {
      persona?: string;
      expertiseLevel?: 'beginner' | 'intermediate' | 'expert' | 'general';
      interests?: string[];
    };
    objectives: {
      primaryObjective?: 'authority' | 'leads' | 'hiring' | 'community' | 'sales';
      platformRankings?: Record<string, string[]>;
    };
    style: {
      formality?: number;
      length?: 'short' | 'medium' | 'long';
      emoji?: 'none' | 'minimal' | 'frequent';
      hookStyle?: 'bold_statement' | 'question' | 'story' | 'statistic';
    };
    completenessScore: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  samples: Array<{
    id: string;
    title: string;
    content: string;
    orderIndex: number;
  }>;
  platforms: Array<{
    id: string;
    platform: 'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook';
    primaryObjective: string;
    subreddits?: Array<{ name: string; rulesSummary?: string }>;
    customInstructions?: string;
  }>;
}

export interface SaveDraftStepRequest {
  step: number; // 1 to 7
  data: Record<string, unknown>;
}

export interface SaveDraftStepResponse {
  success: boolean;
  currentStep: number;
  completenessScore: number;
}

export interface ActivateProfileResponse {
  success: boolean;
  profileId: string;
  status: 'active';
}

export interface VersionHistoryResponse {
  versions: Array<{
    id: string;
    versionNumber: number;
    changeSummary?: string;
    createdAt: string;
  }>;
}

export interface RollbackVersionResponse {
  success: boolean;
  activeVersion: number;
}

export interface ProfilePreviewResponse {
  summaryMarkdown: string;
  version: string;
}

export interface ProfilerChatRequest {
  message: string;
  sessionId?: string;
}

export interface ProfilerConfirmRequest {
  sessionId: string;
  modifications?: Record<string, unknown>;
}
