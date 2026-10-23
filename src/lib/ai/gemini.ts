import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AiProviderAdapter,
  GenerateTextOptions,
  GenerateStructuredOptions,
  TextGenerationResult,
  StructuredGenerationResult,
  ImageGenerationResult,
  ImageCapabilityStatus,
  GenerateImageOptions,
  TokenUsage,
} from './provider';
import {
  InvalidApiKeyError,
  QuotaExhaustedError,
  ContentSafetyBlockedError,
  ProviderUnavailableError,
  RequestTimeoutError,
  AiUnsupportedCapabilityError,
  AiError,
} from './errors';
import { aiConfig } from './config';
import { logger } from '@/lib/logger';

export interface GeminiAdapterOptions {
  apiKey: string;
}

/**
 * Maps raw Google GenAI exceptions to Saouti domain errors.
 */
export function normalizeGeminiError(error: unknown): AiError {
  if (error instanceof AiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();

  // Authentication & Key errors
  if (
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('unauthenticated') ||
    lowerMsg.includes('401') ||
    lowerMsg.includes('403')
  ) {
    return new InvalidApiKeyError(
      'The provided Gemini API key is invalid or inactive',
      error,
    );
  }

  // Quota & Rate Limit errors
  if (
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('429')
  ) {
    return new QuotaExhaustedError(
      'Gemini API rate limit or free-tier quota exceeded',
      undefined,
      error,
    );
  }

  // Safety filter blocks
  if (
    lowerMsg.includes('safety') ||
    lowerMsg.includes('blocked') ||
    lowerMsg.includes('harm_category')
  ) {
    return new ContentSafetyBlockedError(
      'Prompt or output was blocked by Google content safety policies',
      undefined,
      error,
    );
  }

  // Service unavailable
  if (
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('service_unavailable') ||
    lowerMsg.includes('500') ||
    lowerMsg.includes('502') ||
    lowerMsg.includes('503') ||
    lowerMsg.includes('504')
  ) {
    return new ProviderUnavailableError(
      'Google Gemini service is temporarily unavailable',
      error,
    );
  }

  // Timeouts
  if (lowerMsg.includes('timeout') || lowerMsg.includes('aborted')) {
    return new RequestTimeoutError('Gemini request timed out', error);
  }

  // Capability not supported / model not found for image generation
  if (
    lowerMsg.includes('not found') ||
    lowerMsg.includes('not supported') ||
    lowerMsg.includes('unsupported model') ||
    lowerMsg.includes('method not allowed') ||
    lowerMsg.includes('has not used the model') ||
    lowerMsg.includes('is not available for this project')
  ) {
    return new AiUnsupportedCapabilityError(
      'Configured AI provider key does not support direct image generation',
      'image_generation',
      error,
    );
  }

  // Default fallback to ProviderUnavailableError
  return new ProviderUnavailableError(
    `AI provider error: ${message}`,
    error,
  );
}

/**
 * Production adapter for Google Gemini via @google/generative-ai.
 */
export class GeminiAdapter implements AiProviderAdapter {
  readonly providerId = 'gemini';
  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor(options: GeminiAdapterOptions) {
    if (!options.apiKey) {
      throw new InvalidApiKeyError('API key cannot be empty');
    }
    this.apiKey = options.apiKey;
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Performs a validation test to confirm key validity and quota with Google.
   */
  async validateKey(apiKeyToValidate?: string): Promise<boolean> {
    const key = apiKeyToValidate || this.apiKey;
    try {
      // 1. Direct validation via Google's models endpoint (zero token cost, model-independent)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      );

      if (res.ok) {
        return true;
      }

      // If Google explicitly rejected the key (e.g. 400 API_KEY_INVALID or 403 Forbidden)
      if (res.status === 400 || res.status === 403) {
        return false;
      }

      // 2. Fallback: try minimal token generation with configured model
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({
        model: aiConfig.models.validation,
        generationConfig: {
          maxOutputTokens: 1,
        },
      });

      const response = await model.generateContent('ping');
      return Boolean(response && response.response);
    } catch (err) {
      const normalized = normalizeGeminiError(err);
      if (normalized instanceof InvalidApiKeyError) {
        return false;
      }
      logger.warn({ err: normalized }, 'Key validation encounter provider notice');
      return false;
    }
  }

  async generateText(
    prompt: string,
    options?: GenerateTextOptions,
  ): Promise<TextGenerationResult> {
    try {
      const modelName = options?.model || aiConfig.models.writer;
      const generationConfig: {
        temperature: number;
        maxOutputTokens?: number;
      } = {
        temperature: options?.temperature ?? 0.7,
      };
      if (options?.maxTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxTokens;
      }

      const model = this.client.getGenerativeModel({
        model: modelName,
        ...(options?.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
        generationConfig,
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const metadata = response.response.usageMetadata;

      const usage: TokenUsage = {};
      if (metadata?.promptTokenCount !== undefined) {
        usage.promptTokens = metadata.promptTokenCount;
      }
      if (metadata?.candidatesTokenCount !== undefined) {
        usage.completionTokens = metadata.candidatesTokenCount;
      }
      if (metadata?.totalTokenCount !== undefined) {
        usage.totalTokens = metadata.totalTokenCount;
      }

      return {
        text,
        usage,
      };
    } catch (err) {
      throw normalizeGeminiError(err);
    }
  }

  async generateStructured<T>(
    prompt: string,
    options: GenerateStructuredOptions<T>,
  ): Promise<StructuredGenerationResult<T>> {
    try {
      const modelName = options.model || aiConfig.models.critic;
      const generationConfig: {
        temperature: number;
        maxOutputTokens?: number;
        responseMimeType: string;
      } = {
        temperature: options.temperature ?? 0.2,
        responseMimeType: 'application/json',
      };
      if (options.maxTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxTokens;
      }

      const model = this.client.getGenerativeModel({
        model: modelName,
        ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
        generationConfig,
      });

      const response = await model.generateContent(prompt);
      const rawText = response.response.text();

      // Parse and validate with Zod schema
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        // Fallback: strip potential markdown codeblocks if model wrapped in ```json
        const cleaned = rawText.replace(/```(?:json)?/gi, '').trim();
        parsedJson = JSON.parse(cleaned);
      }

      const validatedData = options.schema.parse(parsedJson);
      const metadata = response.response.usageMetadata;

      const usage: TokenUsage = {};
      if (metadata?.promptTokenCount !== undefined) {
        usage.promptTokens = metadata.promptTokenCount;
      }
      if (metadata?.candidatesTokenCount !== undefined) {
        usage.completionTokens = metadata.candidatesTokenCount;
      }
      if (metadata?.totalTokenCount !== undefined) {
        usage.totalTokens = metadata.totalTokenCount;
      }

      return {
        data: validatedData,
        rawText,
        usage,
      };
    } catch (err) {
      throw normalizeGeminiError(err);
    }
  }

  async checkImageCapability(): Promise<ImageCapabilityStatus> {
    try {
      const isValid = await this.validateKey(this.apiKey);
      if (!isValid) {
        return {
          supported: false,
          model: aiConfig.models.image,
          providerId: this.providerId,
          reason: 'Invalid or revoked API key',
        };
      }
      return {
        supported: true,
        model: aiConfig.models.image,
        providerId: this.providerId,
      };
    } catch (err) {
      return {
        supported: false,
        model: aiConfig.models.image,
        providerId: this.providerId,
        reason: err instanceof Error ? err.message : 'Capability check failed',
      };
    }
  }

  async generateImage(
    prompt: string,
    options?: GenerateImageOptions,
  ): Promise<ImageGenerationResult> {
    try {
      const model = options?.model || aiConfig.models.image;
      const aspectRatio = options?.aspectRatio || '16:9';

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(
        this.apiKey,
      )}`;

      const fetchInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            outputMimeType: 'image/png',
          },
        }),
      };
      if (options?.signal) {
        fetchInit.signal = options.signal;
      }

      const res = await fetch(url, fetchInit);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google Imagen API error (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const b64 = json.predictions?.[0]?.bytesBase64Encoded;

      if (!b64) {
        throw new Error('No image bytes returned in Imagen response');
      }

      const buffer = Buffer.from(b64, 'base64');

      return {
        imageBuffer: buffer,
        base64Data: b64,
        mimeType: 'image/png',
        prompt,
        width: 1200,
        height: 675,
      };
    } catch (err) {
      throw normalizeGeminiError(err);
    }
  }
}
