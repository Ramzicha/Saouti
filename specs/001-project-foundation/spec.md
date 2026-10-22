# Feature Specification: Project Foundation

**Feature Branch**: `001-project-foundation`
**Created**: 2026-10-22
**Status**: Draft
**Input**: User description: "Set up the Saouti project foundation so any developer can clone the
repository, start the whole system with one command, and see a running application with a health
check. Include: Spec Kit initialised with the constitution; a documented local environment with the
web app, a background worker, a relational database and a job queue; versioned database migrations
with a User table only; continuous integration that blocks merges on lint, type, test, build and
secret-scan failures; startup validation of configuration with clear errors; structured logging
with request IDs and redaction of secrets and user content."

---

## Assumptions

The four clarification focus areas identified by the user are resolved here as documented
assumptions. Any disagreement should be raised before planning begins.

1. **Target OS for developers**: Linux and macOS are the primary developer environments. Windows
   developers MUST use WSL 2. All shell scripts and CI steps are written for POSIX/bash. Docker
   Desktop is the expected container runtime on all three platforms.

2. **Minimum test coverage expected**: 80% line coverage on all server-side source files for this
   epic. Security-critical paths (config validation, secret redaction, logging) MUST reach 90%
   branch coverage. Coverage is measured by the CI pipeline and reported as a check; below-threshold
   results MUST block merge.

3. **Branching and commit conventions**:
   - Branch names follow `###-short-description` (Speckit convention already in use).
   - Commit messages follow **Conventional Commits** (`type(scope): description`).
     Valid types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `build`.
   - Direct pushes to `main` are blocked; all changes land via pull request.
   - Each PR MUST reference the feature branch number in the title.

4. **Sensitive log fields**: The following fields MUST be redacted (replaced with `[REDACTED]`)
   in all log output — both in development and production:
   - Any field whose key contains: `key`, `secret`, `password`, `token`, `authorization`,
     `credential`, `apiKey`, `api_key` (case-insensitive).
   - Any field whose value is the content of a `<profile>`, `<brief>`, `<voice_samples>`, or
     `<platform_rules>` tagged block.
   - HTTP request/response bodies on AI-provider routes.
   - Database connection strings.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Fresh Developer Onboarding (Priority: P1)

A developer who has just cloned the Saouti repository for the first time MUST be able to read one
document (`CONTRIBUTING.md` or `README.md`) and, by following its steps, have the entire system
running locally within 15 minutes on a machine that already has Docker and Git installed. They MUST
NOT need to edit any code; only populate a single `.env` file from the provided `.env.example`.

**Why this priority**: The foundation is useless if onboarding is painful. Every subsequent epic
depends on a working local environment. Slow onboarding directly multiplies ramp-up time across the
team.

**Independent Test**: Clone the repository to a clean directory, copy `.env.example` to `.env`,
run the single start command, and verify the health-check endpoint returns `200 OK` within 60
seconds. This story delivers a working local system with zero pre-existing knowledge of the project.

**Acceptance Scenarios**:

1. **Given** a clean machine with Docker, Git, and WSL 2 (on Windows), **When** a developer
   follows the `README.md` setup steps exactly, **Then** all services start without manual
   intervention and the application health-check endpoint returns `200 OK` with a JSON body
   containing service status for the web app, worker, database, and job queue.

2. **Given** a missing required environment variable in `.env`, **When** the developer starts the
   system, **Then** the application fails at startup with a human-readable error message naming the
   missing variable and a link to the documentation, before any service accepts traffic.

3. **Given** all required environment variables are present, **When** the developer stops the
   system and restarts it, **Then** the database retains its state and the migration log shows no
   re-applied migrations.

4. **Given** the developer has never run the project before, **When** they run the start command,
   **Then** the database schema is automatically created via versioned migrations (no manual SQL
   required).

**Test Plan** *(Principle 3 — required; tests must be written before or with code)*:
- Unit: Config validation module — test every required variable missing, wrong type, and wrong
  format independently.
- Integration: Start the Docker Compose stack in CI; hit `/health`; assert JSON structure and
  `200` status; assert migrations ran exactly once.
- Security path covered: ✅ Yes — startup validation must not log the value of any secret variable.

---

### User Story 2 — CI Pipeline Blocks Bad Code (Priority: P1)

A developer who opens a pull request with a linting error, type error, failing test, broken build,
or committed secret MUST have their PR blocked automatically. The CI check MUST identify and report
the exact failure category so the developer can fix it without guessing.

**Why this priority**: The Quality Gates principle (Principle 8) is foundational — if CI is not
enforced from the first commit, bad habits accumulate. This story protects every future epic.

**Independent Test**: Open a PR that deliberately introduces each failure category in isolation
(lint error, TS error, failing test, build error, hardcoded secret). Each MUST show a distinct
failed check in the PR status, with a non-empty failure message. PRs that pass all checks MUST
merge without additional intervention.

**Acceptance Scenarios**:

