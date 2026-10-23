# Technical Research: AI Provider Keys and Provider Abstraction Layer

**Feature Branch**: `004-ai-provider-keys`  
**Date**: 2026-10-23  
**Status**: Completed  
**Spec Reference**: [`specs/004-ai-provider-keys/spec.md`](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/004-ai-provider-keys/spec.md)

---

## 1. Cryptographic Key Storage at Rest (AES-256-GCM)

### Decision
Store user-supplied API keys encrypted at rest using **AES-256-GCM** with:
- A 256-bit (32-byte) server-side master key supplied via `AI_KEY_ENCRYPTION_SECRET` in environment variables.
- A unique 96-bit (12-byte) cryptographically random initialization vector (`nonce`) per key record generated using `crypto.randomBytes(12)`.
- A 128-bit (16-byte) authentication tag (`authTag`) produced by AES-GCM to guarantee authenticated encryption and tamper resistance.
- A plaintext masked snippet showing strictly the last four characters (e.g. `••••••••••••••Ab12`) and provider name for UI display.

### Rationale
- Standard AES-256-CBC is vulnerable to padding oracle attacks if not paired with HMAC. AES-256-GCM is an Authenticated Encryption with Associated Data (AEAD) cipher that provides both confidentiality and integrity verification in a single primitive.
- Node.js built-in `crypto` module (`crypto.createCipheriv('aes-256-gcm', key, iv)`) provides native OpenSSL-backed performance with zero external dependency bloat.
- Storing the nonce and auth tag alongside the ciphertext in dedicated database columns allows secure stateless decryption on the server without storing shared initialization state.

### Alternatives Considered
- *Database-level transparent encryption (TDE) / pgcrypto*: Pgcrypto pushes decryption keys into SQL query logs and DB process memory. Node.js application-layer encryption keeps the plaintext key out of PostgreSQL memory and query logs completely.
- *KMS (AWS KMS / GCP Cloud KMS / HashiCorp Vault)*: Adds external paid service dependencies and network round-trips incompatible with Constitution Principle 7 (Simplicity & FOSS-only VPS deployment).

---

## 2. Provider Abstraction Architecture

### Decision
Define a unified TypeScript interface `AiProviderAdapter` in `src/lib/ai/provider.ts`:
```typescript
export interface GenerateTextOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface GenerateStructuredOptions<T> extends GenerateTextOptions {
  schema: z.ZodType<T>;
  schemaName?: string;
  schemaDescription?: string;
}

export interface GenerateImageOptions {
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  numberOfImages?: number;
  signal?: AbortSignal;
}

export interface AiProviderAdapter {
  readonly providerId: string;
  validateKey(key: string): Promise<boolean>;
  generateText(prompt: string, options?: GenerateTextOptions): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }>;
  generateStructured<T>(prompt: string, options: GenerateStructuredOptions<T>): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }>;
  generateImage(prompt: string, options?: GenerateImageOptions): Promise<{ imageUrls: string[]; mimeType: string }>;
}
```

### Rationale
- Completely decouples agent workflow orchestration (Writer, Critic, Art Director) from specific vendor APIs (Principle 4).
- Uses Zod schemas for structured output. With Gemini 1.5/2.0, the schema is transformed to JSON Schema via standard OpenAPI-compatible converters and passed via `responseSchema` and `responseMimeType: "application/json"`. The returned JSON string is validated and parsed through the Zod schema, ensuring strict runtime type safety.
- Enables the creation of `FakeProviderAdapter` that runs synchronously in offline Vitest suites without requiring a network connection or actual Gemini quota.

### Alternatives Considered
- *Vercel AI SDK (`ai` package)*: While popular, it introduces heavy abstractions, changing API versions, and potential vendor lock-in. A focused 150-line internal interface adheres directly to Principle 7 (Simplicity) and Principle 4 (Provider Independence).
- *LangChain / LlamaIndex*: Rejected due to immense bundle weight, debugging complexity, and unneeded meta-agent abstractions.

---

## 3. Gemini SDK Integration & Key Validation

### Decision
Use Google's official `@google/genai` (Google Gen AI SDK for Node.js) or `@google/generative-ai`:
- Models configured via `src/lib/ai/config.ts`:
  - Default Fast/Validation: `gemini-2.0-flash`
  - Default Writer/Reasoning: `gemini-1.5-pro` (or `gemini-2.0-flash` configurable)
  - Default Image Generation: `imagen-3.0-generate-002`
- **Minimal Validation Call**:
  - Validates key by executing a 1-token test prompt (`"ping"`, `maxOutputTokens: 1`) or querying `ai.models.get({ model: "gemini-2.0-flash" })`.
  - Confirms key validity, active quota, and network connectivity in < 1.5 seconds while consuming 1 token (or 0 tokens on metadata).
- **Error Normalization**:
  Maps Google SDK error codes/exceptions to standardized `AiError` subclasses:
  - `400 / 401 / 403 API_KEY_INVALID` -> `InvalidApiKeyError`
  - `429 RESOURCE_EXHAUSTED` -> `QuotaExhaustedError` (retryable)
  - `Safety / Blocked reason` -> `ContentSafetyBlockedError`
  - `500 / 503 / 504` -> `ProviderUnavailableError` (retryable)
  - `AbortError / Timeout` -> `RequestTimeoutError`

### Rationale
- Using official SDK guarantees immediate support for new Gemini features (Gemini 2.0, JSON schemas, Imagen 3).
- Structured error normalization shields upstream orchestration and user interfaces from low-level HTTP codes and raw stack traces.

---

## 4. Exponential Backoff with Jitter & Event Emission

### Decision
Implement a shared retry wrapper `withRetry<T>(operation, options)`:
- Maximum retries: 3.
- Base backoff: 5 seconds.
- Exponential factor: 2x.
- Full jitter: `waitMs = Math.random() * (base * Math.pow(2, attempt))`.
- Cumulative wait cap: 45 seconds.
- **Event Emission**:
  - Emits an event on each retry pause: `{ type: 'agent:paused', agent: currentAgent, reason: 'QUOTA_EXHAUSTED', retryInSeconds: Math.round(waitMs / 1000), attempt, maxAttempts: 3 }`.
  - Sent via the run's SSE event bus so the client UI renders: *"Writer · Quota limit reached, retrying in 12s (Attempt 1 of 3)"*.
  - If attempt 3 fails, throws `QuotaExhaustedError`, saving partial results and halting the run.

### Rationale
- Free-tier Gemini limits operate on a 15 RPM (Requests Per Minute) rolling window. A 5s to 25s backoff with jitter smoothly spans transient spikes without crashing runs.
- Real-time reporting adheres to Principle 5 (Transparency).

---

## 5. Security & Isolation Controls

### Decision
- **Zero Exposure**:
  - API key fields are never selected in public queries.
  - Pino logger redaction list updated to include `encryptedKey`, `apiKey`, `key`, `geminiKey`, `authTag`, `nonce`.
  - API endpoints returning key info only return `{ provider: 'gemini', lastFour: 'Ab12', status: 'active', createdAt: ... }`.
- **Database Cascade & Multi-Tenancy**:
  - All `api_keys` records are scoped with `userId` and foreign key referencing `users.id` with `onDelete: 'cascade'`.
  - Unique constraint on `(userId, provider)` ensuring one active key per provider per user.
- **In-Flight Run Invalidation**:
  - Background worker checks key validity or existence before each sequential agent step (Writer -> Critic -> Art Director). If deleted mid-run, halts immediately and saves partial run outputs.
