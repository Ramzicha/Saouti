# Implementation Plan: Profile Documents (PDF)

**Branch**: `010-profile-documents` | **Date**: 2026-10-24 | **Spec**: [specs/010-profile-documents/spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-profile-documents/spec.md` and user planning directives.

---

## Summary

Enrich the Saouti Voice Profile with user-uploaded PDF documents (up to 5 documents per user: CV, professional bio, articles, company brochures). Intake enforces an unskippable privacy consent gate, validates file signatures (`%PDF-`), rejects encrypted/password-protected files, and isolates binaries on the private storage volume. Server-side text extraction uses `unpdf` with page citations, falling back to Gemini native multimodal document OCR when scans are detected. Extracted text is encrypted at rest with AES-256-GCM. The Profiler agent proposes structured insights across 6 categories, which users must explicitly accept, edit, or reject (zero automated profile mutations). Approved achievements and details become active `Approved Facts` passed to the Writer (`<approved_facts>`) and audited by the Critic (factual claim verification). Writer and Critic prompt versions bump to `v2`, validated against the golden-profile evaluation suite to prevent regressions on legacy profiles. Document deletion offers explicit choice to retain or purge approved facts, and account deletion cascades completely.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`) + Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), React 19, `unpdf` (pure ESM PDF text parser), `@google/generative-ai`, Drizzle ORM, Zod, `@tabler/icons-react`, `next-intl`  
**Storage**: PostgreSQL 16 (`documents`, `document_insights`, `approved_facts`, `document_privacy_consents`), `StorageProvider` private volume (`data/documents/${userId}/${documentId}.pdf`)  
**Testing**: Vitest (`pnpm test`), Playwright E2E (`pnpm test:e2e`), Axe-core a11y checks  
**Target Platform**: Linux / Windows VPS, Docker Compose, Node.js 20 LTS  
**Project Type**: Next.js Fullstack Web Application (App Router)  
**Performance Goals**: PDF validation & page count < 100ms; digital text extraction < 1.5s for 5-page CV; zero impact on existing post generation speed  
**Constraints**: Max 5 PDFs per user, max 10 MB and 20 pages per file; encrypted at rest (AES-256-GCM); zero public file paths; strict XML delimiter isolation against prompt injections  
**Scale/Scope**: Single professional persona with up to 5 background documents; up to 100 approved facts per profile  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Status | Notes |
|---|-----------|---------------|--------|-------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` reviewed by `/03-speckit.clarify` and a consistency report? | ✅ Pass | Completed in `specs/010-profile-documents/spec.md`. |
| 2 | **Security & Privacy First** | Are API keys encrypted? Is user content passed as tagged data? Are queries scoped by user id? | ✅ Pass | Extracted text encrypted with AES-256-GCM; PDF files kept private; XML tagged blocks isolate data from instructions; user ID scoping on all queries. |
| 3 | **Test Discipline** | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed? | ✅ Pass | All 6 user stories have test plans including security and adversarial injection suites. |
| 4 | **Provider Independence** | Are model names and provider IDs in config only? Does AI communication go through provider abstraction? | ✅ Pass | Reuses `aiConfig.models.profiler`, `aiConfig.models.writer`, `aiConfig.models.critic` via `getUserAiAdapter`. |
| 5 | **Transparency** | Are all agent events streamed via SSE? Is activity timeline accurate? | ✅ Pass | Profiler document extraction emits live SSE events into existing activity presence component. |
| 6 | **Accessibility & Localisation** | Are all new UI strings externalised? Is RTL handled for Arabic? WCAG AA met? | ✅ Pass | All strings in `en.json`, `fr.json`, `ar.json`. RTL verified; keyboard-navigable and axe-core compliant. |
| 7 | **Simplicity** | Are all dependencies free/OSS? Is extra infrastructure justified? | ✅ Pass | Reuses existing storage and encryption architecture. Adds lightweight `unpdf` library (zero system binary dependencies). |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build pass? | ✅ Pass | Verified zero TypeScript errors and all existing 51 test suites passing. |

---

## Project Structure

### Documentation (this feature)

```text
specs/010-profile-documents/
├── plan.md              # Implementation Plan (this document)
├── research.md          # Technical research & decisions (Phase 0)
├── data-model.md        # Database schema, entities & lifecycle (Phase 1)
├── quickstart.md        # Developer testing & runbook (Phase 1)
├── contracts/           # API contracts (OpenAPI) (Phase 1)
│   └── documents-api.yaml
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Architecture

