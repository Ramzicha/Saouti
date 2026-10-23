# Implementation Plan: Voice Profile Onboarding & Management

**Branch**: `005-voice-profile` | **Date**: 2026-10-23 | **Spec**: [spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/005-voice-profile/spec.md)  
**Input**: Feature specification from `/specs/005-voice-profile/spec.md` and user technical guidance: "Add Profile, VoiceSample and PlatformPreference tables with migrations; store profile sections as typed JSON validated with Zod. Build the onboarding as a multi-step form with server-side saving after each step and React Hook Form on the client. Implement the profile summary builder as a pure, versioned function with snapshot tests. Implement the Profiler as an agent using the provider layer from Epic 3: interview mode keeps a transcript in the database and asks one question per turn, synthesis mode returns schema-validated profile JSON. Stream the interview turns to the browser. Add end-to-end tests for the full onboarding in all three languages."

---

## Summary

This feature implements the foundational personalization engine for Saouti:
1. **Hybrid Database Model**: Creates `profiles`, `voice_samples`, `platform_preferences`, `voice_profile_versions`, and `profiler_sessions` tables in PostgreSQL using Drizzle ORM. Sectional configurations (identity, principles, audience, objectives, style) are stored as typed JSON validated at runtime via Zod schemas.
2. **Guided Multi-Step Onboarding Wizard**: A 7-step client flow powered by `react-hook-form` with step-by-step server-side persistence, enabling safe progress saving, draft resumption, and fast-track activation (Role, ≥1 platform, ≥1 voice sample required).
3. **Conversational AI Profiler Agent**: An interactive interview agent utilizing the BYOK provider layer (`src/lib/ai/service.ts`). Streams sequential questions to the browser via SSE, follows up on ambiguous answers, handles mid-way quota failures with in-context key resolution, and synthesizes a structured Voice Profile proposal upon completion.
4. **Pure Versioned Summary Builder**: A deterministic, zero-dependency formatting function that constructs the XML/markdown `<voice_profile>` prompt block with delimiter breakout protection and comprehensive Vitest snapshot tests.
5. **Full Profile Dashboard & Revision History**: Allows ongoing updates at `/settings/profile`, displays a read-only "Agent View" transparency preview, a completeness progress indicator, and an immutable revision audit log with rollback capabilities.
6. **E2E Multilingual Testing**: Automated Playwright tests verifying the entire onboarding journey across English, French, and Arabic (with complete RTL validation).

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes: true`, no `any`) + Next.js 15 (App Router), React 19  
**Primary Dependencies**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-orm`, `@google/generative-ai` (via provider abstraction), `@tabler/icons-react`, `next-intl`  
**Storage**: PostgreSQL 16 (`profiles`, `voice_samples`, `platform_preferences`, `voice_profile_versions`, `profiler_sessions`)  
**Testing**: Vitest 3.x (unit, snapshot, integration), Playwright (E2E multilingual, Axe-core WCAG AA)  
**Target Platform**: Node.js 20 LTS / Web (Chromium, Firefox, WebKit, Mobile responsive)  
**Project Type**: Next.js Fullstack Web Application (App Router + Server Actions / API route handlers)  
**Performance Goals**: <200ms draft autosave response, <1s time-to-first-token on AI Profiler interview questions  
**Constraints**: Principle 2 prompt isolation (all user samples treated strictly as data within delimited blocks, escaped against delimiter breakout); 100% tenant isolation scoped to authenticated `user.id`; WCAG 2.1 AA in light & dark themes; full RTL layout in Arabic  
**Scale/Scope**: 1 active profile per user with unlimited versioned snapshots; up to 5 voice samples per profile (50–1,000 words each)  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All 8 principles evaluated and confirmed passing:

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` with resolved clarifications and passing quality checks? | ✅ Pass — All 3 focus area questions clarified, 16/16 checklist items pass in [requirements.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/005-voice-profile/checklists/requirements.md). |
| 2 | **Security & Privacy First** | Are API keys encrypted at rest? Is user content treated strictly as data in tagged blocks? Are queries scoped by `user.id`? | ✅ Pass — Keys remain encrypted via AES-256-GCM; profile summary builder wraps user content in `<voice_profile>` with entity escaping (`&lt;/voice_profile&gt;`); all DB queries enforce `userId = session.user.id`. |
| 3 | **Test Discipline** | Does every user story have Given/When/Then acceptance scenarios? Are test tasks planned before/alongside code? | ✅ Pass — All 5 user stories feature explicit Given/When/Then acceptance scenarios; snapshot tests, contract tests, and multilingual Playwright specs planned. |
| 4 | **Provider Independence** | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction? | ✅ Pass — Profiler agent calls `generateUserText` and `generateUserStructured` from `src/lib/ai/service.ts`; models resolved dynamically from `aiConfig`. |
| 5 | **Transparency** | Are agent turns streamed via SSE? Is an exact Agent View available to the user? | ✅ Pass — Interview turns stream to the browser via SSE; read-only Agent View displays the exact prompt block injected into agents. |
| 6 | **Accessibility & Localisation** | Are all strings externalised? Is RTL layout supported for Arabic? Do components meet WCAG AA? | ✅ Pass — All copy added to `messages/en.json`, `fr.json`, and `ar.json`; RTL stepper and layout verified; Axe-core automated tests configured. |
| 7 | **Simplicity** | Are dependencies free/OSS? Are abstractions concrete and minimal? | ✅ Pass — Standard React Hook Form + Zod pattern; pure formatting functions; minimal schema additions. |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build pass with 0 errors/suppressions? | ✅ Pass — Zero `@ts-ignore` or lint suppressions permitted; strict type-check compliance enforced. |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-voice-profile/
├── spec.md                     # Feature specification with clarified requirements
├── plan.md                     # Implementation plan (this file)
├── research.md                 # Technical research and architectural decisions
├── data-model.md               # Drizzle schema, Zod validation, and state diagrams
├── contracts/
│   └── profile-api.contract.ts # TypeScript API contracts for profile endpoints
├── quickstart.md               # Developer testing and manual verification guide
├── checklists/
│   └── requirements.md         # Specification quality checklist
└── tasks.md                    # Generated by /05-speckit.tasks
```