1. **Given** a PR that introduces an ESLint violation, **When** the CI pipeline runs, **Then**
   the lint check fails and reports the file, line number, and rule name; the PR is blocked from
   merging.

2. **Given** a PR that introduces a TypeScript type error, **When** the CI pipeline runs, **Then**
   the type-check step fails and reports the file and error message; the PR is blocked.

3. **Given** a PR that introduces a failing unit test, **When** the CI pipeline runs, **Then** the
   test step fails and reports the test name and failure reason; the PR is blocked.

4. **Given** a PR that breaks the production build, **When** the CI pipeline runs, **Then** the
   build step fails; the PR is blocked.

5. **Given** a PR that contains a string matching a known secret pattern (e.g., an API key,
   a private key block), **When** the CI pipeline runs, **Then** the secret-scan step fails and
   identifies the file and line; the PR is blocked.

6. **Given** a PR where all checks pass, **When** the CI pipeline completes, **Then** all status
   checks are green and the PR is mergeable.

**Test Plan** *(Principle 3 — required)*:
- Unit: N/A — this story tests the CI pipeline itself.
- Integration: GitHub Actions workflow test matrix — one job per failure category as described
  above; each job MUST be verified to fail on a synthetic bad input and pass on a clean input.
- Security path covered: ✅ Yes — secret-scan step is the primary security control here.

---

### User Story 3 — Structured, Redacted Logging (Priority: P2)

Every log line emitted by the web app or background worker MUST be valid JSON, carry a unique
request ID, and contain no sensitive fields in plain text. A developer reading logs MUST be able to
trace a request end-to-end using the request ID alone, without seeing any user content, API keys,
or secrets.

**Why this priority**: Logging is infrastructure that underpins security (Principle 2) and
observability. It must be in place before any feature generates log output, but it is not as
immediately blocking as onboarding and CI.

**Independent Test**: Start the system, make a request to `/health`, and inspect the application
log output. Every line MUST be valid JSON. The `requestId` field MUST be present and consistent
across all log lines for the same request. Submit a request with a simulated sensitive header
(`Authorization: Bearer test-secret`) and confirm the logged value is `[REDACTED]`.

**Acceptance Scenarios**:

1. **Given** the web app receives any HTTP request, **When** it logs the incoming request and
   outgoing response, **Then** every log line is valid JSON containing at minimum: `timestamp`
   (ISO 8601), `level`, `message`, `requestId`, `method`, `path`, `statusCode`, `durationMs`.

2. **Given** an HTTP request carries a sensitive header (e.g., `Authorization`, `X-Api-Key`),
   **When** the request is logged, **Then** the header value is replaced with `[REDACTED]` in the
   log line and the original value is never written to any log sink.

3. **Given** a log event is created with a field named `apiKey`, `password`, `secret`, or
   `token` (case-insensitive), **When** the event is serialised, **Then** the field value is
   `[REDACTED]` regardless of context.

4. **Given** the worker processes a background job, **When** it logs job lifecycle events (enqueued,
   started, completed, failed), **Then** each log line includes the `requestId` that originated the
   job, a `jobId`, and the job type — and no job payload content is logged.

5. **Given** an unhandled exception occurs, **When** it is logged, **Then** the stack trace is
   included as a structured field, but no sensitive variables from the call stack are exposed.

**Test Plan** *(Principle 3 — required)*:
- Unit: Logger redaction module — assert `[REDACTED]` for every known sensitive key pattern;
  assert JSON validity; assert requestId propagation through async context.
- Integration: Start the app in test mode; fire requests with sensitive headers; parse log output
  as JSON lines and assert no sensitive values appear.
- Security path covered: ✅ Yes — this story IS the security logging control.

---

### Edge Cases

- What happens if the database is not reachable when the application starts? The startup
  validation MUST catch this, log a structured error (without the connection string), and exit with
  a non-zero code before the HTTP server binds.
- What happens if a migration has already been applied but the migration file has changed? The
  migration runner MUST detect the checksum mismatch and halt with a clear error — it MUST NOT
  silently re-apply or skip.
- What happens if two workers start simultaneously and both attempt to run migrations? The
  migration runner MUST use a database-level advisory lock so only one runner applies migrations;
  the second waits and then detects that migrations are already applied.
- What happens if the secret-scan CI step is slow and times out? The CI job MUST have a
  configurable timeout and fail (not silently skip) on timeout.
- What happens if a log field key matches the sensitive pattern but the value is an empty string?
  The value MUST still be `[REDACTED]`.
- What happens if the request ID middleware is missing from a route? The structured logger MUST
  fall back to a generated ID and emit a warning — it MUST NOT crash.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain a `README.md` that describes prerequisites, setup steps,
  and the single start command needed to run the full local environment.
- **FR-002**: A `docker-compose.yml` (or equivalent) MUST define all local services: the Next.js
  web application, the Node.js background worker, a PostgreSQL database, and a Redis instance for
  the job queue. Running one command MUST start all four.
