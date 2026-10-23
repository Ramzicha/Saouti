# Saouti Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-10-22

## Active Technologies

- TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), `@google/genai` (or `@google/generative-ai`), Drizzle ORM, Zod, Node.js `crypto` (AES-256-GCM) (004-ai-provider-keys)
- PostgreSQL 16 (`api_keys`, `usage_counters`) (004-ai-provider-keys)

- TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), Drizzle ORM 0.38+, `@node-rs/argon2`, `ioredis`, `zod`, `next-intl`, `@tabler/icons-react` (003-accounts-auth)
- PostgreSQL 16 (`users`, `sessions`, `verification_tokens`, `password_reset_tokens`), Redis 7 (sliding-window rate limiting) (003-accounts-auth)

- TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), React 19, Tailwind CSS 3.4, `next-intl` 3.x, `@tabler/icons-react` (or `lucide-react`) for SVG icons, `clsx` + `tailwind-merge` (002-visual-foundation)
- Client cookies (`saouti-theme`, `saouti-locale`) for zero-flash SSR persistence; no database entities needed for Epic 1 (002-visual-foundation)

- TypeScript 5.x (strict) + Node.js 20 LTS (001-project-foundation)
- Next.js 15 App Router, Tailwind CSS, Drizzle ORM, BullMQ, Pino, Zod (001-project-foundation)
- PostgreSQL 16, Redis 7 (001-project-foundation)

## Project Structure

```text
saouti/
├── .env.example
├── .github/workflows/ci.yml
├── .specify/memory/constitution.md
├── docker-compose.yml
├── Dockerfile
├── CONTRIBUTING.md
├── README.md
├── eslint.config.ts
├── prettier.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── package.json
├── pnpm-lock.yaml
├── specs/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/health/route.ts
│   ├── worker/index.ts
│   └── lib/
│       ├── config.ts
│       ├── logger.ts
│       ├── request-context.ts
│       ├── db/
│       │   ├── client.ts
│       │   ├── schema.ts
│       │   ├── migrate.ts
│       │   └── migrations/
│       └── queue/
│           ├── client.ts
│           └── worker.ts
└── tests/
    ├── unit/
    └── e2e/
```

## Commands

```bash
# Install dependencies
pnpm install

# Local development (all services)
docker compose up

# Run unit tests
pnpm test

# Run tests with coverage (80% line / 90% branch on security paths)
pnpm test:coverage

# Run end-to-end tests (requires Docker Compose stack running)
pnpm test:e2e

# Lint
pnpm lint

# Type-check
pnpm type-check

# Generate DB migrations from schema changes
pnpm drizzle-kit generate

# Apply migrations manually (also runs at startup)
pnpm drizzle-kit migrate

# Build for production
pnpm build
```

## Code Style

**TypeScript**: strict mode — no `any`, no `@ts-ignore` without a linked issue and comment.
`noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes` all enabled.

**Imports**: Absolute imports via `@/` alias (maps to `src/`). No relative `../../` imports
beyond one level deep.

**Commits**: Conventional Commits — `feat(scope): message`, `fix(scope): message`,
`chore(scope): message`, `test(scope): message`, `ci(scope): message`.

**Branches**: `###-short-description` format (speckit convention).

**Logging**: Always use `logger` from `src/lib/logger.ts`. Never `console.log` in production code.
Never log a field named `password`, `apiKey`, `secret`, `token`, or `authorization` — the
redaction list catches them, but prefer not creating the field in the first place.

**Environment**: Never access `process.env` directly outside `src/lib/config.ts`.
Always import `config` from `src/lib/config.ts`.

## Recent Changes

- 004-ai-provider-keys: Added TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), `@google/genai`, Drizzle ORM, Zod, AES-256-GCM crypto

- 003-accounts-auth: Added TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), Drizzle ORM 0.38+, `@node-rs/argon2`, `ioredis`, `zod`, `next-intl`, `@tabler/icons-react`

- 002-visual-foundation: Added TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`) + Next.js 15 (App Router), React 19, Tailwind CSS 3.4, `next-intl` 3.x, `@tabler/icons-react` (or `lucide-react`) for SVG icons, `clsx` + `tailwind-merge`

- 001-project-foundation: Added TypeScript 5.x + Node.js 20 LTS + Next.js 15 + Drizzle + BullMQ + Pino + Zod

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
