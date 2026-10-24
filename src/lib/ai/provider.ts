import { z } from 'zod';

export interface TokenUsage {
  promptTokens?: number | undefined;
  completionTokens?: number | undefined;
  totalTokens?: number | undefined;
}

export interface GenerateTextOptions {
  model?: string | undefined;
  systemInstruction?: string | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
  signal?: AbortSignal | undefined;
}

export interface GenerateStructuredOptions<T> extends GenerateTextOptions {
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  schemaName?: string | undefined;
  schemaDescription?: string | undefined;
}

export interface GenerateImageOptions {
  model?: string | undefined;
  aspectRatio?: ('1:1' | '16:9' | '9:16' | '4:5') | undefined;
  numberOfImages?: number | undefined;
  signal?: AbortSignal | undefined;
}

export interface TextGenerationResult {
  text: string;
  usage?: TokenUsage;
}

export interface StructuredGenerationResult<T> {
  data: T;
  rawText?: string;
  usage?: TokenUsage;
}

export interface ImageGenerationResult {
  imageBuffer?: Buffer | undefined;
  imageUrls?: string[] | undefined;
  base64Data?: string | undefined;
  mimeType: string;
  prompt: string;
  altText?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

export interface ImageCapabilityStatus {
  supported: boolean;
  model: string;
  providerId: string;
  reason?: string | undefined;
}

/**
 * Unified provider abstraction interface.
 * All AI provider implementations (Gemini, Fake, etc.) must implement this contract.
 */
export interface AiProviderAdapter {
  readonly providerId: string;

  /**
   * Performs a minimal, low-cost verification call to validate that an API key is functional.
   */
  validateKey(apiKey: string): Promise<boolean>;

  /**
   * Generates unstructured natural language text from a prompt.
   */
  generateText(
    prompt: string,
    options?: GenerateTextOptions,
  ): Promise<TextGenerationResult>;

  /**
   * Generates structured data rigorously validated against a Zod schema.
   */
  generateStructured<T>(
    prompt: string,
    options: GenerateStructuredOptions<T>,
  ): Promise<StructuredGenerationResult<T>>;

  /**
   * Generates an image or returns generated visual asset data from a prompt.
   */
  generateImage(
    prompt: string,
    options?: GenerateImageOptions,
  ): Promise<ImageGenerationResult>;

  /**
   * Checks whether the configured provider key supports direct image generation.
   */
  checkImageCapability?(): Promise<ImageCapabilityStatus>;
}
