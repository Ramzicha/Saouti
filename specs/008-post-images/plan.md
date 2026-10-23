# Implementation Plan: Post Images & Visual Generation

**Branch**: `008-post-images` | **Date**: 2026-10-23 | **Spec**: [specs/008-post-images/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/008-post-images/spec.md)  
**Input**: Feature specification and plan prompt: *"Extend the provider interface generateImage method and implement it in the Gemini adapter with model names from configuration and capability detection that fails gracefully. Store images on a local volume behind an abstraction that can later point to S3-compatible storage, served only to the owning user through authenticated routes. Add an Image table with migration. Add tests with the fake provider for success, unsupported tier, rate limit and deletion cascade."*

---

## Summary

This feature adds comprehensive visual support to Saouti posts:
1. **Art Director Visual Prompts**: Displays editable, copyable image prompts, platform-native aspect ratios (16:9, 1:1, 4:5), and accessibility alt text.
2. **Provider Image Generation & Graceful Degradation**: Extends the `AiProviderAdapter` interface with `generateImage` and capability detection. Implements the Gemini adapter targeting `imagen-3.0-generate-002` (configurable via `aiConfig.models.image`) with deterministic detection of unsupported tiers, failing gracefully to the prompt-only view without unhandled errors.
3. **Pluggable Storage Abstraction**: Implements `StorageProvider` interface with a `LocalStorageProvider` storing assets in private user-isolated directories (`data/images/{userId}/{postId}/{imageId}.{ext}`), fully prepared for drop-in S3-compatible object storage.
4. **Authenticated Serving & Download**: Images are served exclusively to their authenticated owner via streaming App Router endpoints (`/api/posts/[id]/images/[imageId]`), with download support and automatic cascade deletion.
5. **Image Retention & Iteration**: Supports regenerating images with custom refinement instructions, retaining up to 5 iterations per post with FIFO pruning of non-primary images.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, exactOptionalPropertyTypes, no `any`) + Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), React 19, Drizzle ORM, Zod, `@tabler/icons-react`, `next-intl`  
**Storage**: PostgreSQL 16 (`images` table with foreign keys `ON DELETE CASCADE`), Local filesystem storage (`LocalStorageProvider` with path-traversal safeguards)  
**Testing**: Vitest 3.x (unit and integration tests with `FakeAiAdapter`), Playwright (E2E visual controls & RTL testing)  
**Target Platform**: Node.js 20 on Linux/Hostinger VPS & Windows local dev  
**Project Type**: Next.js 15 Full-Stack Web Application  
**Performance Goals**: Image generation capability check ≤ 100ms; authenticated image streaming time-to-first-byte ≤ 150ms; 0 orphaned files after deletion  
**Constraints**: Maximum 10 MB per image; maximum 5 image iterations per post; strictly zero cross-user access to image files  
**Scale/Scope**: Up to 5 images per post; 100% authenticated route protection; full dark/light theme and Arabic RTL support  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` with resolved clarifications and quality checklist? | ✅ Pass — `spec.md` and checklist signed off |
| 2 | **Security & Privacy First** | Are API keys encrypted at rest and never exposed? Are image assets served exclusively via authenticated routes? Is cascade deletion verified? | ✅ Pass — images are never in public static dirs; authenticated streaming only; cascade deletion on post purge |
| 3 | **Test Discipline** | Does every user story have Given/When/Then acceptance scenarios? Are test tasks planned for unit, integration, and fake-provider contract? | ✅ Pass — comprehensive test plan for success, unsupported tier, rate-limit, and deletion cascade |
| 4 | **Provider Independence** | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction? | ✅ Pass — `generateImage` on `AiProviderAdapter`; model from `aiConfig.models.image` |
| 5 | **Transparency** | Are Art Director states visible during generation, quota pause, and error? | ✅ Pass — transparent countdown banner on 429 quota exhaustion; plain-language capability notifications |
| 6 | **Accessibility & Localisation** | Are all strings externalised to locale files (ar, fr, en)? Does preview support Arabic RTL? Does every image render alt text? | ✅ Pass — complete `next-intl` keys, RTL gallery layout, WCAG AA contrast, and screen-reader alt text |
| 7 | **Simplicity** | Are all new abstractions solving present problems? Is local storage used without external paid dependencies? | ✅ Pass — simple `StorageProvider` abstraction for local disk, easily adaptable to S3 |
| 8 | **Quality Gates** | Will lint, type-check, tests, and build all pass? | ✅ Pass — strict TypeScript, zero warnings, full test suite |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-post-images/
├── spec.md              # Feature specification with user stories and requirements
├── checklists/
│   └── requirements.md  # Quality validation checklist
├── research.md          # Architectural decisions (provider layer, storage, retention)
├── data-model.md        # Database schema, Drizzle definitions, and Zod schemas
├── contracts/
│   └── images-api.yaml  # OpenAPI 3.0 specification for image endpoints
├── quickstart.md        # Verification walkthrough and test guide
├── plan.md              # This implementation plan
└── tasks.md             # Implementation tasks (generated by /05-speckit.tasks)
```

