# Implementation Plan: 003-accounts-auth

**Branch**: `003-accounts-auth` | **Date**: 2026-10-23 | **Spec**: [specs/003-accounts-auth/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/003-accounts-auth/spec.md)
**Input**: Feature specification from `specs/003-accounts-auth/spec.md`

## Summary

Build the complete accounts, authentication, session lifecycle, email verification, password reset, rate limiting, and cascade account deletion system for Saouti. The architecture uses database-backed sessions in PostgreSQL via Drizzle ORM, secure HTTP-only cookies (`saouti-session`), Argon2id password hashing, SHA-256 hashed single-use tokens for 24h email verification and 1h password resets, Redis sliding-window anti-brute-force rate limiting, and transactional email dispatch. Next.js 15 App Router middleware and server actions enforce authenticated route protection (`/`, `/settings`, `/design`) and strict multi-tenant data isolation by scoping all queries to `session.userId`. All user-facing views (`/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/settings/account`) conform to the Saouti Design System with zero-flash light/dark theming and full English, French, and Arabic RTL mirroring.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`)  
**Primary Dependencies**: Next.js 15 (App Router), Drizzle ORM 0.38+, `@node-rs/argon2`, `ioredis`, `zod`, `next-intl`, `@tabler/icons-react`  
**Storage**: PostgreSQL 16 (`users`, `sessions`, `verification_tokens`, `password_reset_tokens`), Redis 7 (sliding-window rate limiting)  
**Testing**: Vitest for unit & integration tests (Argon2id, token hashing, rate limiting, multi-tenant cross-user access tests); Playwright for E2E authentication flows & accessibility audits  
**Target Platform**: Evergreen desktop & mobile browsers; Node.js 20 LTS server  
**Project Type**: Next.js 15 App Router web application with Drizzle ORM and Redis integration  
**Performance Goals**: Argon2id password hashing 250–350 ms; session validation < 10 ms (via indexed session hash / Redis cache); login failure response time constant to mitigate timing attacks  
**Constraints**: Zero plaintext password or token logging (redacted by Pino `logger`); 100% generic auth error messages; zero cross-user data leakage (verified by automated tests); complete cascade purge on deletion with zero orphaned records  
**Scale/Scope**: 4 database tables, 6 core auth flows, 3 localized languages (`en`, `fr`, `ar`), 2 visual themes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle                        | Gate question                                                                                                                                                                        | Status                                                                                                     |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Spec-First Governance**        | Does this feature have a completed `spec.md` reviewed by `/03-speckit.clarify` and a consistency report from `/06-speckit.analyze`?                                                  | ✅ Pass (spec.md approved and ready for planning)                                                          |
| 2   | **Security & Privacy First**     | Are API keys encrypted at rest and never exposed to the browser/logs? Is all user content passed as tagged data blocks, not instructions? Are queries scoped by user id?             | ✅ Pass (Argon2id hashing, SHA-256 token hashes, mandatory `userId` query scoping, cascade deletion purge) |
| 3   | **Test Discipline**              | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed before or alongside implementation tasks in `tasks.md`?                                       | ✅ Pass (acceptance scenarios defined for US1 through US7; cross-user isolation tests scheduled)           |
| 4   | **Provider Independence**        | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction interface?                                                            | ✅ Pass (No direct AI model dependencies in authentication)                                                |
| 5   | **Transparency**                 | Are all agent events streamed via SSE? Is the activity timeline accurate for the deterministic pipeline steps in this feature?                                                       | ✅ Pass (Transparency applied to user account and security audit logs)                                     |
| 6   | **Accessibility & Localisation** | Are all new UI strings externalised to locale files? Is RTL layout handled for Arabic? Do components meet WCAG AA in both themes?                                                    | ✅ Pass (All auth forms localized in `en.json`, `fr.json`, `ar.json`, RTL mirrored, WCAG AA compliant)     |
| 7   | **Simplicity**                   | Are all new dependencies free/OSS? Is any new abstraction solving a present, concrete problem (not speculative)? Is extra infrastructure justified in the Complexity Tracking table? | ✅ Pass (Uses existing PostgreSQL and Redis infrastructure; lightweight OSS libraries)                     |
| 8   | **Quality Gates**                | Will lint → type-check → tests → a11y → build all pass? Are there no unsuppressed lint/TS errors?                                                                                    | ✅ Pass (Full quality gate verification required)                                                          |

## Project Structure

### Documentation (this feature)

```text
specs/003-accounts-auth/
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Requirements verification checklist
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Database schema, state transitions, and API contracts
├── quickstart.md        # Developer setup and test verification guide
└── tasks.md             # Actionable, dependency-ordered tasks (Phase 2 output)
```

### Source Code Architecture

```text
messages/
├── en.json                  # Auth strings (login, signup, reset, errors)
├── fr.json
└── ar.json

src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── settings/
│   │   │   └── account/page.tsx   # Account deletion & security management
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       └── auth/
│           ├── signup/route.ts
│           ├── login/route.ts
│           ├── logout/route.ts
│           ├── verify/route.ts
│           ├── forgot-password/route.ts
│           ├── reset-password/route.ts
│           └── delete-account/route.ts
├── lib/
│   ├── auth/
│   │   ├── password.ts      # Argon2id hashing and verification
│   │   ├── session.ts       # Database session creation, verification, cookie helpers
│   │   ├── tokens.ts        # Crypto single-use token generator & SHA-256 verifier
│   │   ├── rate-limit.ts    # Redis sliding-window brute-force limiter
│   │   └── email.ts         # Transactional email service (Console / Resend)
│   └── db/
│       ├── schema.ts        # users, sessions, verificationTokens, passwordResetTokens
│       └── migrations/      # Drizzle migration SQL files
├── middleware.ts            # Protects private routes with session cookie checks
└── tests/
    ├── unit/
    │   ├── password.test.ts # Argon2id validation and timing
    │   ├── tokens.test.ts   # Token expiration and single-use invalidation
    │   └── rate-limit.test.ts # Redis sliding window thresholds
    ├── integration/
    │   ├── auth-flow.test.ts # Full signup -> verify -> login -> reset -> delete
    │   └── data-isolation.test.ts # Proof that User A cannot access User B's records
    └── e2e/
        └── auth.spec.ts     # Playwright e2e auth tests in English and Arabic
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because                                                 |
| --------- | ---------- | ------------------------------------------------------------------------------------ |
| _None_    | N/A        | Adheres strictly to simplicity principles and utilizes existing PG/Redis foundation. |
