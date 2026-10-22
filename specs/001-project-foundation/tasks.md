# Tasks: Project Foundation

**Input**: Design documents from `specs/001-project-foundation/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Test tasks are included — the spec explicitly requires TDD: tests written before or
alongside implementation code (Principle 3 — Test Discipline).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every implementation task

---

## Phase 1: Setup (Project Initialisation)

**Purpose**: Repository scaffold, tooling configuration, and developer documentation.
No business logic yet — just the skeleton every subsequent task builds on.

- [x] T001 Initialise git repository at repo root: `git init && git commit --allow-empty -m "chore: initial empty commit"`
- [x] T002 Create `package.json` at repo root with `name: "saouti"`, `private: true`, `type: "module"`, `engines: { node: ">=20" }`, and script stubs for `dev`, `build`, `start`, `test`, `test:coverage`, `test:e2e`, `lint`, `type-check`
- [x] T003 [P] Create `pnpm-workspace.yaml` with `packages: []` (single-package workspace — no sub-packages yet)
- [x] T004 [P] Create `tsconfig.json` with `strict: true`, `target: "ESNext"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `paths: { "@/*": ["./src/*"] }`, `include: ["src/**/*", "tests/**/*"]`
- [x] T005 [P] Create `eslint.config.ts` (flat config) importing `eslint-config-next`, `@typescript-eslint/eslint-plugin` (type-aware rules: `no-floating-promises`, `no-misused-promises`), `eslint-config-prettier`
- [x] T006 [P] Create `prettier.config.ts` with `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `plugins: ["prettier-plugin-tailwindcss"]`
- [x] T007 [P] Create `vitest.config.ts` configuring `coverage.provider: "v8"`, `coverage.thresholds: { lines: 80, branches: 80 }`, `coverage.include: ["src/**"]`, `test.environment: "node"`
- [x] T008 [P] Create `playwright.config.ts` with `baseURL: "http://localhost:3000"`, `use.trace: "on-first-retry"`, Chromium as primary browser
- [x] T009 [P] Create `drizzle.config.ts` reading `DATABASE_URL` from `process.env`, `out: "src/lib/db/migrations"`, `schema: "src/lib/db/schema.ts"`, `dialect: "postgresql"`
- [x] T010 Create `.env.example` with all required vars documented: `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_KEY` (with openssl generation hint), `SESSION_SECRET`, `PORT`, `NODE_ENV`, `LOG_LEVEL`. Each line has an inline comment describing purpose and format.
- [x] T011 [P] Create `.gitignore` covering: `.env`, `node_modules/`, `.next/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`
- [x] T012 [P] Create `README.md` from `specs/001-project-foundation/quickstart.md` (adapt to repository-root format with badges placeholder, prerequisites table, 8-step setup, common issues table, directory structure)
- [x] T013 [P] Create `CONTRIBUTING.md` documenting: WSL 2 requirement for Windows; `###-short-description` branch naming; Conventional Commits with valid types; speckit workflow (Specify → Clarify → Plan → Tasks → Analyze before any code); PR checklist; test coverage requirements
- [x] T014 [P] Copy `.specify/memory/constitution.md` to repository root `.specify/memory/constitution.md` (already exists — confirm committed to git)
- [x] T015 Install all dependencies via `pnpm install`: `next`, `react`, `react-dom`, `tailwindcss`, `drizzle-orm`, `pg`, `bullmq`, `ioredis`, `pino`, `pino-http`, `zod`, `uuid`; devDependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`, `@types/uuid`, `vitest`, `@vitest/coverage-v8`, `@playwright/test`, `eslint`, `eslint-config-next`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `prettier`, `prettier-plugin-tailwindcss`, `eslint-config-prettier`, `tsx`, `drizzle-kit`, `pino-pretty`

**Checkpoint**: Repository exists with lockfile, all config files present, `pnpm lint` and `pnpm type-check` run (may have no source files yet — that is expected).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure modules that MUST be complete before any user story can be
implemented. All three user stories depend on config, logger, and DB being in place.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [x] T016 Create `src/lib/config.ts`: Zod schema parsing `process.env` with fields `DATABASE_URL` (url), `REDIS_URL` (url), `ENCRYPTION_KEY` (regex `/^[0-9a-f]{64}$/` with descriptive message), `SESSION_SECRET` (min 32 chars), `PORT` (coerce number, default 3000), `NODE_ENV` (enum, default `"development"`), `LOG_LEVEL` (enum `["fatal","error","warn","info","debug","trace"]`, default `"info"`). On `ZodError`, log each field error to `process.stderr` and call `process.exit(1)`. Export frozen `config` object.
- [x] T017 Create `src/lib/logger.ts`: Pino v9 instance with `level: config.LOG_LEVEL`, `timestamp: pino.stdTimeFunctions.isoTime`, and `redact` array covering: `["password", "passwordHash", "password_hash", "*.password", "*.passwordHash", "*.password_hash", "apiKey", "api_key", "*.apiKey", "*.api_key", "secret", "*.secret", "token", "*.token", "authorization", "*.authorization", "req.headers.authorization", "req.headers[\"x-api-key\"]", "credential", "*.credential", "databaseUrl", "*.databaseUrl"]`. In `development` NODE_ENV, pipe through `pino-pretty`. Export named `logger`.
- [x] T018 Create `src/lib/request-context.ts`: `AsyncLocalStorage<{ requestId: string }>` instance. Export `requestContext` store, `getRequestId()` helper (returns stored ID or `"no-request-id"`), and `runWithRequestId(id, fn)` wrapper.
- [x] T019 Create `src/lib/db/client.ts`: Drizzle ORM client using `drizzle(pool, { schema })` where `pool` is a `pg.Pool` constructed from `config.DATABASE_URL`. Export `db` (Drizzle instance) and `pool` (for migration runner and health probe). Set pool `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`.
- [x] T020 Create `src/lib/db/schema.ts`: Drizzle `pgTable("users", {...})` with columns `id` (uuid, primaryKey, `gen_random_uuid()`), `email` (varchar 320, notNull, unique), `passwordHash` (varchar 255, notNull), `createdAt` (timestamptz, notNull, defaultNow), `updatedAt` (timestamptz, notNull, defaultNow). Export `users` table, `User` type, `NewUser` type.
- [x] T021 Create `src/lib/db/migrate.ts`: Import `migrate` from `drizzle-orm/node-postgres/migrator`. Acquire PostgreSQL advisory lock `pg_advisory_lock(12345)` before running migrations, release with `pg_advisory_unlock(12345)` in a `finally` block. Log migration start/complete/skip with `logger`. Call `process.exit(1)` on migration error. Export `runMigrations()` async function.
- [x] T022 Generate initial migration by running `pnpm drizzle-kit generate` — this creates `src/lib/db/migrations/0001_create_users.sql` and `src/lib/db/migrations/meta/`. Commit the generated files.
- [x] T023 Create `src/lib/queue/client.ts`: Export `saoutiQueue` as a `new Queue("saouti", { connection: new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null }) })`.
- [x] T024 Create `src/lib/queue/worker.ts`: Export `createWorker()` that returns a `new Worker("saouti", processor, { connection: new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null }) })`. Register `health-check` job processor: writes `Date.now()` string to Redis key `saouti:worker:heartbeat` using the same IORedis connection. Log job start/complete/fail events using `logger` with `jobId` and `jobName` fields (no payload logging).

**Checkpoint**: Foundation ready — `src/lib/` modules exist and compile. `pnpm type-check` passes. No user story work until here.

---

## Phase 3: User Story 1 — Fresh Developer Onboarding (Priority: P1) 🎯 MVP

**Goal**: Any developer can clone, populate `.env`, run one command, and reach `/health` returning
`200 OK` within 15 minutes. Config validated at startup; DB migrates automatically; all 4 services
start in correct order.

**Independent Test**: `docker compose up` → wait for healthy state → `curl http://localhost:3000/health` returns `{"status":"ok",...}`. Run `docker compose down -v && docker compose up` twice to verify idempotent migrations.

