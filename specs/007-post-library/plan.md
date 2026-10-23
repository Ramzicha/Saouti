# Implementation Plan: 007 — Post Library

**Branch**: `007-post-library` | **Date**: 2026-10-23 | **Spec**: [specs/007-post-library/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/007-post-library/spec.md)  
**Input**: Feature specification from `/specs/007-post-library/spec.md`

---

## Summary

Build the Saouti Post Library enabling automatic persistence of generated posts from the agent engine, in-place editing, one-click copying preserving exact line breaks, emojis, and hashtags via the browser Clipboard API with a resilient `<textarea>` fallback, multi-attribute combined filtering (platform, status, date range, tags), full-text multilingual search supporting Arabic (with orthographic normalization), French, and English backed by PostgreSQL GIN-indexed `search_vector`, cursor-based keyset pagination for smooth scaling, version history capped at 20 versions with restoration, and a two-tier deletion lifecycle (10-second floating countdown undo banner transitioning to a 30-day soft-delete Trash bin).

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, exactOptionalPropertyTypes) + Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), Drizzle ORM, Zod, `@tabler/icons-react`, `next-intl`  
**Storage**: PostgreSQL 16 (`posts`, `post_versions`, `tags`, `post_tags` with generated `search_vector` tsvector and GIN indexes)  
**Testing**: Vitest (unit, integration with test database), Playwright (E2E for one-click copy and mark-as-posted)  
**Target Platform**: Linux server / Hostinger containerized Docker Compose stack  
**Project Type**: Next.js App Router full-stack web application with client-side reactive components  
**Performance Goals**: One-click copy executes in < 150ms; combined filter and full-text search queries return in < 200ms for 1,000+ posts; cursor pagination keyset lookup in < 25ms  
**Constraints**: Zero clipboard data loss (exact preservation of Unicode emojis and blank lines); maximum 20 versions retained per post; max 5 tags per post (max 30 chars per tag); 100% tenant data isolation scoped by `user_id`  
**Scale/Scope**: Supports hundreds of posts per user across 5 social platforms; handles Arabic orthographic normalization across Alef variants, Taa Marbuta, and Tashkeel  

---

## Constitution Check

*GATE: Evaluated against all 8 principles.*

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` with all clarification points resolved? | ✅ Pass |
| 2 | **Security & Privacy First** | Are all queries strictly scoped by `user_id` to prevent cross-tenant data leakage? Are deleted posts isolated? | ✅ Pass |
| 3 | **Test Discipline** | Does every user story have Given/When/Then scenarios? Are integration tests against the test DB and Playwright E2E tests planned? | ✅ Pass |
| 4 | **Provider Independence** | Is the post library independent of AI provider implementations, treating outputs as standard relational data? | ✅ Pass |
| 5 | **Transparency** | Are post generation origins, timestamps, and edit version histories completely transparent to the user? | ✅ Pass |
| 6 | **Accessibility & Localisation** | Are all strings in `messages/{en,fr,ar}.json`? Is RTL layout supported for Arabic search and filters? Are undo countdown announcements accessible? | ✅ Pass |
| 7 | **Simplicity** | Does search use PostgreSQL 16 built-in FTS instead of external search clusters? Does clipboard copy use native Web APIs with zero external dependencies? | ✅ Pass |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build all pass with zero unsuppressed errors? | ✅ Pass |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-post-library/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Architectural decisions & research
├── data-model.md        # Drizzle schemas, FTS migration, Zod schemas
├── quickstart.md        # Testing and execution guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── contracts/
    └── post-library.contract.ts  # REST API request/response contracts
```

### Source Code Organization

```text
src/
├── app/
│   ├── [locale]/
│   │   └── (dashboard)/
│   │       ├── library/
│   │       │   ├── page.tsx                     # Post Library main page
│   │       │   └── trash/
│   │       │       └── page.tsx                 # 30-day Trash bin page
│   │       └── ...
│   └── api/
│       ├── posts/
│       │   ├── route.ts                         # GET (list/filter/search), POST (manual create)
│       │   ├── export/
│       │   │   └── route.ts                     # GET (export Markdown / plain text)
│       │   └── [id]/
│       │       ├── route.ts                     # GET (details), PATCH (edit), DELETE (hard delete)
│       │       ├── mark-posted/
│       │       │   └── route.ts                 # POST (mark as posted with URL & date)
│       │       ├── trash/
│       │       │   └── route.ts                 # POST (soft delete / move to trash)
│       │       ├── restore/
│       │       │   └── route.ts                 # POST (restore from trash)
│       │       ├── versions/
│       │       │   ├── route.ts                 # GET (list version snapshots)
│       │       │   └── [versionId]/
│       │       │       └── restore/
│       │       │           └── route.ts         # POST (restore selected historical version)
│       │       └── tags/
│       │           ├── route.ts                 # POST (assign tag to post)
│       │           └── [tagId]/
│       │               └── route.ts             # DELETE (detach tag from post)
│       └── tags/
│           └── route.ts                         # GET (list all user tags), POST (create tag)
├── components/
│   └── library/
│       ├── PostCard.tsx                         # Post display card with quick actions
│       ├── PostEditorModal.tsx                  # Post copy and image prompt editor
│       ├── PostFilters.tsx                      # Combined filter toolbar (platform, status, date, tag)
│       ├── SearchInput.tsx                      # Multilingual search input with debounce
│       ├── CopyButton.tsx                       # One-click copy trigger with 2s confirmation
│       ├── VersionHistoryDrawer.tsx             # Version comparison & restore drawer
│       ├── UndoToast.tsx                        # Floating 10-second countdown undo banner
│       ├── MarkPostedModal.tsx                  # Modal for published URL and date
│       └── TagChip.tsx                          # Tag badge with remove action
├── lib/
│   ├── clipboard.ts                             # Resilient clipboard utility with textarea fallback
│   ├── search/
│   │   └── arabic-normalizer.ts                 # Pure Arabic orthographic normalization
│   ├── export/
│   │   ├── markdown-exporter.ts                 # Structured Markdown serializer
│   │   └── text-exporter.ts                     # Plain text serializer
│   └── db/
│       ├── schema.ts                            # Added posts, postVersions, tags, postTags
│       └── migrations/                          # Drizzle migration 0005
└── messages/
    ├── en.json                                  # English localization keys for library
    ├── fr.json                                  # French localization keys for library
    └── ar.json                                  # Arabic localization keys for library

tests/
├── contract/
│   └── post-library.contract.test.ts            # Type & contract validation tests
├── integration/
│   ├── post-library.test.ts                     # Database filter, search, versioning tests
│   └── post-trash-lifecycle.test.ts             # 10s undo and trash lifecycle tests
├── e2e/
│   ├── post-copy.spec.ts                        # Playwright test for one-click copy & clipboard
│   └── post-mark-posted.spec.ts                 # Playwright test for mark-as-posted flow
└── unit/
    ├── arabic-normalizer.test.ts                # Normalization unit tests (Alef, Taa, Tashkeel)
    ├── clipboard-formatter.test.ts              # Line break & emoji formatting preservation
    └── post-export.test.ts                      # Markdown & text export generators
```

