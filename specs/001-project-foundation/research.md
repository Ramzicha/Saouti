# Research: Project Foundation

**Feature**: `001-project-foundation`
**Date**: 2026-10-22
**Status**: Complete — all decisions resolved

All technology choices below were provided explicitly by the user in the `/04-speckit.plan`
invocation. This document records the rationale and alternatives considered for each so
the decisions are traceable and reversible.

---

## D-01 — Web Framework: Next.js (App Router) + TypeScript

**Decision**: Next.js 15 with the App Router, TypeScript in `strict` mode.

**Rationale**:
- App Router enables React Server Components (RSCs), streaming, and file-system-based
  routing with layouts — all relevant to Saouti's real-time SSE agent display.
- TypeScript `strict` enforces `null` checks, `noImplicitAny`, and all narrow type
  flags — critical for a security-first codebase where loose typing has historically
  been the source of injection and data-exposure bugs.
- Next.js is the only framework in the JS ecosystem that handles SSR, SSE-friendly
  Route Handlers, and middleware for auth/redirection in a single package, keeping the
  stack minimal (Principle 7 — Simplicity).

**Alternatives considered**:
- *Remix*: Good SSR story and form handling. No built-in RSC streaming. Smaller
  ecosystem. Rejected because App Router's streaming primitives are a better fit for
  the live agent timeline.
- *SvelteKit*: Lighter bundle. Would require the team to context-switch to Svelte
  syntax and a different mental model for state and reactivity. Rejected on team
  cost grounds.
- *Plain Express + React (Vite)*: Maximum control. Rejected because it requires
  assembling SSR, routing, middleware, and build tooling manually — unnecessary
  complexity for a focused product (Principle 7).

---

## D-02 — CSS: Tailwind CSS

**Decision**: Tailwind CSS v4 (or latest stable v3 if v4 is pre-release at build time).

**Rationale**:
- Utility-first CSS eliminates dead styles by default (PurgeCSS built in), keeping
  the production bundle small.
- CSS custom properties can be layered on top for the design-system tokens (light/dark
  theme, RTL spacing) without fighting the framework.
- Tailwind's `rtl:` variant prefix handles Arabic right-to-left layout at the class
  level without extra JavaScript.
- Widely used with Next.js; community examples and plugins are abundant.

**Alternatives considered**:
- *Vanilla CSS (CSS Modules)*: Maximum explicitness. Rejected because it requires
  manually building every utility (gap, flex, grid variants) which is slower and
  produces more per-component boilerplate.
- *CSS-in-JS (styled-components, Emotion)*: Good co-location. Rejected because
  runtime CSS-in-JS conflicts with RSC (server components cannot use React context or
  hooks at render time).

---

## D-03 — Database ORM: Drizzle ORM

**Decision**: Drizzle ORM with SQL migration files (Drizzle Kit).

**Rationale**:
- Drizzle is the only TypeScript ORM that generates plain SQL migration files as its
  primary artifact. This means migrations are readable, diffable, and auditable —
  critical for a security-conscious project.
- The schema is defined in TypeScript and drives both the migration generator and the
  query builder, so the type definitions are the single source of truth.
- Drizzle has minimal runtime overhead (no hidden N+1 patterns, no magic proxy
  objects) and generates near-optimal SQL.
- Full PostgreSQL support including `uuid`, `pgTable`, `timestamp with time zone`.

**Alternatives considered**:
- *Prisma*: More mature, excellent DX, schema-first. Rejected because: (a) migrations
  are stored as binary `.db` state — harder to audit; (b) Prisma Client adds a
  significant bundle size; (c) the Prisma runtime is a separate binary, adding a
  deployment dependency.
- *TypeORM*: Older, decorator-based. Rejected for decorator-heavy syntax that
  conflicts with `strict` TypeScript and adds runtime complexity.
- *Knex (query builder only)*: No type safety on results. Rejected because
  type-unsafe query results are a source of runtime bugs and security issues.

---

## D-04 — Job Queue: Redis + BullMQ

**Decision**: BullMQ backed by Redis (via `ioredis`).

**Rationale**:
- BullMQ provides durable, retryable, prioritised queues with built-in concurrency
  controls — exactly what a multi-agent pipeline needs to avoid quota exhaustion.