### Source Code (`src/` repository root)

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (workspace)/
│   │   │   └── page.tsx                      # Gatekeeper: redirects to /onboarding if no active profile
│   │   ├── onboarding/
│   │   │   └── page.tsx                      # Guided 7-step wizard & AI Profiler container
│   │   └── settings/
│   │       └── profile/
│   │           └── page.tsx                  # Profile management, Agent View, & Revision history
│   └── api/
│       └── profile/
│           ├── route.ts                      # GET / PUT active profile
│           ├── draft/
│           │   ├── route.ts                  # GET draft state
│           │   └── step/
│           │       └── route.ts              # POST step draft persistence
│           ├── activate/
│           │   └── route.ts                  # POST activate profile
│           ├── versions/
│           │   ├── route.ts                  # GET version history
│           │   └── [versionNumber]/
│           │       └── rollback/
│           │           └── route.ts          # POST rollback to version
│           ├── preview/
│           │   └── route.ts                  # GET agent prompt summary
│           └── profiler/
│               ├── chat/
│               │   └── route.ts              # POST interview turn (SSE streaming)
│               └── confirm/
│                   └── route.ts              # POST commit proposed profile
├── components/
│   └── profile/
│       ├── OnboardingWizard.tsx              # Multi-step wizard coordinator
│       ├── StepIndicator.tsx                 # Accessible step progress bar (RTL-aware)
│       ├── steps/
│       │   ├── Step1Identity.tsx             # Role, industry, expertise, positioning
│       │   ├── Step2Principles.tsx           # Values, topics to avoid, tone red lines
│       │   ├── Step3Audience.tsx             # Target reader persona & level
│       │   ├── Step4Objectives.tsx           # Goals & platform rankings
│       │   ├── Step5StyleLanguage.tsx        # Formality, length, emoji, dialect
│       │   ├── Step6VoiceSamples.tsx         # 1 to 5 pasted writing samples
│       │   └── Step7Platforms.tsx            # Platform selection & Reddit rules
│       ├── ProfilerChat.tsx                  # Conversational AI interview UI
│       ├── ProfilerProposalModal.tsx         # Structured proposal review modal
│       ├── AgentPromptPreview.tsx            # Read-only delimited prompt view
│       ├── CompletenessMeter.tsx             # Visual progress indicator with tips
│       └── RevisionHistoryList.tsx           # Audit log with rollback action
├── lib/
│   ├── db/
│   │   ├── schema.ts                         # Added profiles, voiceSamples, platformPreferences, etc.
│   │   └── migrations/                       # Drizzle migration SQL files
│   └── profile/
│       ├── schemas.ts                        # Zod schemas for all sections and activation
│       ├── summary-builder.ts                # Pure versioned prompt block formatter with escaping
│       ├── completeness.ts                   # Completeness score calculation logic
│       ├── profiler-agent.ts                 # AI Profiler interview prompt & synthesis logic
│       └── versioning.ts                     # Snapshot generation & rollback utilities
└── messages/
    ├── en.json                               # Added "Profile" and "Onboarding" dictionaries
    ├── fr.json                               # Added "Profile" and "Onboarding" dictionaries
    └── ar.json                               # Added "Profile" and "Onboarding" dictionaries
```

### Tests (`tests/`)

```text
tests/
├── unit/
│   ├── profile-summary.test.ts               # Snapshot tests for buildVoiceProfileSummary
│   ├── profile-schemas.test.ts               # Zod validation boundary tests
│   └── completeness.test.ts                  # Completeness score scoring tests
├── integration/
│   ├── profile-draft.test.ts                 # Step-by-step draft persistence & isolation
│   ├── profile-lifecycle.test.ts             # Activation, update, version snapshot & rollback
│   └── profiler-agent.test.ts                # Multi-turn interview & synthesis with FakeProviderAdapter
└── e2e/
    ├── onboarding-i18n.spec.ts               # Full wizard walkthrough in EN, FR, and AR (RTL)
    └── profile-a11y.spec.ts                  # Axe-core WCAG AA audits across light & dark themes
```

---

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| Typed JSON columns for profile sections (`identityData`, `principlesData`, etc.) | Allows clean schema evolution without requiring 40+ relational columns or migrations for minor tone traits. | A single giant JSON blob would require rewriting all voice samples (10KB+) on every minor tone adjustment. |
| Separate `voice_samples` relational table | Voice samples are large multi-paragraph text blocks with individual ordering and word count validations (50–1,000 words). | Embedding large arrays of text in the profile JSON makes concurrent autosaving brittle and inflates base profile reads. |
| `voice_profile_versions` snapshot table | Fulfills user requirement for full revision history and rollback capabilities. | In-place updates without history would risk permanent loss of carefully tuned voice profiles. |
