# Implementation Plan: 006 — Agent Engine & Live Activity

**Branch**: `006-agent-engine` | **Date**: 2026-10-23 | **Spec**: [specs/006-agent-engine/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/006-agent-engine/spec.md)  
**Input**: Feature specification from `/specs/006-agent-engine/spec.md`

---

## Summary

Build the deterministic multi-agent pipeline engine (Writer → Critic → optional Revision → Art Director) orchestrated by TypeScript state machines in BullMQ worker jobs. Prompts are assembled from versioned repository files and wrapped in tagged XML blocks (`<voice_profile>`, `<brief>`, `<revision_notes>`) with XML character escaping to guarantee user inputs are treated strictly as data. Output schemas are strictly validated with Zod, enforcing factual safety placeholders (`[YOUR NUMBER]`). Events stream via Redis Streams and an SSE endpoint with `Last-Event-ID` resumption, surviving page reloads and supporting cancellation.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, exactOptionalPropertyTypes) + Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), BullMQ, ioredis, Drizzle ORM, Zod, `@tabler/icons-react`, `next-intl`  
**Storage**: PostgreSQL 16 (`runs`, `agent_steps`), Redis 7 (BullMQ jobs, Redis streams `saouti:run:{runId}:events`)  
**Testing**: Vitest (unit, contract, evaluation suite with golden profiles), Playwright (live SSE streaming and timeline E2E)  
**Target Platform**: Linux server / Hostinger containerized Docker Compose stack  
**Project Type**: Next.js App Router full-stack web application with dedicated background worker  
**Performance Goals**: 3-platform run completes in < 35s; max run timeout enforced at 180s; cancel action takes effect in < 1.5s  
**Constraints**: Bounded single-loop revision (max 3-4 model calls per run); 100% prompt-injection neutralization via XML entity escaping; zero secret leakage in logs  
**Scale/Scope**: Multi-agent pipeline with Writer, Critic, and Art Director; 5 golden profiles evaluation suite; 10 adversarial security test briefs  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` and requirements checklist? | ✅ Pass |
| 2 | **Security & Privacy First** | Are API keys decrypted only server-side and excluded from logs? Is all user content passed as tagged data blocks? Are queries scoped by user id? | ✅ Pass |
| 3 | **Test Discipline** | Does every user story have Given/When/Then scenarios? Are contract and evaluation tests planned alongside implementation? | ✅ Pass |
| 4 | **Provider Independence** | Are model names configured in `aiConfig`? Does all communication flow through the provider abstraction? | ✅ Pass |
| 5 | **Transparency** | Are all agent events streamed via SSE? Does the activity timeline reflect the deterministic steps with durations and revision reasons? | ✅ Pass |
| 6 | **Accessibility & Localisation** | Are UI status strings externalised to locale files? Is RTL layout verified for Arabic? Do components meet WCAG AA? | ✅ Pass |
| 7 | **Simplicity** | Does the orchestrator use standard application state machines instead of autonomous loops? Are dependencies free/OSS? | ✅ Pass |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build all pass with zero unsuppressed errors? | ✅ Pass |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-agent-engine/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Architectural decisions & research
├── data-model.md        # Drizzle schemas, state machine, Zod schemas
├── quickstart.md        # Testing and execution guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── contracts/
    ├── agent-events.contract.ts  # Redis stream & SSE wire contract
    └── agent-engine.contract.ts  # REST API request/response contracts
```

### Source Code Organization

```text
src/
├── app/
│   ├── api/
│   │   └── runs/
│   │       ├── route.ts                     # POST /api/runs (Create run)
│   │       └── [runId]/
│   │           ├── route.ts                 # GET /api/runs/[runId]
│   │           ├── events/
│   │           │   └── route.ts             # GET /api/runs/[runId]/events (SSE route)
│   │           └── cancel/
│   │               └── route.ts             # POST /api/runs/[runId]/cancel
├── components/
│   └── agent/
│       ├── ActivityTimeline.tsx             # Enhanced timeline with live SSE events
│       └── AgentChip.tsx                    # Presence chip with working/paused countdowns
├── lib/
│   ├── agent-engine/
│   │   ├── prompts/
│   │   │   ├── writer.v1.md                 # Role prompt for Writer
│   │   │   ├── critic.v1.md                 # Role prompt for Critic
│   │   │   └── art-director.v1.md           # Role prompt for Art Director
│   │   ├── prompt-builder.ts                # Pure 5-layer prompt assembler with XML tags
│   │   ├── schemas.ts                       # Zod schemas for structured agent outputs
│   │   ├── platform-rules.ts                # Configuration for network formats & norms
│   │   └── event-stream.ts                  # Redis stream producer & consumer helpers
│   ├── db/
│   │   ├── schema.ts                        # Added runs & agentSteps tables
│   │   └── migrations/                      # Drizzle migration 0004
│   └── queue/
│       └── jobs/
│           └── run-generation.ts            # BullMQ job definition & dispatch
└── worker/
    └── processors/
        └── agent-engine.ts                  # Orchestrator state machine processor

tests/
├── contract/
│   └── agent-events.contract.test.ts        # Contract test for Redis stream & SSE events
├── evaluation/
│   ├── golden-profiles.ts                   # 5 canonical test profiles
│   └── agent-engine-eval.test.ts            # Golden profiles evaluation against Fake/Live
├── integration/
│   ├── agent-pipeline.test.ts               # Full state machine execution test
│   └── sse-streaming.test.ts                # SSE route connection & Last-Event-ID test
├── security/
│   └── prompt-injection.test.ts             # 10 adversarial jailbreak briefs test
└── unit/
    ├── agent-engine-prompts.test.ts         # Prompt builder & XML escaping unit tests
    └── agent-engine-schemas.test.ts         # Zod schema validation & retry unit tests
```