### Tests for User Story 1 ⚠️ Write first — verify they FAIL before T031

- [x] T025 [P] [US1] Write unit test `tests/unit/config.test.ts`: test `config.ts` Zod validation — assert `process.exit(1)` called for each missing required field individually (`DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_KEY`, `SESSION_SECRET`); assert wrong `ENCRYPTION_KEY` format (too short, non-hex) fails with descriptive message; assert valid `.env` produces frozen config object with correct types
- [x] T026 [P] [US1] Write e2e test `tests/e2e/health.spec.ts`: (a) `GET /health` with all services up returns `200` and JSON matching `HealthResponse` schema from `contracts/health.openapi.yaml`; (b) assert `services.database.status === "ok"`, `services.queue.status === "ok"`, `services.worker.status === "ok"`; (c) assert `responseTime` header present; (d) idempotent migration test: restart app container, assert `/health` still returns `200` without migration errors in logs

### Implementation for User Story 1

- [x] T027 [US1] Create `src/app/layout.tsx`: minimal root layout (`<html lang="en"><body>{children}</body></html>`), no styling yet
- [x] T028 [US1] Create `src/app/page.tsx`: placeholder returning `<main><p>Saouti</p></main>` (no redirect — keeps the route valid for the build step)
- [x] T029 [US1] Create `src/app/api/health/route.ts`: `GET` Route Handler that probes (a) DB: `SELECT 1` via `db.execute(sql\`SELECT 1\`)`with 2 s timeout; (b) Queue:`saoutiQueue.client.ping()`with 2 s timeout; (c) Worker heartbeat: read Redis key`saouti:worker:heartbeat`— if value is within last 60 s, status`"ok"`, else `"unknown"`. Aggregate: `"ok"`only if all three are`"ok"`. Return `200`or`503`per`contracts/health.openapi.yaml`. Log the probe using `logger`with`requestId`from`getRequestId()`. Do NOT log sensitive headers.
- [x] T030 [US1] Create `src/worker/index.ts`: worker entrypoint — call `runMigrations()` first, then `createWorker()`. Enqueue a `health-check` job every 30 s using `saoutiQueue.add("health-check", {}, { repeat: { every: 30000 } })`. Log worker start with `logger`. Handle `SIGTERM`/`SIGINT` for graceful shutdown (close Worker, drain queue, close pool).
- [x] T031 [US1] Add `pino-http` middleware to Next.js: create `src/middleware.ts` (Next.js middleware) that generates a UUID v4 request ID via `crypto.randomUUID()`, sets it as `x-request-id` response header, and seeds `requestContext` via `runWithRequestId`. Use `pino-http` in the health route handler or a shared wrapper function.
- [x] T032 [US1] Create `docker-compose.yml` with four services: `db` (postgres:16-alpine, healthcheck `pg_isready -U saouti`, volume `pgdata`), `redis` (redis:7-alpine, healthcheck `redis-cli ping`), `app` (build target `app`, `depends_on: db/redis service_healthy`, env from `.env`, port `3000:3000`, volume mount `./src:/app/src` for hot reload), `worker` (build target `worker`, same depends_on, no public ports). Define named volumes `pgdata` and `redis-data`.
- [x] T033 [US1] Create `Dockerfile` with four stages: `base` (node:20-alpine, pnpm install), `deps` (copy lockfile + package.json, `pnpm install --frozen-lockfile`), `builder` (copy all source, `pnpm build`), `app` target (copy `.next/`, start with `node server.js`), `worker` target (copy `src/worker/`, start with `tsx src/worker/index.ts` in prod or `node dist/worker/index.js`)
- [x] T034 [US1] Add `next.config.ts` (or `next.config.js`): set `output: "standalone"` for Docker production build compatibility; add `serverExternalPackages: ["pino", "pg"]` to prevent Next.js from bundling native Node.js modules

