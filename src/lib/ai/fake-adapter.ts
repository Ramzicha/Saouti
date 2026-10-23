import {
  AiProviderAdapter,
  GenerateStructuredOptions,
  TextGenerationResult,
  StructuredGenerationResult,
  ImageGenerationResult,
} from './provider';

export interface FakeProviderOptions {
  simulatedDelayMs?: number;
  mockTextResponse?: string;
  mockStructuredData?: unknown;
  mockImageUrls?: string[];
  validKeys?: string[];
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

  constructor(options: FakeProviderOptions = {}) {
    this.simulatedDelayMs = options.simulatedDelayMs ?? 0;
    this.mockTextResponse =
      options.mockTextResponse ?? 'Simulated natural language response from AI agent.';
    this.mockStructuredData = options.mockStructuredData;
    this.mockImageUrls = options.mockImageUrls ?? [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    ];
    this.validKeys = new Set(options.validKeys ?? []);
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

  async generateImage(
    prompt: string,
  ): Promise<ImageGenerationResult> {
    await this.simulateExecution();
    return {
      imageUrls: [...this.mockImageUrls],
      mimeType: 'image/jpeg',
      prompt,
    };
  }
}
