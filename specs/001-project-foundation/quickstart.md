# Quickstart: Project Foundation

**Feature**: `001-project-foundation`
**Audience**: Developer setting up Saouti locally for the first time
**Estimated time**: 10–15 minutes (on a machine with Docker and Git already installed)

---

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Git | 2.40+ | `git --version` |
| Docker | 24.0+ (with Compose v2) | `docker --version` && `docker compose version` |
| pnpm | 9.0+ | `pnpm --version` |
| Node.js | 20 LTS | `node --version` |

> **Windows developers**: Use WSL 2. All commands below are for the WSL 2 shell.
> Run `wsl --install` from PowerShell (Admin) if not already set up.

---

## 1. Clone and Enter the Repository

```bash
git clone https://github.com/<org>/saouti.git
cd saouti
```

---

## 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the web app and worker from the lockfile.
`node_modules` is populated in under 60 seconds on a warm pnpm store.

---

## 3. Configure the Environment

```bash
cp .env.example .env
```

Open `.env` and fill in any values marked `REQUIRED`. All others have safe defaults
for local development.

```ini
# .env — values you MUST set for the first run
DATABASE_URL=postgres://saouti:saouti@localhost:5432/saouti    # already correct for Docker Compose
REDIS_URL=redis://localhost:6379                                 # already correct for Docker Compose
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>            # REQUIRED — 64-char hex string
SESSION_SECRET=<generate with: openssl rand -hex 32>            # REQUIRED — 64-char hex string
```

Generate secrets:

```bash
openssl rand -hex 32   # run twice: once for ENCRYPTION_KEY, once for SESSION_SECRET
```

> **Never commit `.env`**. It is listed in `.gitignore`.

---

## 4. Start All Services

```bash
docker compose up
```

This starts four services:
- **app** — Next.js web application on port `3000`
- **worker** — Background job worker (no public port)
- **db** — PostgreSQL 16 on port `5432`
- **redis** — Redis 7 on port `6379`

On first run, Docker pulls the base images (~1–2 minutes). Subsequent starts take
~5 seconds.

Database migrations run automatically when `app` and `worker` start — no manual
SQL step needed.

---

## 5. Verify the System is Running

```bash
curl http://localhost:3000/health | jq
```

Expected output:

```json
{
  "status": "ok",
  "timestamp": "2026-10-22T22:44:00.000Z",
  "version": "0.1.0",
  "services": {
    "database": { "status": "ok", "latencyMs": 3 },
    "queue":    { "status": "ok", "latencyMs": 1 },
    "worker":   { "status": "ok", "lastHeartbeatAt": "2026-10-22T22:43:55.000Z" }
  }
}
```

If any service shows `"status": "error"`, check `docker compose logs <service-name>`.

---

## 6. Run Tests

```bash
# Unit tests (Vitest)
pnpm test

# Unit tests with coverage report
pnpm test:coverage

# End-to-end tests (Playwright) — requires the Docker Compose stack to be running
pnpm test:e2e
```

---

## 7. Run Lint and Type-Check

```bash
pnpm lint        # ESLint
pnpm type-check  # TypeScript tsc --noEmit
```

Both must pass before opening a pull request.

---

## 8. Stop the Stack

```bash
docker compose down
```

To also remove the database volume (fresh start):

```bash
docker compose down -v
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ENCRYPTION_KEY must be a 64-character hex string` at startup | `.env` has a short or missing key | Run `openssl rand -hex 32` and paste the result |
| `database: { "status": "error" }` | PostgreSQL not ready yet | Wait 10 s and retry; or check `docker compose logs db` |
| `worker: { "status": "unknown" }` after 30 s | Worker has not processed a heartbeat | Check `docker compose logs worker` for connection errors |
| Port 5432 already in use | Local PostgreSQL is running | Stop local PostgreSQL or change `DB_PORT` in `docker-compose.yml` |
| pnpm install fails | Wrong Node.js version | Ensure Node.js 20 LTS: `nvm use 20` |

---

## Directory Structure

```text
saouti/
├── .env.example               ← Copy to .env; fill required values
├── .github/
│   └── workflows/
│       └── ci.yml             ← GitHub Actions CI pipeline
├── .specify/
│   └── memory/
│       └── constitution.md    ← Project constitution (source of law)
├── docker-compose.yml         ← Local development environment
├── specs/
│   └── 001-project-foundation/← This epic's design artifacts
├── src/
│   ├── app/                   ← Next.js App Router (web UI and API routes)
│   │   └── api/
│   │       └── health/
│   │           └── route.ts   ← GET /health
│   ├── worker/
│   │   └── index.ts           ← Worker entrypoint
│   └── lib/
│       ├── config.ts          ← Zod-validated environment config
│       ├── logger.ts          ← Pino logger with redaction list
│       ├── db/
│       │   ├── schema.ts      ← Drizzle schema (users table)
│       │   ├── migrate.ts     ← Migration runner (called at startup)
│       │   └── migrations/    ← SQL migration files (generated by Drizzle Kit)
│       └── queue/
│           ├── client.ts      ← BullMQ Queue instance
│           └── worker.ts      ← BullMQ Worker + health-check job processor
├── tests/
│   ├── unit/                  ← Vitest unit tests
│   └── e2e/                   ← Playwright end-to-end tests
├── CONTRIBUTING.md            ← Branching, commit, and speckit conventions
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## Next Steps

Once the system is running and tests pass, the next speckit command to run is:

```
/05-speckit.tasks
```

This generates the task list from this plan for implementation.
