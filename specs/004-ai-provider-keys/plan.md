# Implementation Plan: 004-ai-provider-keys

**Branch**: `004-ai-provider-keys` | **Date**: 2026-10-23 | **Spec**: [specs/004-ai-provider-keys/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/004-ai-provider-keys/spec.md)
**Input**: Feature specification from `specs/004-ai-provider-keys/spec.md`

## Summary

Build the Bring-Your-Own-Key (BYOK) AI provider layer for Saouti. The architecture encrypts user-supplied Google Gemini API keys at rest using AES-256-GCM with a server-side master key (`AI_KEY_ENCRYPTION_SECRET`), a per-record 96-bit random nonce, and an authentication tag. Decryption occurs strictly in server-side process memory at call time. Plaintext keys never reach client storage, network responses, structured logs, or error telemetry; the UI displays only the last four characters. All AI generation calls pass through a unified, vendor-independent `AiProviderAdapter` interface supporting plain text, schema-validated structured JSON output (via Zod schemas), and image generation. Gemini is implemented as the first provider adapter using the official Google GenAI SDK, with model identifiers defined in external configuration (`src/lib/ai/config.ts`) rather than hardcoded constants. Provider errors are normalized into standard Saouti domain error types (`INVALID_API_KEY`, `QUOTA_EXHAUSTED`, `CONTENT_SAFETY_BLOCKED`, `PROVIDER_UNAVAILABLE`, `REQUEST_TIMEOUT`). Transient 429 quota errors are automatically retried using exponential backoff with full jitter (up to 3 retries / 45s total wait), reporting each pause interval as an SSE agent event. An interactive, localized guide in English, French, and Arabic assists users in creating a free Gemini key in Google AI Studio, complete with an explicit acknowledgment of free-tier provider data handling terms. A gatekeeper redirects keyless users to key setup, and an offline `FakeProviderAdapter` guarantees deterministic unit and contract testing.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`)  
**Primary Dependencies**: Next.js 15 (App Router), Drizzle ORM 0.38+, `@google/genai` (or `@google/generative-ai`), `zod`, `next-intl`, `@tabler/icons-react`, Node.js built-in `crypto`  
**Storage**: PostgreSQL 16 (`api_keys`, `usage_counters`)  
**Testing**: Vitest for AES-256-GCM crypto tests, error normalization, retry with jitter, and provider contract tests (`FakeProviderAdapter` and `GeminiAdapter`); Playwright for key management UI and accessibility audits  
**Target Platform**: Node.js 20 LTS server runtime, evergreen desktop & mobile browsers  
**Project Type**: Next.js 15 App Router web application with Drizzle ORM  
**Performance Goals**: Key validation minimal ping < 1.5s; AES-256-GCM decryption overhead < 1ms; backoff jitter evenly distributed across ±20% window  
**Constraints**: Zero plaintext key leakage to logs or client (Constitution Principle 2); zero hardcoded model names in agent features (Principle 4); 100% WCAG AA contrast and trilingual RTL support (Principle 6)  
**Scale/Scope**: 2 database tables (`api_keys`, `usage_counters`), 1 provider adapter interface with 2 implementations (Gemini + Fake), 3 localized languages (`en`, `fr`, `ar`), 4 settings/modal views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` reviewed by `/03-speckit.clarify` and a consistency report from `/06-speckit.analyze`? | ✅ Pass (spec.md completed, clarifications resolved, checklist passing) |
| 2 | **Security & Privacy First** | Are API keys encrypted at rest and never exposed to the browser/logs? Is all user content passed as tagged data blocks, not instructions? Are queries scoped by user id? | ✅ Pass (AES-256-GCM encryption with per-record nonce, last-4 display only, Pino redaction, mandatory `userId` scoping, cascade deletion) |
| 3 | **Test Discipline** | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed before or alongside implementation tasks in `tasks.md`? | ✅ Pass (Given/When/Then scenarios defined for all 8 user stories; fake provider and contract tests prioritized before adapter) |
| 4 | **Provider Independence** | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction interface? | ✅ Pass (`AiProviderAdapter` interface decouples pipeline; model names configured in `src/lib/ai/config.ts`) |
| 5 | **Transparency** | Are all agent events streamed via SSE? Is the activity timeline accurate for the deterministic pipeline steps in this feature? | ✅ Pass (Rate-limit retries emit live countdown SSE events: "Writer · Quota limit reached, retrying in 12s") |
| 6 | **Accessibility & Localisation** | Are all new UI strings externalised to locale files? Is RTL layout handled for Arabic? Do components meet WCAG AA in both themes? | ✅ Pass (Key setup walkthrough and modals localized in `en`, `fr`, and `ar` with RTL mirroring and WCAG AA contrast) |
| 7 | **Simplicity** | Are all new dependencies free/OSS? Is any new abstraction solving a present, concrete problem (not speculative)? Is extra infrastructure justified in the Complexity Tracking table? | ✅ Pass (Uses native Node.js `crypto` for AES-GCM; official Google GenAI FOSS SDK; existing PostgreSQL storage) |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build all pass? Are there no unsuppressed lint/TS errors? | ✅ Pass (Full quality gates strictly enforced prior to merge) |

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-provider-keys/
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Requirements verification checklist
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Technical research & architectural decisions (AES-GCM, SDK, backoff)
├── data-model.md        # Database schema, state transitions, and Zod schemas
├── quickstart.md        # Developer setup, fake provider usage, and contract testing guide
├── contracts/
│   └── api-keys.contract.ts # TypeScript API contracts
└── tasks.md             # Actionable, dependency-ordered tasks (Phase 2 output)
```

### Source Code Architecture

```text
messages/
├── en.json                  # Key management, walkthrough, and error copy
├── fr.json
└── ar.json