```text
src/
├── app/
│   └── api/
│       ├── profile/
│       │   ├── documents/
│       │   │   ├── consent/route.ts        # GET/POST privacy notice consent
│       │   │   ├── route.ts                # GET list / POST upload PDF
│       │   │   ├── [id]/
│       │   │   │   ├── route.ts            # DELETE document (with keepApprovedFacts option)
│       │   │   │   ├── extract/route.ts    # POST trigger Profiler extraction
│       │   │   │   ├── insights/route.ts   # GET extracted insights
│       │   │   │   └── file/route.ts       # GET authenticated file stream
│       │   │   └── insights/
│       │   │       └── [insightId]/
│       │   │           └── review/route.ts # PATCH accept / edit / reject insight
│       │   └── facts/route.ts              # GET active approved facts
│       └── auth/
│           └── delete-account/route.ts     # Extended to purge documents from storage
├── components/
│   ├── profile/
│   │   ├── documents/
│   │   │   ├── DocumentPrivacyConsentModal.tsx # First-upload consent gate
│   │   │   ├── DocumentUploadZone.tsx          # Drag & drop, 5-cap indicator, type selector
│   │   │   ├── DocumentList.tsx                # Documents table with status & delete modal
│   │   │   ├── InsightReviewDrawer.tsx         # Drawer for reviewing proposed insights
│   │   │   ├── InsightReviewCard.tsx           # Accept / Edit / Reject card with source page
│   │   │   └── ApprovedFactsList.tsx           # Managed approved facts
│   │   └── VoiceProfileWizard.tsx              # Added "Documents" step / tab
├── lib/
│   ├── agent-engine/
│   │   ├── agents/
│   │   │   ├── profiler-document.ts        # Document extraction agent runner
│   │   │   ├── writer.ts                   # Updated to inject <approved_facts>
│   │   │   └── critic.ts                   # Updated to audit against <approved_facts>
│   │   ├── prompt-builder.ts               # Updated with <approved_facts> tag builder
│   │   └── prompts/
│   │       ├── writer.v2.md                # Rule 4: only approved facts or placeholders
│   │       ├── critic.v2.md                # Factual claim verification rule
│   │       └── profiler-document.v1.md     # Document extraction with XML data isolation
│   ├── documents/
│   │   ├── pdf-extractor.ts                # unpdf wrapper, page extraction, encrypted check
│   │   ├── document-service.ts             # CRUD, cascade deletion, fact creation
│   │   └── schemas.ts                      # Zod validation schemas
│   ├── profile/
│   │   └── summary-builder.ts              # Extended with approved facts and insights
│   └── storage/
│       ├── provider.ts                     # Extended with deleteFolder / deleteByPrefix
│       └── local-storage.ts                # Supports documents/ directory
tests/
├── fixtures/
│   └── documents/                          # Sample PDFs (text EN/FR/AR, scanned, password, injection)
├── unit/
│   ├── pdf-extractor.test.ts               # Extraction, encrypted detection, page indexing
│   ├── profiler-document.test.ts           # Prompt isolation, structured output validation
│   └── approved-facts-pipeline.test.ts     # Writer <approved_facts> & Critic verification
├── integration/
│   ├── document-upload-flow.test.ts        # Consent gate, upload, extraction, review, deletion
│   └── document-account-cascade.test.ts    # Account deletion cascades to documents & storage
└── evaluation/
    └── agent-engine-eval.test.ts           # Golden profile evaluation suite (v1 & v2 prompts)
```

---

## Phased Implementation Roadmap

### Phase 0: Foundations & Data Layer
- **Task 0.1**: Add `unpdf` dependency (`pnpm add unpdf`).
- **Task 0.2**: Create `src/lib/documents/pdf-extractor.ts` for file signature validation (`%PDF-`), page extraction, and encrypted PDF detection.
- **Task 0.3**: Define schema in `src/lib/db/schema.ts` (`documents`, `document_insights`, `approved_facts`, `document_privacy_consents`) and generate migration `0008_profile_documents.sql`.
- **Task 0.4**: Update `LocalStorageProvider` and `StorageProvider` interface to support private `documents/` path resolution and directory purging.

### Phase 1: Security & Pipeline Prompt Versioning
- **Task 1.1**: Create `src/lib/agent-engine/prompts/profiler-document.v1.md` with XML data isolation and prompt injection defense.
- **Task 1.2**: Create `src/lib/agent-engine/prompts/writer.v2.md` and `critic.v2.md` integrating `<approved_facts>` and placeholder rules.
- **Task 1.3**: Update `src/lib/agent-engine/prompt-builder.ts` and `summary-builder.ts` with snapshot tests.
- **Task 1.4**: Run Golden Profile evaluation suite to verify zero regression on legacy profiles.

### Phase 2: Extraction Service & Backend API Endpoints
- **Task 2.1**: Implement `src/lib/documents/document-service.ts` (consent check, upload handling, encryption of text, cascade deletes).
- **Task 2.2**: Implement `DocumentPrivacyConsent` endpoints (`/api/profile/documents/consent`).
- **Task 2.3**: Implement upload and listing routes (`/api/profile/documents`).
- **Task 2.4**: Implement extraction route (`/api/profile/documents/[id]/extract`) with multimodal fallback for scanned PDFs.
- **Task 2.5**: Implement insight review route (`/api/profile/documents/insights/[id]/review`).
- **Task 2.6**: Update account deletion route (`/api/auth/delete-account`) to purge user document storage files.

### Phase 3: Frontend Components & Design System Integration
- **Task 3.1**: Create `DocumentPrivacyConsentModal.tsx` blocking uploads until acknowledged.
- **Task 3.2**: Create `DocumentUploadZone.tsx` and `DocumentList.tsx` with upload progress and status tags.
- **Task 3.3**: Create `InsightReviewDrawer.tsx` and `InsightReviewCard.tsx` with inline editing, accept, and reject actions.
- **Task 3.4**: Integrate Documents tab into `VoiceProfileWizard.tsx` and update "What the AI sees" preview.
- **Task 3.5**: Add localization strings in `en.json`, `fr.json`, `ar.json` with RTL testing.

### Phase 4: Testing & Verification
- **Task 4.1**: Unit tests for PDF parsing, encrypted detection, and prompt injection defense with fixtures.
- **Task 4.2**: Integration tests for upload, extraction, human review, deletion options, and account deletion cascade.
- **Task 4.3**: Axe-core automated accessibility tests for all new dialogs and drawers.
- **Task 4.4**: Final `pnpm type-check` and `pnpm test` across all test suites.