**Checkpoint**: `docker compose up` starts all 4 services; `curl localhost:3000/health` returns `{"status":"ok",...}`; `pnpm test` passes T025; `pnpm test:e2e` passes T026.

---

## Phase 4: User Story 2 — CI Pipeline Blocks Bad Code (Priority: P1)

**Goal**: A PR containing a lint error, type error, failing test, broken build, or committed secret
is automatically blocked. Each failure category produces a distinct, named CI failure.

**Independent Test**: Push 5 synthetic bad commits (one per category) to a test branch; each MUST show a distinct failed GitHub Actions check within 10 minutes.

### Tests for User Story 2 ⚠️ Write first — verify they FAIL before T040

- [x] T035 [P] [US2] Write CI validation script `tests/ci/validate-ci-config.ts` (run via `tsx`): parse `.github/workflows/ci.yml` and assert all 5 job names exist (`lint`, `type-check`, `test`, `build`, `secret-scan`); assert `test` job has `coverage` flag; assert `secret-scan` uses `gitleaks/gitleaks-action`; assert `pnpm` cache step present in at least one job

### Implementation for User Story 2

- [x] T036 [US2] Create `.github/workflows/ci.yml`: job `lint` — `pnpm lint` + `pnpm exec prettier --check .`; job `type-check` — `pnpm type-check`; job `test` — `pnpm test:coverage` with `postgres:16` and `redis:7` service containers (env vars from GitHub secrets); job `build` — `pnpm build`; job `secret-scan` — `gitleaks/gitleaks-action@v2` with `fail: true`. All jobs use `ubuntu-latest`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with Node 20, `actions/cache` for pnpm store.
- [x] T037 [US2] Add `vitest.config.ts` coverage enforcement: set `coverage.thresholds.lines: 80`, `coverage.thresholds.branches: 80`. Add security-path override in `vitest.config.ts`: files matching `src/lib/config.ts` and `src/lib/logger.ts` MUST reach `branches: 90` (use `coverage.thresholds["src/lib/config.ts"]` and `coverage.thresholds["src/lib/logger.ts"]` per-file thresholds).
- [x] T038 [US2] Create `.gitleaks.toml` config: extend the default ruleset; add allowlist for `.env.example` (contains safe placeholder values, not real secrets); set `verbose: true` so CI output names the exact file and line on failure.
- [x] T039 [US2] Add branch protection documentation to `CONTRIBUTING.md`: note that `main` branch requires all CI checks to pass and at least 1 approval; document how to re-run failed checks; add example of a failing secret-scan output and how to fix it.