- Job lifecycle events (waiting, active, completed, failed, stalled) map directly to
  the SSE agent event schema defined in the PRD (§7.4).
- BullMQ's delay, backoff, and rate-limiter features are built-in, not plugins.
- Redis is already in the stack for session caching; reusing it keeps infrastructure
  minimal (Principle 7).

**Alternatives considered**:
- *PostgreSQL-backed queue (pg-boss, Graphile Worker)*: Eliminates the Redis
  dependency. Rejected at this stage because: (a) high-frequency polling creates
  unnecessary DB load; (b) BullMQ's event bus is a closer fit to the SSE streaming
  architecture; (c) Redis is already planned. May be revisited if Redis proves
  operationally costly.
- *RabbitMQ*: More powerful routing. Rejected because it adds significant
  infrastructure complexity with no benefit for Saouti's simple queue topology
  (Principle 7).

---

## D-05 — Package Manager: pnpm

**Decision**: pnpm with a workspace root `package.json`.

**Rationale**:
- pnpm's hard-link store dramatically reduces `node_modules` disk usage and install
  time — important for Docker layer caching in CI.
- Strict symlink layout prevents phantom dependency access (a package can only import
  what it explicitly declares), which improves security and reproducibility.
- Workspace support allows `packages/` directories to be added later (e.g., a shared
  types package for web and worker) without changing the package manager.

**Alternatives considered**:
- *npm*: Default. Rejected because `node_modules` hoisting allows phantom dependency
  access and installs are slower in CI.
- *Yarn Berry (PnP)*: Similar benefits to pnpm. Rejected because Plug'n'Play
  compatibility with all Next.js internal dependencies has historically been fragile.

---

## D-06 — Unit Testing: Vitest

**Decision**: Vitest with `@vitest/coverage-v8`.

**Rationale**:
- Vitest uses Vite's transform pipeline, so it runs TypeScript tests natively without
  a separate `ts-jest` setup — faster cold starts in CI.
- API-compatible with Jest (`describe`, `it`, `expect`, `vi.fn()`) so developers do
  not need to learn a new assertion API.
- Native ESM support avoids CommonJS/ESM interop issues that plague Jest in modern
  Node.js codebases.
- Coverage via V8 is zero-config and produces accurate branch coverage reports.

**Alternatives considered**:
- *Jest*: Mature, widely documented. Rejected because its CJS-first transformer
  requires extra config for ESM, and the compile step (`ts-jest` or `babel-jest`)
  adds latency.
- *Mocha + Chai*: More composable. Rejected because it requires assembling multiple
  packages (runner, assertion, coverage) compared to Vitest's batteries-included
  approach.

---

## D-07 — End-to-End Testing: Playwright

**Decision**: Playwright (`@playwright/test`) for end-to-end tests.

**Rationale**:
- Playwright supports Chromium, Firefox, and WebKit from a single install, and runs
  in headless mode in CI without extra display server setup.
- Built-in support for accessibility assertions (`toHaveAccessibleName`,
  `toHaveRole`) makes it the natural choice for enforcing Principle 6 (Accessibility)
  in automated tests.
- Network interception and response mocking remove the need for a live AI provider
  during e2e tests.
- Trace viewer makes debugging CI failures fast without running locally.

**Alternatives considered**:
- *Cypress*: Mature, excellent developer experience. Rejected because: (a) Firefox
  and Safari support was added late and is not first-class; (b) Cypress runs in a
  browser iframe, complicating SSE testing; (c) its module format conflicts with
  the ESM-first project setup.
- *Puppeteer*: Chromium only. Rejected for limited browser coverage.

---

## D-08 — Linting and Formatting: ESLint + Prettier

**Decision**: ESLint (flat config, `eslint.config.ts`) + Prettier, integrated via
`eslint-config-prettier` (disables ESLint formatting rules) and
`prettier-plugin-tailwindcss` (class sorting).

**Rationale**:
- ESLint with the Next.js plugin (`eslint-config-next`) catches common React, Next.js,
  and accessibility issues (via `eslint-plugin-jsx-a11y`).
