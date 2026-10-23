/**
 * External AI Model & Provider Configuration
 * 
 * Model names and parameters reside in configuration, never hardcoded in feature logic (Principle 4).
 */

export interface ModelDescriptor {
  id: string;
  displayName: string;
  description: string;
  contextWindow: number;
}

export interface AiConfiguration {
  defaultProvider: 'gemini';
  models: {
    validation: string;
    writer: string;
    critic: string;
    artDirector: string;
    image: string;
  };
  supportedModels: {
    text: ModelDescriptor[];
    image: ModelDescriptor[];
  };
  retryPolicy: {
    maxRetries: number;
    baseBackoffMs: number;
    maxCumulativeWaitMs: number;
  };
}

export const aiConfig: AiConfiguration = {
  defaultProvider: 'gemini',
  models: {
    validation: process.env.AI_VALIDATION_MODEL || 'gemini-2.0-flash',
    writer: process.env.AI_WRITER_MODEL || 'gemini-2.0-flash',
    critic: process.env.AI_CRITIC_MODEL || 'gemini-2.0-flash',
    artDirector: process.env.AI_ART_DIRECTOR_MODEL || 'gemini-2.0-flash',
    image: process.env.AI_IMAGE_MODEL || 'imagen-3.0-generate-002',
  },
  supportedModels: {
    text: [
      {
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        description: 'Next-generation speed and quality, recommended default.',
        contextWindow: 1048576,
      },
      {
        id: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast, lightweight model with high free-tier quotas.',
        contextWindow: 1048576,
      },
      {
        id: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Deep reasoning and nuanced creative voice matching.',
        contextWindow: 2097152,
      },
    ],
    image: [
      {
        id: 'imagen-3.0-generate-002',
        displayName: 'Imagen 3',
        description: 'High-detail visual generation adhering to art prompts.',
        contextWindow: 0,
      },
    ],
  },
  retryPolicy: {
    maxRetries: 3,
    baseBackoffMs: 5000,
    maxCumulativeWaitMs: 45000,
  },
};