---

## Complexity Tracking

| Component | Inherent Complexity | Justification & Management |
| :--- | :--- | :--- |
| **Multilingual PostgreSQL FTS** | Combining Arabic, French, and English search stemming in a single database column | Solved cleanly via a PostgreSQL generated `search_vector` tsvector column with GIN index, backed by an immutable SQL and TypeScript Arabic normalizer function without external search clusters. |
| **Two-Tier Deletion Lifecycle** | Immediate 10s client undo banner combined with a 30-day soft-delete trash bin | Client optimistic state handles the immediate 10s recovery window; database `deleted_at` timestamp handles the 30-day retention with zero risk of premature permanent data loss. |
| **Cursor-Based Keyset Pagination** | Encoding composite keys `(created_at, id)` across dynamic filter conditions | Encapsulated in a reusable database query builder helper that decodes/encodes opaque base64 cursors and computes `nextCursor`. |

---

## Implementation Phases

### Phase 0: Research & Pre-conditions (Completed)
- Documented decisions on schema architecture, PostgreSQL FTS multilingual search, cursor pagination, resilient clipboard copy, and two-tier deletion lifecycle in `research.md`.

### Phase 1: Data Model, Contracts & Design (Completed)
- Defined database schema for `posts`, `post_versions`, `tags`, and `post_tags` in `data-model.md`.
- Authored REST API wire contracts in `contracts/post-library.contract.ts`.
- Created testing and operational guide in `quickstart.md`.

### Phase 2: Schema Migrations & Core Utilities
- Add `posts`, `postVersions`, `tags`, and `postTags` tables to `src/lib/db/schema.ts`.
- Generate and apply Drizzle migration with PostgreSQL FTS generated `search_vector` and GIN index.
- Implement pure Arabic normalization in `src/lib/search/arabic-normalizer.ts`.
- Implement `src/lib/clipboard.ts` with modern Clipboard API and `<textarea>` fallback.
- Implement Markdown and text export formatters in `src/lib/export/`.

### Phase 3: Post Generation Bridge (Agent Engine Integration)
- Connect BullMQ generation run completion in `src/worker/processors/agent-engine.ts` to auto-insert generated platform posts into `posts` with status `draft`.
- Seed initial Version 1 snapshot for each auto-saved post.

### Phase 4: Backend REST API Routes
- Implement `GET /api/posts` with combined filters, cursor keyset pagination, and FTS search.
- Implement `GET /api/posts/[id]` and `PATCH /api/posts/[id]` with version snapshotting and 20-version pruning.
- Implement `POST /api/posts/[id]/mark-posted` with URL and date validation.
- Implement `POST /api/posts/[id]/trash`, `POST /api/posts/[id]/restore`, and `DELETE /api/posts/[id]`.
- Implement `GET /api/posts/[id]/versions` and `POST /api/posts/[id]/versions/[versionId]/restore`.
- Implement tag association endpoints and `GET /api/posts/export`.

### Phase 5: UI Components & Frontend Library Views
- Implement `CopyButton.tsx` with accessible announcements and 2-second confirmation badge.
- Implement `PostCard.tsx` displaying platform badge, status chip, tags, copy trigger, and action menu.
- Implement `PostFilters.tsx` and `SearchInput.tsx` supporting Arabic RTL input and debounce.
- Implement `PostEditorModal.tsx` and `MarkPostedModal.tsx`.
- Implement `VersionHistoryDrawer.tsx` showing chronological snapshots and restore buttons.
- Implement `UndoToast.tsx` with 10-second live progress bar and "Undo" button.
- Build library page `src/app/[locale]/(dashboard)/library/page.tsx` and trash page `trash/page.tsx`.
- Add all localization strings to `messages/en.json`, `messages/fr.json`, and `messages/ar.json`.

### Phase 6: Integration, E2E & Accessibility Testing
- Implement `tests/unit/arabic-normalizer.test.ts` and `tests/unit/clipboard-formatter.test.ts`.
- Implement `tests/integration/post-library.test.ts` testing combined filters, search, and version restoration.
- Implement `tests/e2e/post-copy.spec.ts` testing one-click copy and clipboard preservation.
- Implement `tests/e2e/post-mark-posted.spec.ts` testing mark-as-posted status update and URL validation.
- Run automated axe-core checks on library views and modals.

### Phase 7: Quality Gates Verification
- Run `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`.