- TypeScript ESLint (`@typescript-eslint/eslint-plugin`) enforces type-aware rules
  that catch real bugs (`no-floating-promises`, `no-misused-promises`).
- Prettier handles all formatting in a single pass — no debates about style.
- Flat config (`eslint.config.ts`) is the modern ESLint format supported from v8.57+
  and the only format in ESLint 9+.

**Alternatives considered**:
- *Biome*: Single tool for lint + format. Considered seriously. Rejected because its
  TypeScript type-aware rules are still maturing and it does not yet replicate all
  `@typescript-eslint` rules needed for strict safety (particularly
  `no-floating-promises` and `no-misused-promises`).
- *Rome (legacy)*: Discontinued; irrelevant.

---

## D-09 — Docker Compose: Local Environment

**Decision**: Docker Compose v2 (`docker compose` CLI, not `docker-compose`)
with four services: `app` (Next.js), `worker` (standalone Node.js process), `db`
(PostgreSQL 16), `redis` (Redis 7).

**Rationale**:
- A single `docker-compose.yml` at the repository root starts all four services with
  one command (`docker compose up`), satisfying FR-002 and SC-001.
- Volume mounts for `node_modules` and the pnpm store are declared explicitly to
  avoid platform-specific permission issues on Linux and macOS.
- A named `healthcheck` on the `db` service delays the `app` and `worker` from
  starting until PostgreSQL is accepting connections — eliminates race conditions.
- Hot reload for the `app` service uses Next.js's built-in watch mode; the `worker`
  uses `tsx watch` (or `ts-node --watch`) to reload on TypeScript changes.

**Alternatives considered**:
- *Local install (no Docker)*: Requires developers to install PostgreSQL and Redis
  manually — rejected for reproducibility reasons and the Windows/WSL 2 target.
- *Dev Containers (VS Code)*: Good DX inside VS Code. Rejected as the sole approach
  because it forces VS Code as the IDE; Docker Compose works in any environment.

---

## D-10 — CI: GitHub Actions

**Decision**: GitHub Actions with a single workflow file
`.github/workflows/ci.yml`, using matrix jobs where possible.

**Rationale**:
- GitHub Actions is the natural CI for a GitHub-hosted repository. No external
  service required.
- Service containers (`postgres`, `redis`) can be declared directly in the workflow,
  avoiding Docker-in-Docker complexity for integration tests.
- `actions/cache` with pnpm's store path reduces install time from ~2 min to ~20 s.
- TruffleHog (`trufflesecurity/trufflehog`) or `gitleaks` (OSS) can be added as a
  step for secret scanning without a paid service.

**Alternatives considered**:
- *GitLab CI*: Excellent pipelines. Rejected because the repository is on GitHub.
- *CircleCI / Buildkite*: Powerful. Rejected for unnecessary external service cost
  and setup overhead for a solo project.
- *Pre-commit hooks only*: Insufficient — client-side hooks can be skipped. CI is
  the required enforcement gate (Principle 8).

---

## D-11 — Environment Validation: Zod

**Decision**: Zod v3 for environment variable schema validation at startup.

**Rationale**:
- Zod's `.parse()` throws a structured `ZodError` that lists every failing field with
  a human-readable message — satisfying FR-003 and SC-003 precisely.
- The schema doubles as the TypeScript type for the config object (via `z.infer<>`),
  eliminating a separate type definition.
- Zod is already likely to be used for API request validation later (Principle 7 —
  reuse over redundancy).
- The validation schema can coerce strings to numbers/booleans where environment
  variables are always strings.

**Alternatives considered**:
- *`t3-env`*: A thin wrapper around Zod for Next.js env validation. Considered.
  Rejected at this stage because it couples the validation to the Next.js config
  pipeline, making it harder to reuse in the standalone worker process.
- *`envalid`*: Older, purpose-built. Rejected because the types it produces are
  not as ergonomic as Zod's inferred types, and Zod is a more useful general-purpose
  tool already planned for the stack.
- *Manual checks (`if (!process.env.FOO) throw`)*: No schema, no structured errors.
  Rejected.

---

## D-12 — Structured Logging: Pino

**Decision**: Pino v9 with a custom `redaction` list and `pino-http` for request
middleware.

