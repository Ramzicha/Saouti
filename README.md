<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/logo-light.png">
  <img alt="Saouti Logo" src="public/logo-dark.png" width="300">
</picture>

<p align="center">
  <strong>Discover what matters. Create in your own voice.</strong>
</p>

<p align="center">
  An AI-assisted social content creation platform that discovers industry trends, captures your authentic voice, and turns your perspectives into platform-tailored posts.
</p>

[![CI](https://github.com/Ramzicha/Saouti/actions/workflows/ci.yml/badge.svg)](https://github.com/Ramzicha/Saouti/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-green?logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io/)

[Features](#key-features) • [Agent Engine](#the-6-agent-pipeline) • [Tech Stack](#technology-stack) • [Quickstart](#quickstart-local-environment) • [Development](#common-development-commands)

---

</div>

## Overview

**Saouti** (Arabic: صوتي, *"my voice"*) solves the two hardest challenges in professional content creation:
1. **Finding what to say**: Keeping up with fast-moving industry news without hours of research.
2. **Sounding authentic**: Avoiding boilerplate, generic AI text that strips away your credibility and unique perspective.

Saouti brings discovery, deep voice profiling, factual grounding, and transparent multi-agent generation into a unified workspace.

---

## Key Features

### 🔍 Explore & Topic Discovery
- **Multi-Provider Search**: BYOK Tavily API integration with automatic RSS/Atom feed fallback.
- **Topic Planner Agent**: Proposes relevant topics tailored to your industry and persona.
- **Researcher Agent**: Delivers concise article summaries with *"Why it matches"* relevance badges and freshness filters.
- **Quota Guard**: Built-in 24h caching, daily search limits, and monthly credit guards to protect your API budget.
- **One-Click Post Bridge**: Instantly transfer any discovered article into the composer with complete factual attribution.
- **Saved Reading List**: Private bookmarking with URL normalization and deduplication.

### 🎙️ Voice Profiling & Document Intelligence
- **AI Profiler Agent**: Multi-turn conversational onboarding that uncovers your tone, principles, audience, and vocabulary.
- **Document Intelligence**: Upload PDF whitepapers, resumes, and reports with server-side extraction (`unpdf`).
- **Strict Privacy & Security**: Document text encrypted at rest using AES-256-GCM with a mandatory user privacy consent gate.
- **Human-in-the-Loop Insight Review**: Accept, edit, or reject extracted facts before they enter your approved voice memory.

### 🤖 Collaborative 6-Agent Engine
A visible, transparent multi-agent pipeline where each agent has a distinct responsibility:
1. **Profiler Agent**: Injects your voice persona, style guides, and forbidden phrases.
2. **Researcher Agent**: Fuses external articles and approved profile facts into a verified factual base.
3. **Strategist Agent**: Analyzes topic angles, hooks, and audience value.
4. **Writer Agent**: Crafts platform-optimized drafts strictly adhering to length, tone, and structure.
5. **Critic Agent**: Audits drafts for factual consistency, tone fidelity, and fluff, requesting revisions when needed.
6. **Art Director Agent**: Formulates high-end visual concepts and prompts for image generation.

### 📱 Multi-Platform Studio
Generate customized drafts from a single idea with platform-native formatting:
- **LinkedIn**: Thought-leadership structures, clean white-space line breaks, industry hashtags.
- **X (Twitter)**: High-impact punchy hooks under 280 characters.
- **Instagram**: Engaging storytelling captions with emoji styling.
- **Reddit**: Community discussion starters with nuanced viewpoints.

### 🎨 AI Post Images (Gemini Imagen 3)
- Generate studio-quality visuals directly from the Art Director's visual concept prompts.
- Pluggable storage abstraction (local filesystem volume / S3-ready) with authenticated image streaming.

### 📚 Post Library & Versioning
- Full-text search powered by PostgreSQL `tsvector` and `GIN` indexes.
- Version history tracking previous edits and iterations.
- Quick export to clipboard, Markdown, or plain text.

### 🌍 Trilingual & Global by Design
- Complete internationalization across **English**, **Français**, and **العربية**.
- Native RTL (Right-to-Left) rendering and dialect preferences for Arabic content.

---

## The 6-Agent Pipeline

```text
[ Topic / Article Brief ]
           │
           ▼
    ┌─────────────┐
    │  Profiler   │ ◄── Voice Profile & Approved Document Facts
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Researcher  │ ◄── Source Article & Grounding Data
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Strategist  │ ◄── Platform Selection (LinkedIn, X, IG, Reddit)
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Writer    │ ◄── Language & Tone Guidelines
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Critic    │ ──► [Needs Revision] ──► Back to Writer
    └──────┬──────┘
           │ (Approved)
           ▼
    ┌─────────────┐
    │Art Director │ ──► Optional Imagen 3 Visual Generation
    └──────┬──────┘
           │
           ▼
 [ Final Polished Post ]
```

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5.7+](https://www.typescriptlang.org/) (Strict mode, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`) |
| **Styling & UI** | [Tailwind CSS 3.4](https://tailwindcss.com/), `@tabler/icons-react`, custom design tokens |
| **Internationalization** | [`next-intl`](https://next-intl-docs.vercel.app/) (EN, FR, AR with RTL support) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Drizzle ORM 0.38+](https://orm.drizzle.team/) |
| **Queue & Streaming** | [BullMQ](https://bullmq.io/) + [Redis 7](https://redis.io/) (Redis Streams + Server-Sent Events) |
| **AI Providers** | [Google Gemini 2.0 / Imagen 3](https://ai.google.dev/), [Tavily Search API](https://tavily.com/) |
| **Security & Crypto** | AES-256-GCM encryption for user keys & documents, `@node-rs/argon2` for password hashing |
| **Document Processing** | `unpdf` server-side PDF extraction |
| **Testing** | [Vitest](https://vitest.dev/) (380+ unit, integration, and security tests) + [Playwright](https://playwright.dev/) |

---

## Prerequisites

| Tool | Minimum Version | Verification |
| :--- | :--- | :--- |
| **Node.js** | 20 LTS | `node -v` |
| **pnpm** | 9.0+ / 10.x | `pnpm -v` |
| **PostgreSQL** | 16 | `psql --version` |
| **Redis** | 7 | `redis-cli ping` |

---

## Quickstart (Local Environment)

### 1. Clone the repository
```bash
git clone https://github.com/Ramzicha/Saouti.git
cd Saouti
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Ensure `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_KEY` (64-char hex), and `SESSION_SECRET` are configured.

### 4. Run database migrations
```bash
pnpm drizzle-kit migrate
```

### 5. Start the background worker
In a separate terminal:
```bash
pnpm worker
```

### 6. Start the Next.js development server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

To view the standalone product landing page:
Open [http://localhost:3000/landing.html](http://localhost:3000/landing.html).

---

## Common Development Commands

```bash
# Start Next.js development server
pnpm dev

# Start BullMQ worker for multi-agent jobs
pnpm worker

# Run test suite
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run TypeScript type check
pnpm type-check

# Run linter
pnpm lint

# Generate database migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Build for production
pnpm build
```

---

## Architecture & Governance

- [Constitution](.specify/memory/constitution.md) — Core engineering principles, security boundaries, and architectural rules.
- [Development Guidelines](GEMINI.md) — Comprehensive tech stack standards, conventions, and change log.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Git workflow, branch conventions, and testing requirements.

---

## Author & Project Owner

**Ramzi Chalal**
- GitHub: [@Ramzicha](https://github.com/Ramzicha)
- Project: [Saouti](https://github.com/Ramzicha/Saouti)

---

## License

Private & Proprietary. All rights reserved.
