# Saouti

[![CI](https://github.com/saouti/saouti/actions/workflows/ci.yml/badge.svg)](https://github.com/saouti/saouti/actions/workflows/ci.yml)
[![Constitution](https://img.shields.io/badge/constitution-1.0.0-blue)](.specify/memory/constitution.md)
[![Guidelines](https://img.shields.io/badge/guidelines-GEMINI.md-green)](GEMINI.md)

Saouti (Arabic: _sawti_, "my voice") is a free, bring-your-own-key web platform that writes social media posts in a professional's authentic voice, using a transparent, visible multi-agent pipeline.

---

## Prerequisites

| Tool    | Minimum version       | Verification             |
| ------- | --------------------- | ------------------------ |
| Node.js | 20 LTS                | `node -v`                |
| pnpm    | 9.0+ / 12.x           | `pnpm -v`                |
| Git     | 2.40+                 | `git --version`          |
| Docker  | 24.0+ with Compose v2 | `docker compose version` |

> **Windows developers**: Please use WSL 2. All setup and automation scripts are written for POSIX/bash.

---

## Quickstart (Local Environment)

### 1. Clone repository

```bash
git clone https://github.com/saouti/saouti.git
cd saouti
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Ensure `ENCRYPTION_KEY` (64-character hex) and `SESSION_SECRET` (minimum 32 characters) are populated.

### 4. Start all services via Docker Compose

```bash
docker compose up
```

### 5. Verify system health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "services": {
    "database": { "status": "ok" },
    "queue": { "status": "ok" },
    "worker": { "status": "ok" }
  }
}
```

---

## Common Development Commands

```bash
# Start Next.js app in development mode
pnpm dev

# Start background worker
pnpm worker

# Run unit tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e

# Run linter and formatting check
pnpm lint
pnpm format:check

# Type check
pnpm type-check

# Generate migrations from Drizzle schema
pnpm db:generate

# Build for production
pnpm build
```

---

## Architecture & Conventions

Please review:

- [Constitution](.specify/memory/constitution.md) - Project principles and governance
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines, branching and commit conventions