**Rationale**:
- Pino is the fastest Node.js logger that produces JSON output natively — no
  serialisation overhead from `JSON.stringify` calls scattered in the codebase.
- Pino's built-in `redact` option takes a list of object-path patterns
  (e.g., `["req.headers.authorization", "*.password", "*.apiKey"]`) and replaces
  matching values with `[REDACTED]` at the serialiser level — satisfying FR-011
  and SC-004 without per-callsite effort.
- `pino-http` auto-generates request/response log lines with `req.id` (request ID)
  and `responseTime` — satisfying FR-009 and the structured log format in US3.
- `pino-pretty` can be added as a dev dependency for human-readable output in local
  development without changing production behaviour.

**Alternatives considered**:
- *Winston*: Highly configurable. Rejected because its redaction support requires
  a custom transport or transformer; there is no declarative redaction path that
  applies at serialisation time.
- *Bunyan*: JSON output, similar philosophy to Pino. Rejected because it is
  significantly slower than Pino and its last major release was 2021 (maintenance mode).
- *`console.log` + manual `JSON.stringify`*: No structure, no redaction, no
  request ID propagation. Rejected.

---

## D-13 — Request ID Propagation: AsyncLocalStorage

**Decision**: Node.js built-in `AsyncLocalStorage` for request-scoped context,
seeded by `pino-http`'s `genReqId` option (UUID v4).

**Rationale**:
- `AsyncLocalStorage` propagates context through `await`, callbacks, and event
  emitters without passing an explicit context argument through every function.
- No additional library needed — built into Node.js 16+.
- The request ID stored in `AsyncLocalStorage` is accessible by any log call within
  the async chain, satisfying FR-009 and US3 acceptance scenario 1.

**Alternatives considered**:
- *`cls-hooked`*: Older zone-based approach. Deprecated in favour of
  `AsyncLocalStorage`. Rejected.
- *Explicit context threading*: Passing `ctx.requestId` to every function. Rejected
  because it pollutes every function signature and is easy to miss.

---

## D-14 — Monorepo Structure: Single Repository, Shared Codebase

**Decision**: Single `package.json` root, `src/` for shared code, `src/app/` for
Next.js routes, `src/worker/` for the worker entrypoint, `src/lib/` for shared
utilities (logger, config, db, queue adapters).

**Rationale**:
- Shared TypeScript types, the Drizzle schema, the config module, and the logger are
  used by both the web app and the worker. A single root package avoids duplication
  and keeps `import` paths simple.
- No workspace packages are needed at this stage — one `pnpm` package is sufficient
  (Principle 7 — no speculative abstraction).
- Next.js compiles only `src/app/**` for the web bundle; the worker is run via a
  separate `tsx` entrypoint. Both share `src/lib/**` at the source level.

**Alternatives considered**:
- *pnpm workspace with `packages/web` and `packages/worker`*: Clean separation.
  Rejected at this stage as premature complexity when there is a single developer
  and the codebase is small. Can be extracted later without breaking external
  consumers.
- *Two separate repositories*: Maximum isolation. Rejected because it makes atomic
  changes to shared types require coordinated PRs across repos.

---

## D-15 — Secret Scanning: Gitleaks (OSS)

**Decision**: `gitleaks` (open-source, MIT licence) via GitHub Actions step.

**Rationale**:
- Gitleaks detects secrets in commits and diffs using a built-in ruleset covering
  AWS keys, Google API keys, generic tokens, private keys, and JWT patterns.
- Runs as a Docker container in CI — no installation step needed.
- Scans the entire commit history on first run, then only new commits on subsequent
  PRs.
- Free and open-source (Principle 7).

**Alternatives considered**:
- *TruffleHog (OSS)*: Also a good option, entropy-based and regex-based. Equivalent
  capability to Gitleaks for this use case. Either would satisfy the requirement.
  Gitleaks chosen for its simpler GitHub Actions integration (`gitleaks/gitleaks-action`).
- *GitHub Advanced Security (secret scanning)*: Native, no config needed. Rejected
  because it is not available on private repositories without GitHub Enterprise or a
  paid plan.
- *`detect-secrets` (Yelp)*: Python-based, requires pip in CI. Rejected for adding
  a Python runtime dependency to a Node.js project.