---

## Complexity Tracking

| Component | Inherent Complexity | Justification & Management |
| :--- | :--- | :--- |
| **Worker State Machine** | Multi-step asynchronous state transitions across model calls | Encapsulated in a single pure TypeScript state machine class; states are discrete, bounded, and testable with mock providers. |
| **Redis Streams + SSE** | Connection dropouts, message replay, browser reconnections | Redis streams persist ordered time-indexed events; Next.js SSE endpoint handles `Last-Event-ID` transparently via `XRANGE`. |
| **Prompt Injection Defense** | Users can supply arbitrary text in briefs, voice profiles, and samples | Pure functional XML tag escaping function replaces `<` and `>` with XML entities; strict system prompt demarcation treats content strictly as data. |

---

## Implementation Phases

### Phase 0: Research & Pre-conditions (Completed)
- Documented decisions on state machine design, Redis Streams, SSE reconnection, prompt layering, and evaluation suites in `research.md`.

### Phase 1: Data Model, Contracts & Prompts (Completed)
- Defined database schema for `runs` and `agent_steps` in `data-model.md`.
- Authored API contracts in `contracts/agent-engine.contract.ts` and `contracts/agent-events.contract.ts`.
- Documented testing instructions in `quickstart.md`.

### Phase 2: Schema Migrations & Core Primitives
- Add `runs` and `agentSteps` to `src/lib/db/schema.ts` and generate Drizzle migration.
- Add versioned prompt templates: `writer.v1.md`, `critic.v1.md`, and `art-director.v1.md`.
- Implement `src/lib/agent-engine/schemas.ts` with strict Zod validation and placeholder checks.
- Implement `src/lib/agent-engine/prompt-builder.ts` with 5-layer assembly and XML entity escaping.

### Phase 3: Redis Stream Event Bus & SSE Route
- Implement `src/lib/agent-engine/event-stream.ts` providing `publishRunEvent()` (`XADD`) and `readRunEvents()` (`XRANGE` / `XREAD`).
- Implement Next.js SSE route `GET /api/runs/[runId]/events` with `Last-Event-ID` recovery and `X-Accel-Buffering: no`.

### Phase 4: State Machine Orchestrator & BullMQ Processor
- Implement orchestrator state machine in `src/worker/processors/agent-engine.ts`:
  1. Initialize & validate profile + key
  2. Call Writer (`generateUserStructured`)
  3. Validate output or retry once on error
  4. Call Critic (`generateUserStructured`)
  5. Check threshold (all scores $\ge 4$); if revise, execute Writer revision (max 1 loop)
  6. Call Art Director (`generateUserStructured`)
  7. Finalize posts and commit to database
- Wire job processor to worker in `src/worker/index.ts`.

### Phase 5: REST API Routes & Run Cancellation
- Implement `POST /api/runs` to validate inputs and enqueue BullMQ job.
- Implement `GET /api/runs/[runId]` to fetch current run status and posts.
- Implement `POST /api/runs/[runId]/cancel` to broadcast cancellation flag to Redis and mark run cancelled.

### Phase 6: Activity Timeline Integration & Frontend Streaming
- Update `src/components/agent/ActivityTimeline.tsx` to subscribe to `/api/runs/[runId]/events` via `EventSource`.
- Render dynamic agent chips with live working timers, pause countdowns on quota limits, and animated hand-off cards displaying revision reasons.
- Ensure page reloads re-fetch active run state and replay all completed steps seamlessly.

### Phase 7: Evaluation Suite & Adversarial Security Testing
- Create 5 golden profiles in `tests/evaluation/golden-profiles.ts`.
- Write `tests/evaluation/agent-engine-eval.test.ts` executing against `FakeAiProviderAdapter` in CI.
- Write `tests/security/prompt-injection.test.ts` testing 10 adversarial briefs to verify zero instruction leakage.

### Phase 8: Quality Gates & Verification
- Run `pnpm test`, `pnpm type-check`, `pnpm lint`, and `pnpm build`.