**Checkpoint**: Open a test PR with a deliberate ESLint error → `lint` job fails. Revert and add a `process.env.PASSWORD = "s3cr3t"` string → `secret-scan` fails. Revert → all checks green.

---

## Phase 5: User Story 3 — Structured Redacted Logging (Priority: P2)

**Goal**: Every log line from `app` and `worker` is valid JSON, carries a `requestId`, and contains
no sensitive values in plain text. Developers can trace any request end-to-end by `requestId` alone.

**Independent Test**: `docker compose up` → `curl -H "Authorization: Bearer my-secret-token" localhost:3000/health` → inspect app log output via `docker compose logs app` → assert every line is valid JSON, `requestId` field is present and consistent, no line contains `my-secret-token`.

### Tests for User Story 3 ⚠️ Write first — verify they FAIL before T047

- [x] T040 [P] [US3] Write unit test `tests/unit/logger.test.ts`: for each sensitive key pattern (`password`, `passwordHash`, `apiKey`, `api_key`, `secret`, `token`, `authorization`, `credential`), create a log object with that field set to `"plain-text-value"`, serialise via Pino, and assert the output JSON contains `"[Redacted]"` not `"plain-text-value"`. Assert all emitted log lines are valid JSON. Assert `databaseUrl` field is redacted.
- [x] T041 [P] [US3] Write unit test `tests/unit/request-context.test.ts`: assert `runWithRequestId("test-id", fn)` makes `getRequestId()` return `"test-id"` inside `fn`; assert `getRequestId()` outside context returns `"no-request-id"`; assert context is isolated between concurrent async calls (run 2 parallel `runWithRequestId` calls with different IDs, assert each sees only its own ID).
- [x] T042 [P] [US3] Extend `tests/e2e/health.spec.ts` with log-inspection assertions: capture `docker compose logs app --no-color` after a `/health` request; parse each line as JSON; assert `requestId` field is present and matches the `x-request-id` response header; assert no line contains the string `"Bearer"` or any value from the sensitive-field list.

