# Implementation Plan: Project Foundation

**Branch**: `001-project-foundation` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-project-foundation/spec.md`

---

## Summary

Set up the Saouti repository so any developer can clone it, run one command, and reach a
live `/health` endpoint within 15 minutes. The foundation includes: a Next.js + TypeScript
monorepo with a separate worker process; PostgreSQL managed via Drizzle ORM with versioned
SQL migrations (Users table only); Redis + BullMQ for background jobs; Docker Compose for
the local environment; GitHub Actions CI that blocks merges on lint, type, test, build,
and secret-scan failures; Zod-validated startup config; and Pino structured logging with
a declarative redaction list for secrets and user content.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS, Drizzle ORM, BullMQ, Pino, Zod, Vitest, Playwright
**Storage**: PostgreSQL 16 (primary DB via Drizzle), Redis 7 (job queue + worker heartbeat via BullMQ)
**Testing**: Vitest (unit, 80% line / 90% branch on security paths), Playwright (e2e)
**Target Platform**: Linux server (Hostinger VPS); local dev via Docker Compose on Linux/macOS/WSL 2
**Project Type**: web (Next.js app + worker in single repository)
**Performance Goals**: `/health` response ≤ 500 ms; first CI run completes in ≤ 10 min
**Constraints**: All tooling free/OSS except Hostinger VPS; no user-facing UI in this epic
**Scale/Scope**: Foundation only — 1 DB table, 1 API route, 1 job type

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Answer each gate with ✅ Pass, ⚠️ Needs work, or ❌ Fail. A single ❌ blocks progress.

| #   | Principle                        | Gate question                                                                                                                                                            | Status                                                                                                                                                                                       |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Spec-First Governance**        | Does this feature have a completed `spec.md` reviewed by `/03-speckit.clarify` and a consistency report from `/06-speckit.analyze`?                                      | ✅ spec.md complete; clarifications resolved inline as documented assumptions                                                                                                                |
| 2   | **Security & Privacy First**     | Are API keys encrypted at rest and never exposed to the browser/logs? Is all user content passed as tagged data blocks, not instructions? Are queries scoped by user id? | ✅ No AI calls or user content in this epic. Encryption key validated via Zod. Logger redaction list covers all secret patterns. No cross-user queries possible with single-user foundation. |
| 3   | **Test Discipline**              | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed before or alongside implementation tasks in `tasks.md`?                           | ✅ All 3 user stories have G/W/T scenarios and explicit test plans. Test tasks will be listed first in tasks.md.                                                                             |
| 4   | **Provider Independence**        | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction interface?                                                | ✅ No AI calls in this epic. Config module (Zod) is the pattern for future provider config.                                                                                                  |
| 5   | **Transparency**                 | Are all agent events streamed via SSE? Is the activity timeline accurate?                                                                                                | ✅ No agent activity in this epic. SSE infrastructure is out of scope.                                                                                                                       |
| 6   | **Accessibility & Localisation** | Are all new UI strings externalised? Is RTL handled? Do components meet WCAG AA?                                                                                         | ✅ No user-facing UI in this epic. A11Y/i18n explicitly deferred per spec.                                                                                                                   |
| 7   | **Simplicity**                   | Are all new dependencies free/OSS? Is any new abstraction solving a present problem?                                                                                     | ✅ All dependencies are free/OSS. No speculative abstractions — every component (config, logger, db, queue, health route) solves a concrete, present requirement.                            |
| 8   | **Quality Gates**                | Will lint → type-check → tests → a11y → build all pass?                                                                                                                  | ✅ GitHub Actions CI enforces all gates. Gitleaks covers secret scanning. Coverage thresholds enforced by Vitest.                                                                            |

**Post-design re-check (Phase 1):** All gates remain ✅. No violations introduced by the design.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-project-foundation/
├── spec.md              ← Feature specification
├── plan.md              ← This file
├── research.md          ← All technology decisions with rationale
├── data-model.md        ← User entity + migration schema + BullMQ job schema
├── quickstart.md        ← Developer setup guide (satisfies FR-001)
├── contracts/
│   └── health.openapi.yaml  ← OpenAPI 3.1 contract for GET /health
├── checklists/
│   └── requirements.md ← Spec quality checklist (all items pass)
└── tasks.md             ← Generated by /05-speckit.tasks (not yet)
```

### Source Code (repository root)

