/**
 * API Contracts: AI Provider Keys Management
 * 
 * Defines request and response types for:
 * - GET    /api/settings/keys
 * - POST   /api/settings/keys
 * - DELETE /api/settings/keys
 * - GET    /api/settings/keys/usage
 */

export interface StoredKeySummary {
  provider: 'gemini';
  lastFour: string;
  status: 'active' | 'invalid' | 'quota_exceeded';
  lastValidatedAt: string | null;
  createdAt: string;
}

export interface GetKeysResponse {
  hasKey: boolean;
  key: StoredKeySummary | null;
}

export interface SaveKeyRequest {
  provider: 'gemini';
  apiKey: string;
  acknowledgedTerms: true;
}

export interface SaveKeyResponse {
  success: true;
  message: string;
  key: StoredKeySummary;
}

export interface DeleteKeyResponse {
  success: true;
  message: string;
}

export interface DailyUsageStat {
  date: string;
  requestCount: number;
  errorCount: number;
  quotaErrorCount: number;
}

export interface GetUsageResponse {
  stats: DailyUsageStat[];
  provider: 'gemini';
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
