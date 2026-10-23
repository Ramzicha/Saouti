import {
  AiProviderAdapter,
  GenerateStructuredOptions,
  TextGenerationResult,
  StructuredGenerationResult,
  ImageGenerationResult,
  ImageCapabilityStatus,
  GenerateImageOptions,
} from './provider';
import {
  AiUnsupportedCapabilityError,
  QuotaExhaustedError,
  AiSafetyBlockError,
} from './errors';

export type FakeImageBehavior = 'success' | 'unsupported_tier' | 'rate_limit' | 'safety_block';

export interface FakeProviderOptions {
  simulatedDelayMs?: number;
  mockTextResponse?: string;
  mockStructuredData?: unknown;
  mockImageUrls?: string[];
  validKeys?: string[];
  imageBehavior?: FakeImageBehavior;
}

/**
 * Deterministic offline provider adapter for unit testing and contract verification.
 */
export class FakeProviderAdapter implements AiProviderAdapter {
  readonly providerId = 'fake';
  private simulatedErrors: Error[] = [];
  private simulatedDelayMs: number;
  private mockTextResponse: string;
  private mockStructuredData?: unknown;
  private mockImageUrls: string[];
  private validKeys: Set<string>;
  private imageBehavior: FakeImageBehavior;

  constructor(options: FakeProviderOptions = {}) {
    this.simulatedDelayMs = options.simulatedDelayMs ?? 0;
    this.mockTextResponse =
      options.mockTextResponse ?? 'Simulated natural language response from AI agent.';
    this.mockStructuredData = options.mockStructuredData;
    this.mockImageUrls = options.mockImageUrls ?? [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    ];
    this.validKeys = new Set(options.validKeys ?? []);
    this.imageBehavior = options.imageBehavior ?? 'success';
  }

  setImageGenerationBehavior(behavior: FakeImageBehavior): void {
    this.imageBehavior = behavior;
  }

  /**
   * Sets a queue of errors to be thrown sequentially on upcoming generation calls.
   */
  setSimulatedErrors(errors: Error[]): void {
    this.simulatedErrors = [...errors];
  }

  /**
   * Checks for queued simulated errors and delays.
   */
  private async simulateExecution(): Promise<void> {
    if (this.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));
    }
    const nextError = this.simulatedErrors.shift();
    if (nextError) {
      throw nextError;
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    await this.simulateExecution();
    if (!apiKey || apiKey.startsWith('invalid_') || apiKey.length < 10) {
      return false;
    }
    if (this.validKeys.size > 0 && !this.validKeys.has(apiKey)) {
      return false;
    }
    return true;
  }

  async generateText(
    prompt: string,
  ): Promise<TextGenerationResult> {
    await this.simulateExecution();
    return {
      text: `${this.mockTextResponse} (Prompt: ${prompt.slice(0, 30)}...)`,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(this.mockTextResponse.length / 4),
        totalTokens:
          Math.ceil(prompt.length / 4) +
          Math.ceil(this.mockTextResponse.length / 4),
      },
    };
  }

  async generateStructured<T>(
    prompt: string,
    options: GenerateStructuredOptions<T>,
  ): Promise<StructuredGenerationResult<T>> {
    await this.simulateExecution();

    let rawData: unknown = this.mockStructuredData;

    // If no explicit mock structured data was provided, generate a minimal mock matching the schema
    if (rawData === undefined) {
      try {
        // Attempt empty object parsing to test defaults
        rawData = options.schema.parse({});
      } catch {
        // Fallback placeholder object if required fields exist
        rawData = options.schema.parse({
          title: 'Simulated Title',
          content: 'Simulated Content',
          score: 85,
          feedback: 'Well-structured voice output',
          status: 'pass',
        } as unknown);
      }
    }

    const validatedData = options.schema.parse(rawData);

    return {
      data: validatedData,
      rawText: JSON.stringify(validatedData),
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 50,
        totalTokens: Math.ceil(prompt.length / 4) + 50,
      },
    };
  }

  async checkImageCapability(): Promise<ImageCapabilityStatus> {
    await this.simulateExecution();
    if (this.imageBehavior === 'unsupported_tier') {
      return {
        supported: false,
        model: 'imagen-3.0-generate-002',
        providerId: 'fake',
        reason: 'Provider key does not have image generation entitlement',
      };
    }
    return {
      supported: true,
      model: 'imagen-3.0-generate-002',
      providerId: 'fake',
    };
  }

  async generateImage(
    prompt: string,
    options?: GenerateImageOptions,
  ): Promise<ImageGenerationResult> {
    await this.simulateExecution();

    if (this.imageBehavior === 'unsupported_tier') {
      throw new AiUnsupportedCapabilityError(
        'Configured AI provider key does not support direct image generation',
      );
    }

    if (this.imageBehavior === 'rate_limit') {
      throw new QuotaExhaustedError('AI provider image rate limit exceeded', 20);
    }

    if (this.imageBehavior === 'safety_block') {
      throw new AiSafetyBlockError('Image generation blocked by content safety policy');
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" fill="#ffffff" font-size="24" text-anchor="middle">Generated Image (${options?.aspectRatio || '16:9'})</text></svg>`;
    const buffer = Buffer.from(svg);

    return {
      imageBuffer: buffer,
      imageUrls: [...this.mockImageUrls],
      base64Data: buffer.toString('base64'),
      mimeType: 'image/svg+xml',
      prompt,
      altText: 'Mock generated visual asset',
      width: 800,
      height: 450,
    };
  }
}