```text
saouti/                        ← Repository root
├── .env.example               ← Required + optional env vars with safe defaults
├── .github/
│   └── workflows/
│       └── ci.yml             ← GitHub Actions: lint → type-check → test → build → secret-scan
├── .specify/
│   └── memory/
│       └── constitution.md
├── docker-compose.yml         ← Services: app, worker, db, redis
├── Dockerfile                 ← Multi-stage: deps → builder → app + worker targets
├── CONTRIBUTING.md            ← Branch/commit conventions + speckit workflow
├── README.md                  ← Prerequisites + quickstart (FR-001)
├── eslint.config.ts           ← ESLint flat config
├── prettier.config.ts         ← Prettier config
├── vitest.config.ts           ← Vitest + coverage thresholds
├── playwright.config.ts       ← Playwright e2e config
├── tsconfig.json              ← strict mode, paths, target ESNext
├── drizzle.config.ts          ← Drizzle Kit config (migrations dir, DB URL)
├── package.json
├── pnpm-lock.yaml
├── specs/
├── src/
│   ├── app/                   ← Next.js App Router
│   │   ├── layout.tsx         ← Root layout (minimal, no UI yet)
│   │   ├── page.tsx           ← Root page (placeholder redirect or 200)
│   │   └── api/
│   │       └── health/
│   │           └── route.ts   ← GET /health (FR-005)
│   ├── worker/
│   │   └── index.ts           ← Worker entrypoint: connects queue, registers processors
│   └── lib/
│       ├── config.ts          ← Zod schema + validated env export (FR-004)
│       ├── logger.ts          ← Pino instance with redact list (FR-010, FR-011)
│       ├── request-context.ts ← AsyncLocalStorage for requestId (FR-009)
│       ├── db/
│       │   ├── client.ts      ← Drizzle + pg pool (connection pool, not singleton)
│       │   ├── schema.ts      ← users table DDL (D-03)
│       │   ├── migrate.ts     ← Migration runner with advisory lock (FR-007, edge case 3)
│       │   └── migrations/    ← Generated SQL files (gitignored from hand-edits)
│       │       ├── 0001_create_users.sql
│       │       └── meta/
│       └── queue/
│           ├── client.ts      ← BullMQ Queue("saouti") instance
│           └── worker.ts      ← BullMQ Worker + health-check processor (FR-008)
└── tests/
    ├── unit/
    │   ├── config.test.ts     ← Zod validation — missing/invalid vars (US1)
    │   ├── logger.test.ts     ← Redaction — all sensitive key patterns (US3)
    │   └── request-context.test.ts ← requestId propagation through async context
    └── e2e/
        ├── health.spec.ts     ← GET /health 200 + 503 scenarios (US1, US2)
        └── ci-gates.spec.ts   ← Placeholder; CI gate tests live in .github/workflows
```

**Structure Decision**: Single project (no monorepo workspace packages). The `src/worker/`
directory uses the same `tsconfig.json` as the Next.js app via path aliases. The worker
is compiled and run via `tsx` (zero-compile TypeScript runner for development) and via
`tsc` output in the Docker production build.

---

## Complexity Tracking

> **No constitution violations.** All additions solve present, concrete requirements.

| Component                        | Why Needed                                                                                                               | Simpler Alternative Rejected Because                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Redis (separate from PostgreSQL) | BullMQ requires Redis; also used for worker heartbeat key                                                                | PostgreSQL-backed queue (pg-boss) would work but BullMQ's event bus is a closer fit to the SSE architecture planned in later epics; Redis is already planned in PRD §8.2 |
| Multi-stage Dockerfile           | App + worker share one codebase but need separate process entrypoints; production image must not include devDependencies | A single-stage image would include dev tools and bloat the production image; two separate Dockerfiles would duplicate the build step                                     |

---

## Phase 0 Findings (Research Summary)

All 15 technology decisions are documented with rationale and rejected alternatives in
[`research.md`](./research.md). Key decisions:

