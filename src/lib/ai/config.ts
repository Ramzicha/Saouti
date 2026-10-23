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
    validation: process.env.AI_VALIDATION_MODEL || 'gemini-3.1-flash-lite',
    writer: process.env.AI_WRITER_MODEL || 'gemini-3.1-flash-lite',
    critic: process.env.AI_CRITIC_MODEL || 'gemini-3.1-flash-lite',
    artDirector: process.env.AI_ART_DIRECTOR_MODEL || 'gemini-3.1-flash-lite',
    image: process.env.AI_IMAGE_MODEL || 'imagen-3.0-generate-002',
  },
  supportedModels: {
    text: [
      {
        id: 'gemini-3.5-flash',
        displayName: 'Gemini 3.5 Flash',
        description: 'Next-generation speed and quality, recommended default.',
        contextWindow: 1048576,
      },
      {
        id: 'gemini-3.1-flash-lite',
        displayName: 'Gemini 3.1 Flash Lite',
        description: 'Fast, lightweight model with high free-tier quotas.',
        contextWindow: 1048576,
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