src/
├── app/
│   ├── [locale]/
│   │   ├── (workspace)/
│   │   │   └── page.tsx      # Main workspace with key gatekeeper banner
│   │   └── settings/
│   │       └── keys/
│   │           └── page.tsx  # Key management, guided creation walkthrough & usage stats
│   └── api/
│       └── settings/
│           └── keys/
│               ├── route.ts  # GET (summary), POST (verify & save), DELETE (purge)
│               └── usage/
│                   └── route.ts # GET 7-day usage counters
├── components/
│   └── keys/
│       ├── KeySetupDialog.tsx     # Modal/drawer for adding/replacing Gemini key
│       ├── KeyCreationGuide.tsx   # Step-by-step visual guide for Google AI Studio
│       ├── FreeTierNotice.tsx     # Provider terms warning with mandatory consent checkbox
│       └── UsageIndicator.tsx     # 7-day request & quota error chart
├── lib/
│   ├── ai/
│   │   ├── config.ts              # Model names, default parameters, retry settings
│   │   ├── errors.ts              # Normalized domain errors (InvalidApiKey, QuotaExhausted, etc.)
│   │   ├── provider.ts            # AiProviderAdapter interface & common types
│   │   ├── gemini.ts              # Google GenAI SDK adapter implementation
│   │   ├── fake-adapter.ts        # Deterministic offline mock adapter for tests
│   │   └── retry.ts               # Exponential backoff with jitter and event reporting
│   ├── crypto/
│   │   └── key-encryption.ts      # AES-256-GCM encryption, decryption, and key masking
│   └── db/
│       ├── schema.ts              # apiKeys and usageCounters tables
│       └── migrations/            # Drizzle migration SQL files
└── tests/
    ├── unit/
    │   ├── crypto.test.ts         # AES-256-GCM encryption/decryption round-trip & tamper detection
    │   ├── ai-keys.test.ts        # Key masking and zero-plaintext logging assertion
    │   └── retry.test.ts          # Backoff calculation, jitter distribution, retry limits
    └── contract/
        └── provider.contract.test.ts # Contract test suite executed against both Fake & Gemini adapters
```

## Complexity Tracking

> No constitution violations detected. All abstractions address concrete requirements.

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| Application-layer AES-256-GCM | Protects user API keys at rest per Principle 2 without exposing plaintext to DB logs. | Plaintext storage exposes high-value user keys; DB-level pgcrypto puts secrets in SQL statements and DB process memory. |
| `AiProviderAdapter` Interface | Allows zero-refactor provider swapping and deterministic offline testing. | Calling Google SDK directly inside features violates Principle 4 and makes unit testing dependent on live internet/quota. |
| `FakeProviderAdapter` | Enables offline Vitest unit and contract tests in CI without requiring live Gemini API keys. | Real API calls in CI would consume real quotas, introduce network flakiness, and require external secret injection. |