### Implementation for User Story 3

- [x] T043 [US3] Extend `src/lib/logger.ts` with `pino-http` integration: export `httpLogger` = `pinoHttp({ logger, genReqId: () => crypto.randomUUID(), customSuccessMessage: (req, res) => \`${req.method} ${req.url} ${res.statusCode}\`, customErrorMessage: (req, res, err) => \`${req.method} ${req.url} ${res.statusCode} — ${err.message}\` })`. Ensure request ID from `genReqId`is stored into`requestContext`via`runWithRequestId` so it propagates to all downstream log calls.
- [x] T044 [US3] Update `src/app/api/health/route.ts` to attach `pino-http` / retrieve request ID: at top of handler call `getRequestId()` and add `requestId` to every `logger.info()`/`logger.error()` call in the handler. Ensure no probe error object dumps a connection string.
- [x] T045 [US3] Extend `src/worker/index.ts` log calls: every BullMQ Worker event (`active`, `completed`, `failed`, `stalled`) MUST log `{ jobId, jobName, requestId: getRequestId() }` — with no `data` payload field. On `failed` event, log `err.message` and `err.name` but NOT `err.stack` in production (`NODE_ENV === "production"`).
- [x] T046 [US3] Create `src/lib/logger.ts` production serialiser override: add `serializers: { err: pino.stdSerializers.err }` and a custom `req` serialiser that removes `req.headers.authorization`, `req.headers["x-api-key"]`, and `req.headers.cookie` before logging (belt-and-suspenders on top of `redact`).

**Checkpoint**: All three unit tests pass (T040, T041, T042). `docker compose logs app` after a request shows only valid JSON lines with `requestId`. Sensitive header values are `[Redacted]`.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Mandatory compliance checks and documentation polish that span all user stories.

### Security & Privacy (Principle 2)

- [x] T047 [P] Security review: grep `src/` for any `process.env.` access outside `src/lib/config.ts` — fix any found instances to import `config` instead
- [x] T048 [P] Security review: grep `src/` and `tests/` for `console.log` — replace all with `logger.*` calls
- [x] T049 Prompt-injection check: confirm `src/app/api/health/route.ts` does not include any user-supplied input in its response body (health route is safe by construction — document this)

### Accessibility & Localisation (Principle 6)

- [x] T050 [P] I18N: confirm no hardcoded user-facing strings exist in `src/app/` (only the placeholder `<p>Saouti</p>` in `page.tsx` — annotate with a `// TODO(i18n)` comment for the next epic)
- [x] T051 [P] A11Y: the `/health` endpoint is JSON-only — document in `contracts/health.openapi.yaml` that it has no HTML surface and is therefore exempt from WCAG checks

### Quality Gates (Principle 8)

- [x] T052 [P] Lint — run `pnpm lint` and `pnpm exec prettier --check .` on all files; fix all violations
- [x] T053 [P] Type-check — run `pnpm type-check`; resolve all TS errors
- [x] T054 All test suites pass: `pnpm test` (unit, 80%/90% thresholds) and `pnpm test:e2e` (health + log assertions)
- [x] T055 Production build succeeds: `pnpm build` exits 0; `docker compose build` exits 0 for both `app` and `worker` targets
- [x] T056 Run quickstart.md validation: follow each step in `specs/001-project-foundation/quickstart.md` from a freshly cloned directory; record any step that fails and fix it