- **FR-003**: An `.env.example` file MUST list every required and optional environment variable
  with a description and a safe example value. Secrets MUST use placeholder values that make their
  format obvious (e.g., `your-32-byte-hex-encryption-key-here`).
- **FR-004**: The application MUST validate all required environment variables at startup before
  binding to any port or connecting to any external service. On failure, it MUST exit with a
  non-zero code and a message that names every missing or invalid variable.
- **FR-005**: A `/health` HTTP endpoint MUST return `200 OK` with a JSON body that reports the
  status of the web app, the database connection, and the job queue connection. It MUST return
  `503 Service Unavailable` if any dependency is down.
- **FR-006**: The database schema MUST be managed by versioned, sequential migrations. The first
  migration MUST create a `users` table with at minimum: `id` (UUID, primary key), `email`
  (unique, not null), `password_hash` (not null), `created_at`, `updated_at`. No other tables are
  in scope for this feature.
- **FR-007**: Migrations MUST be applied automatically on startup, in order, and only once per
  migration file. Applied migrations MUST be recorded in a `schema_migrations` table.
- **FR-008**: The background worker MUST connect to the job queue on startup, register at least
  one no-op health-check job type, and expose its own health status in the structured log.
- **FR-009**: Every HTTP request MUST be assigned a unique request ID (UUID v4 or equivalent).
  The ID MUST be propagated through the async context for the lifetime of the request.
- **FR-010**: All log output from the web app and worker MUST be JSON-formatted, one object per
  line, containing the fields defined in User Story 3.
- **FR-011**: The logging layer MUST redact the value of any log field whose key matches the
  sensitive key patterns defined in the Assumptions section, replacing the value with `[REDACTED]`.
- **FR-012**: The CI pipeline MUST run the following checks on every pull request targeting
  `main`: lint, type-check, unit tests with coverage, integration tests, production build, and
  secret scan. All checks MUST pass before a PR is mergeable.
- **FR-013**: The CI pipeline MUST enforce the coverage thresholds defined in the Assumptions
  section and fail the test step if thresholds are not met.
- **FR-014**: The `.specify/memory/constitution.md` MUST be present in the repository and
  committed to version control as the project's source of law.
- **FR-015**: A `CONTRIBUTING.md` MUST document the branching convention, commit message
  convention, and the speckit workflow required before writing any production code.

### Key Entities *(include if feature involves data)*

- **User**: Represents a registered user account. At this stage contains only identity and
  authentication fields. Key attributes: `id` (UUID), `email` (unique string), `password_hash`
  (string), `created_at` (timestamp), `updated_at` (timestamp). No relationships to other entities
  in scope for this feature.
- **Migration record**: An internal tracking record that stores the name of each applied migration
  file, its checksum, and the timestamp it was applied.
- **Job**: A unit of background work enqueued in the job queue. At this stage, only a no-op
  health-check job type exists. Key attributes: `id`, `type`, `status`, `created_at`.

---

## Accessibility & Localisation *(mandatory — Principle 6)*

- **A11Y-001**: The `/health` endpoint and any developer-facing HTML error pages MUST be keyboard-
  navigable (not applicable — these are JSON endpoints with no HTML UI in this epic).
- **A11Y-002**: Not applicable — no user-facing UI is in scope for this epic.
- **A11Y-003**: Not applicable — no animation or motion in this epic.
- **A11Y-004**: Not applicable — no user-facing components in this epic.
- **I18N-001**: Startup error messages and log messages are English only for this epic; they are
  developer-facing infrastructure strings, not user-facing strings. This is an explicit exception
  to the localisation principle, scoped to internal tooling output.
- **I18N-002**: Not applicable — no UI layout in this epic.
- **I18N-003**: Not applicable — no AI-generated text in this epic.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer on a clean machine (with Docker and Git) can complete the setup steps
  described in `README.md` and reach a running `/health` endpoint returning `200 OK` within
  15 minutes.
- **SC-002**: The health endpoint responds within 500 milliseconds under normal conditions, with
  all four service statuses (web, worker, database, job queue) correctly reported.
- **SC-003**: Every required environment variable that is missing or invalid is reported as a
  separate, named error at startup — zero ambiguous "configuration error" messages are permitted.
- **SC-004**: Zero log lines emitted by the web app or worker contain a sensitive field value
  in plain text. Verified by running the integration test suite against the log output.
- **SC-005**: Every pull request to `main` that contains any of the five failure categories
  (lint, type, test, build, secret) is blocked by CI within 10 minutes of push.
- **SC-006**: Code coverage on server-side source files for this epic is at or above 80% line
  coverage, with security-path branch coverage at or above 90%, as reported by the CI pipeline.
- **SC-007**: Running migrations twice from a clean database produces exactly the same schema as
  running them once — idempotent and verified by the integration test suite.
- **SC-008**: The speckit structure (`.specify/memory/constitution.md`, `specs/` directory,
  `.env.example`, and `CONTRIBUTING.md`) is present and committed in the initial repository state.