| Area             | Choice                    | Key reason                                  |
| ---------------- | ------------------------- | ------------------------------------------- |
| Web framework    | Next.js 15 App Router     | SSR + streaming + RSC, single-package       |
| ORM + migrations | Drizzle ORM + Drizzle Kit | Plain SQL migration files, auditable        |
| Job queue        | BullMQ + Redis            | Durable, retryable, event-bus maps to SSE   |
| Package manager  | pnpm                      | Hard-link store, strict deps, fast CI       |
| Unit tests       | Vitest                    | Native TS + ESM, Jest-compatible API        |
| E2e tests        | Playwright                | Multi-browser, a11y assertions, SSE support |
| Lint + format    | ESLint (flat) + Prettier  | Type-aware rules, no debates on format      |
| Env validation   | Zod                       | Structured errors, inferred types           |
| Logging          | Pino + pino-http          | Fastest JSON logger, declarative redact     |
| Request context  | AsyncLocalStorage         | Built-in Node 20, no extra dependency       |
| Secret scan      | Gitleaks                  | OSS, GitHub Actions native integration      |

---

## Phase 1 Design Decisions

### Config Module (`src/lib/config.ts`)

The Zod schema is the single source of truth for all environment variables. It is
imported by both `src/app` (Next.js) and `src/worker`. The validated object is frozen
on first import to prevent mutation.

```typescript
// Illustrative — not final code
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/, {
    message:
      'ENCRYPTION_KEY must be a 64-character hex string (run: openssl rand -hex 32)',
  }),
  SESSION_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
});

export const config = Object.freeze(schema.parse(process.env));
```

On parse failure, Zod throws a `ZodError` whose `.flatten()` method produces one
error message per field — these are logged to stderr and the process exits with code 1.

### Logger Module (`src/lib/logger.ts`)

```typescript
// Illustrative redact list — covers spec Assumptions §4
const redact = [
  'password',
  'passwordHash',
  'password_hash',
  '*.password',
  '*.passwordHash',
  '*.password_hash',
  'apiKey',
  'api_key',
  '*.apiKey',
  '*.api_key',
  'secret',
  '*.secret',
  'token',
  '*.token',
  'authorization',
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'credential',
  '*.credential',
];
```

The `pino-http` middleware generates a UUID v4 request ID (via `uuid` or
`crypto.randomUUID()`) and injects it into `AsyncLocalStorage`. All subsequent log
calls within the request context inherit the ID automatically.

### Migration Runner (`src/lib/db/migrate.ts`)

```typescript
// Illustrative — acquires advisory lock before running migrations
await sql`SELECT pg_advisory_lock(1)`;
await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
await sql`SELECT pg_advisory_unlock(1)`;
```

The advisory lock key `1` is project-wide. This satisfies edge case 3 (concurrent
worker + app startup both attempting migrations).

### Health Route (`src/app/api/health/route.ts`)

The route probes each dependency independently with a 2-second timeout:

- **Database**: `SELECT 1` via Drizzle raw query
- **Queue**: Redis `PING` via BullMQ's `Queue.client.ping()`
- **Worker**: Read a Redis key `saouti:worker:heartbeat` set by the worker on each
  health-check job completion

If any probe times out or throws, its service status is `"error"` and the aggregate
status is `"degraded"` (for partial failures) or `"error"` (if DB is down).
HTTP status is `503` unless all three services are `"ok"`.

### Docker Compose Design

```yaml
# Key structural decisions (not final YAML)
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U saouti']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']

  app:
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  worker:
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
```

Both `app` and `worker` wait for healthy `db` and `redis` before starting, eliminating
race-condition startup failures.

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml — job order
jobs:
  lint: # eslint + prettier --check
  type-check: # tsc --noEmit
  test: # vitest run --coverage (thresholds enforced)
  e2e: # playwright test (needs: [test], uses service containers)
  build: # next build + tsc worker entrypoint
  secret-scan: # gitleaks/gitleaks-action (runs on all jobs)
```

All jobs run on `ubuntu-latest`. The `test` and `e2e` jobs use GitHub Actions service
containers for `postgres:16` and `redis:7`, so no Docker-in-Docker is required.
`pnpm` store is cached via `actions/setup-node` + `actions/cache`.

---

## Post-Phase-1 Constitution Check

Re-verified after design:

- **Principle 2 (Security)**: Config validation exits before binding any port. Logger
  redact list covers all known sensitive key patterns. `password_hash` is explicitly
  noted in data-model.md as needing explicit exclusion from API serialisers.
- **Principle 7 (Simplicity)**: 15 decisions logged, none introduced without a
  concrete, present requirement. Two complexity entries documented in Complexity
  Tracking table.
- **Principle 8 (Quality Gates)**: CI pipeline covers all 5 failure categories from
  spec US2. Coverage thresholds enforced by Vitest config. All gates ✅.