### Source Code Changes

```text
src/
├── lib/
│   ├── ai/
│   │   ├── config.ts               # Adds aiConfig.models.image ('imagen-3.0-generate-002')
│   │   ├── errors.ts               # Adds AiUnsupportedCapabilityError and AiSafetyBlockError
│   │   ├── provider.ts             # Extends AiProviderAdapter with generateImage & capability check
│   │   ├── gemini.ts               # Implements Imagen 3 call & graceful error handling
│   │   └── fake-adapter.ts         # Implements mock image generation for all test scenarios
│   ├── storage/
│   │   ├── provider.ts             # StorageProvider interface (save, stream, delete)
│   │   └── local-storage.ts        # LocalStorageProvider with path validation & isolation
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema: images table & relations
│   │   └── migrations/             # Migration 0006 for images table
│   ├── validation/
│   │   └── image-schemas.ts        # Zod request validation schemas
│   └── library/
│       └── image-service.ts        # Image lifecycle, DB queries, pruning & cascade cleanup
├── components/
│   └── library/
│       ├── ImagePromptCard.tsx     # Editable prompt, aspect ratio badge, alt text, copy button
│       ├── ImagePreviewGallery.tsx # Image viewer, thumbnail version switcher, download button
│       ├── ImageRegenerateModal.tsx# Refinement instruction dialog
│       └── ImageCapabilityBanner.tsx# Friendly unsupported tier explanation
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   └── capabilities/image/route.ts # Capability status endpoint
│   │   └── posts/[id]/
│   │       └── images/
│   │           ├── route.ts        # List images for post
│   │           ├── generate/route.ts # Generate image endpoint
│   │           ├── regenerate/route.ts # Refine image endpoint
│   │           └── [imageId]/
│   │               ├── route.ts    # GET authenticated stream / DELETE
│   │               ├── download/route.ts # Download endpoint
│   │               └── primary/route.ts  # Set primary image
messages/
├── en.json                         # Visuals, prompts, errors, and Art Director messages
├── fr.json
└── ar.json
tests/
├── unit/
│   ├── image-schemas.test.ts
│   ├── local-storage.test.ts
│   └── gemini-image-adapter.test.ts
├── integration/
│   ├── image-generation-flow.test.ts
│   ├── image-auth-isolation.test.ts
│   └── image-cascade-deletion.test.ts
└── e2e/
    ├── post-image-controls.spec.ts
    └── post-image-rtl.spec.ts
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `StorageProvider` abstraction | Decouples binary disk I/O from API routes to prepare for S3/R2 on VPS without rewrites | Direct filesystem calls in API routes would tightly couple the app to local disk and break when migrating to distributed/containerized storage |
| Dedicated `images` table | Supports iterative image versioning (up to 5 versions) and rich metadata (aspect ratio, dimensions, prompt) | Storing a single URL column on `posts` would lose visual history and prevent image regeneration comparisons |
