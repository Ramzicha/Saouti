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
    let retryAfterSeconds: number | undefined;
    let isDailyOrFreeTier = false;

    // Detect if this is a Google AI Studio Free Tier limit: 0 or daily quota exhaustion
    if (
      lowerMsg.includes('limit: 0') ||
      lowerMsg.includes('per day limit') ||
      lowerMsg.includes('daily limit') ||
      lowerMsg.includes('free tier') ||
      lowerMsg.includes('free_tier_requests')
    ) {
      isDailyOrFreeTier = true;
    }

    // Try extracting retry delay from retryInfo (e.g. "18885s") or text ("retry in 5h")
    const delayMatch = message.match(/"retryDelay":\s*"(\d+)s"/i) || message.match(/retry in\s+(\d+)h/i);
    if (delayMatch && delayMatch[1]) {
      const parsed = parseInt(delayMatch[1], 10);
      if (message.includes('h') && !message.includes('"retryDelay"')) {
        retryAfterSeconds = parsed * 3600;
      } else {
        retryAfterSeconds = parsed;
      }
      if (retryAfterSeconds > 60) {
        isDailyOrFreeTier = true;
      }
    }

    const friendlyMessage = isDailyOrFreeTier
      ? 'Google AI Studio Free Tier has no quota for Gemini image models (limit: 0) or daily quota is exceeded. Direct generation requires a Pay-as-you-go project in Google AI Studio.'
      : 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.';

    return new QuotaExhaustedError(
      friendlyMessage,
      retryAfterSeconds,
      error,
      isDailyOrFreeTier,
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

  // Capability not supported / tier lacks image generation support
  if (
    lowerMsg.includes('unsupported_capability') ||
    lowerMsg.includes('image_generation_not_supported') ||
    (lowerMsg.includes('tier') && lowerMsg.includes('does not support')) ||
    (lowerMsg.includes('image') && lowerMsg.includes('permission_denied_for_capability'))
  ) {
    return new AiUnsupportedCapabilityError(
      'Configured AI provider key does not support direct image generation',
      'image_generation',
      error,
    );
  }

  // Model not found or unavailable for text
  if (
    lowerMsg.includes('not found') ||
    lowerMsg.includes('not supported') ||
    lowerMsg.includes('unsupported model') ||
    lowerMsg.includes('method not allowed') ||
    lowerMsg.includes('has not used the model') ||
    lowerMsg.includes('is not available')
  ) {
    return new ProviderUnavailableError(
      `AI model error: ${message}`,
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

  private async executeGenerateImage(
    model: string,
    prompt: string,
    aspectRatio: string,
    signal?: AbortSignal,
  ): Promise<ImageGenerationResult> {
    const dims = parseImageDimensions(aspectRatio);

    // If Gemini multimodal model (gemini-3.1-flash-image, gemini-3-pro-image, etc.)
    if (model.startsWith('gemini-')) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        this.apiKey,
      )}`;

      const fetchInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: dims.apiRatio,
              imageSize: '1K',
            },
          },
        }),
      };
      if (signal) {
        fetchInit.signal = signal;
      }

      const res = await fetch(url, fetchInit);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google Gemini Image API error (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const candidate = json.candidates?.[0];

      if (candidate?.finishReason === 'SAFETY' || json.promptFeedback?.blockReason) {
        throw new ContentSafetyBlockedError(
          'Image prompt or generation was blocked by safety filters',
          candidate?.finishReason || json.promptFeedback?.blockReason,
        );
      }

      interface GeminiCandidatePart {
        inlineData?: { data?: string; mimeType?: string } | undefined;
        inline_data?: { data?: string; mime_type?: string } | undefined;
        text?: string | undefined;
      }
      const parts = (candidate?.content?.parts || []) as GeminiCandidatePart[];
      const imagePart = parts.find(
        (p) => p.inlineData?.data || p.inline_data?.data,
      );
      const b64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
      const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png';

      if (!b64) {
        throw new Error('No image bytes returned in Gemini response');
      }

      const buffer = Buffer.from(b64, 'base64');
      return {
        imageBuffer: buffer,
        base64Data: b64,
        mimeType,
        prompt,
        width: dims.width,
        height: dims.height,
      };
    }

    // Legacy Imagen model (:predict endpoint)
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
    if (signal) {
      fetchInit.signal = signal;
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
      width: dims.width,
      height: dims.height,
    };
  }

  async generateImage(
    prompt: string,
    options?: GenerateImageOptions,
  ): Promise<ImageGenerationResult> {
    const primaryModel = options?.model || aiConfig.models.image;
    const aspectRatio = options?.aspectRatio || '16:9';

    try {
      return await this.executeGenerateImage(primaryModel, prompt, aspectRatio, options?.signal);
    } catch (primaryErr) {
      // If primary model failed due to 404 or model not found, try fallback
      const errMsg = primaryErr instanceof Error ? primaryErr.message.toLowerCase() : '';
      const isNotFound = errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('not supported');

      if (isNotFound) {
        const fallbackModel = primaryModel.startsWith('gemini-')
          ? 'imagen-3.0-generate-002'
          : 'gemini-3.1-flash-image';

        try {
          logger.warn(
            { primaryModel, fallbackModel, primaryErr },
            'Primary image model failed with not found; attempting fallback model',
          );
          return await this.executeGenerateImage(fallbackModel, prompt, aspectRatio, options?.signal);
        } catch {
          // If fallback also fails, throw normalized primary error
          throw normalizeGeminiError(primaryErr);
        }
      }

      throw normalizeGeminiError(primaryErr);
    }
  }
}

function parseImageDimensions(ratio: string): { width: number; height: number; apiRatio: string } {
  switch (ratio) {
    case '1:1':
      return { width: 1024, height: 1024, apiRatio: '1:1' };
    case '4:5':
      return { width: 800, height: 1000, apiRatio: '3:4' };
    case '3:4':
      return { width: 768, height: 1024, apiRatio: '3:4' };
    case '4:3':
      return { width: 1024, height: 768, apiRatio: '4:3' };
    case '9:16':
      return { width: 720, height: 1280, apiRatio: '9:16' };
    case '16:9':
    default:
      return { width: 1200, height: 675, apiRatio: '16:9' };
  }
}