### Documentation

- [x] T057 [P] Update `README.md` with actual pnpm commands confirmed working during T056 validation
- [x] T058 [P] Add `GEMINI.md` badge/link to `README.md` pointing to constitution and CONTRIBUTING guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 complete — blocks ALL user stories
- **US1 (Phase 3)**: Depends on Phase 2 — can start immediately after Foundation
- **US2 (Phase 4)**: Depends on Phase 2 — can start immediately after Foundation (parallel with US1 if team capacity allows)
- **US3 (Phase 5)**: Depends on Phase 2 + US1 complete (logger is extended from the http middleware built in T031/T043)
- **Polish (Phase N)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Foundation → US1. No dependency on US2 or US3.
- **US2 (P1)**: Foundation → US2. No dependency on US1 or US3 (CI config is independent of app code).
- **US3 (P2)**: Foundation + US1 → US3. Extends `logger.ts` and `health/route.ts` built in US1.

### Within Each User Story

- **Tests MUST be written and confirmed FAILING before implementation tasks in the same story**
- Foundational modules (T016–T024) before any user story implementation
- `config.ts` (T016) before `logger.ts` (T017) — logger imports config for log level
- `db/client.ts` (T019) before `db/migrate.ts` (T021) — migrate imports client
- `db/schema.ts` (T020) before `drizzle-kit generate` (T022) — schema drives migration generation
- `queue/client.ts` (T023) before `queue/worker.ts` (T024) — worker imports queue client
- `src/app/api/health/route.ts` (T029) before extending it in US3 (T044)

### Parallel Opportunities

**Phase 1** (all [P] tasks can run simultaneously):
T003, T004, T005, T006, T007, T008, T009, T011, T012, T013, T014

**Phase 2** (sequential by dependency chain):
T016 → T017, T018 (parallel) → T019, T020 (parallel) → T021, T022 (sequential) → T023 → T024

**Phase 3 tests** (parallel before implementation):
T025, T026 (parallel — write both tests before any implementation)

**Phase 5 tests** (parallel before implementation):
T040, T041, T042 (all three can be written in parallel)

**Polish** (parallel):
T047, T048, T050, T051, T052, T053 all touch different files

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup (T001–T015)
2. Complete Phase 2: Foundation (T016–T024)
3. Complete Phase 3: US1 — tests first (T025–T026), then implementation (T027–T034)
4. **STOP AND VALIDATE**: `docker compose up` → `/health` returns `200` → unit + e2e tests pass
5. Complete Phase 4: US2 — CI config (T035–T039)
6. **STOP AND VALIDATE**: Push test PR → CI runs → all checks green
7. Deploy foundation branch to staging

### Full Delivery (add US3)

8. Complete Phase 5: US3 — tests first (T040–T042), then implementation (T043–T046)
9. **STOP AND VALIDATE**: Log assertion tests pass; sensitive headers redacted in output
10. Complete Phase N: Polish (T047–T058)
11. Open PR to `main` — all 5 CI gates must pass

### Parallel Team Strategy

With two developers after Foundation is complete:

- **Developer A**: Phase 3 (US1 — Docker, health route, config validation)
- **Developer B**: Phase 4 (US2 — CI pipeline, Gitleaks, coverage thresholds)
- Both merge to feature branch; then Developer A continues with Phase 5 (US3)

---

## Notes

- `[P]` tasks = different files, no dependencies between them — safe to run in parallel
- `[Story]` label maps each task to its user story for traceability back to spec.md
- Tests MUST fail before implementation is written — verify this explicitly
- Commit after each task or logical group using Conventional Commits
- Stop at each **Checkpoint** to validate the story independently before proceeding
- Total tasks: **58** across 5 phases + polish
- Avoid: tasks with vague descriptions, tasks that modify the same file concurrently, cross-story dependencies that break independent testability
