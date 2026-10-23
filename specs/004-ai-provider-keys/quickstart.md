# Developer Quickstart: 004-ai-provider-keys

This document provides instructions for developers testing and validating the AI provider layer, cryptographic key storage, and contract test suites.

---

## 1. Environment Configuration

Ensure `AI_KEY_ENCRYPTION_SECRET` is defined in `.env` (32 bytes / 64 hex characters):

```bash
# Generate a secure 32-byte master encryption key
node -e "console.log('AI_KEY_ENCRYPTION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Add this key to your `.env` and `.env.example`.

---

## 2. Running Contract & Unit Tests

The test suite validates:
1. **AES-256-GCM Round-Trip**: Encrypts and decrypts keys; asserts plaintext is restored and tampering with the authentication tag or nonce fails verification.
2. **Provider Contract Tests**: Validates that both `GeminiAdapter` (when key provided) and `FakeProviderAdapter` conform to `AiProviderAdapter` for text, structured JSON schemas, and images.
3. **Zero Plaintext Leakage**: Asserts that neither logger outputs, database queries, nor API serializations ever reveal the raw API key.
4. **Retry Backoff with Jitter**: Mocks a 429 response sequence; verifies backoff math, cumulative limit enforcement, and event bus emissions.

```bash
# Run all provider and encryption unit tests
pnpm vitest run tests/unit/ai-keys.test.ts tests/unit/crypto.test.ts tests/unit/retry.test.ts

# Run provider adapter contract tests
pnpm vitest run tests/contract/provider.contract.test.ts
```

---

## 3. Using the Fake Provider in Local Development & Tests

When running tests or developing without a live Gemini key, import the `FakeProviderAdapter`:

```typescript
import { FakeProviderAdapter } from '@/lib/ai/fake-adapter';

const provider = new FakeProviderAdapter({
  simulatedDelayMs: 50,
  mockTextResponse: 'Generated professional post content...',
});

const result = await provider.generateText('Write a brief about AI architecture');
console.log(result.text);
```

To simulate rate limits (HTTP 429) and verify exponential backoff:

```typescript
provider.setSimulatedErrors([
  new QuotaExhaustedError('RESOURCE_EXHAUSTED'),
  new QuotaExhaustedError('RESOURCE_EXHAUSTED'),
]);
```

---

## 4. Testing Key Management Endpoints Locally

Start the local development server:

```bash
pnpm dev
```

1. Log in with a verified account.
2. Navigate to `http://localhost:3000/en/settings/keys`.
3. Open the "Get a Free Key" walkthrough.
4. Submit a valid Gemini key and check the consent box.
5. Confirm the key displays as `••••••••••••••Ab12`.
6. Inspect browser dev tools network tab to verify no plaintext key is ever returned in responses.
