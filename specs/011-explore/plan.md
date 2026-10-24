# Implementation Plan: Explore (with Tavily Search)

**Branch**: `011-explore` | **Date**: 2026-10-24 | **Spec**: [specs/011-explore/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/011-explore/spec.md)  
**Input**: Feature specification from `/specs/011-explore/spec.md` and Epic 11 design from `docs/11-explore.md`

---

## Summary

Add an Explore page to Saouti powered by the user's free Tavily search API key (with curated RSS/Atom news feed fallback). The feature delivers:
1. **Search Key Setup**: A skippable, guided step during onboarding (after Gemini AI key) with step-by-step guides in English, French, and Arabic; encrypted vault storage (AES-256-GCM); Settings key rotation/deletion; and a one-time dismissible prompt for existing users.
2. **Topic Management**: Topic Planner agent proposes 5 to 8 topics from the user's Voice Profile (role, industry, expertise, audience), presented as interactive chips with search credit cost badges.
3. **Explore Feed & Live Researcher Agent**: Searches web articles, extracts structured metadata, and summarizes each in ≤40 plain words with a "Why it matches" badge and original publisher links.
4. **Article-to-Post Generation**: One-click "Create Post" pre-fills the composer with the article attached as `<source_article>`, with strict Writer and Critic factual grounding and source attribution.
5. **Reading List & Notes**: Saved articles view with topic/date filtering, deduplication by canonical URL, and private notes.
6. **Quota Guard & Privacy**: Query privacy assertion (zero personal profile data in outgoing searches), 24h caching, daily search caps, monthly credit guard, and post drafting priority over background searches.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes: true`) on Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), React 19, Drizzle ORM, Zod, `@tabler/icons-react`, `next-intl`, `@google/genai` (via internal provider adapter), fast XML / RSS parser (e.g. `fast-xml-parser` or native fetch)  
**Storage**: PostgreSQL 16 (Drizzle schema: `api_keys` extended with `provider`, `topics`, `articles`, `saved_articles`, `article_dismissals`, `search_usage_counters`), Redis 7 / BullMQ (priority queue for search refreshes and SSE streaming)  
**Testing**: Vitest 3.x (unit, integration, security injection suites), Playwright (accessibility WCAG AA, keyboard nav, RTL Arabic tests)  
**Target Platform**: Node.js 20 Linux/Windows container, modern web browsers (Chrome, Edge, Firefox, Safari)  
**Project Type**: Full-stack Next.js App Router application (`src/app/`, `src/components/`, `src/lib/`, `src/worker/`)  
**Performance Goals**: Explore feed renders within 1.5s on cached queries; full refresh executes within 3-5s per topic; 0ms UI blocking via background jobs & SSE  
**Constraints**: Zero profile leakage to search engines; AES-256-GCM encryption at rest; untrusted web snippet isolation; strict WCAG 2.1 AA and RTL Arabic support  
**Scale/Scope**: 1,000 monthly Tavily credits on free tier; 5-8 topics per user; 5-10 articles per topic; 100% test coverage on security/query privacy paths  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Status |
|---|-----------|---------------|--------|
| 1 | **Spec-First Governance** | Does this feature have a completed `spec.md` with prioritized user stories, acceptance criteria, and quality validation? | ✅ Pass — [spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/011-explore/spec.md) created and validated against checklist. |
| 2 | **Security & Privacy First** | Are API keys encrypted at rest and never exposed to the browser/logs? Is all user content passed as tagged data blocks? Are outgoing search queries sanitized to topic phrases only? | ✅ Pass — Multi-provider key vault uses AES-256-GCM; queries contain strictly topic phrases; web snippets isolated in XML tags. |
| 3 | **Test Discipline** | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed before or alongside implementation tasks? | ✅ Pass — All 9 user stories define Given/When/Then scenarios with dedicated unit, integration, and security test plans. |
| 4 | **Provider Independence** | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction interface? | ✅ Pass — Search provider abstraction `SearchProvider` cleanly separates Tavily, RSS feeds, and Gemini grounding. |
| 5 | **Transparency** | Are all agent events streamed via SSE? Is the activity timeline accurate for Researcher and Topic Planner steps? | ✅ Pass — Live Researcher agent events streamed via SSE; quota pauses displayed as explicit agent states. |
| 6 | **Accessibility & Localisation** | Are all new UI strings externalised to locale files? Is RTL layout handled for Arabic? Do components meet WCAG AA in both themes? | ✅ Pass — Comprehensive i18n in EN, FR, and AR; RTL topic chips; axe-core automated scans specified. |
| 7 | **Simplicity** | Are all new dependencies free/OSS? Is any new abstraction solving a present, concrete problem? | ✅ Pass — Reuses existing key vault, database client, and agent orchestrator; no redundant third-party cloud services. |
| 8 | **Quality Gates** | Will lint → type-check → tests → a11y → build all pass? Are there no unsuppressed lint/TS errors? | ✅ Pass — Zero TypeScript `any`, strict null checks, and comprehensive quality gates enforced. |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-explore/
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Specification quality checklist
├── research.md          # Technical research and architectural decisions
├── data-model.md        # Drizzle schema extensions and Zod schemas
├── contracts/
│   └── explore-api.yaml # OpenAPI 3.0 REST endpoint contracts
├── quickstart.md        # Local testing and manual verification guide
├── plan.md              # This file
└── tasks.md             # Actionable task list (created in Phase 2)
```

### Source Code (concrete repository layout)

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── explore/
│   │   │   ├── page.tsx                             # Explore main feed view
│   │   │   └── saved/
│   │   │       └── page.tsx                         # Saved reading list view
│   │   └── onboarding/
│   │       └── page.tsx                             # Onboarding with Tavily key step
│   └── api/
│       ├── explore/
│       │   ├── topics/
│       │   │   ├── route.ts                         # GET / POST topics
│       │   │   ├── [id]/route.ts                    # PATCH / DELETE topic
│       │   │   └── generate/route.ts                # POST generate topics from profile
│       │   ├── feed/route.ts                        # GET explore feed articles
│       │   ├── refresh/route.ts                     # POST refresh explore feed
│       │   ├── saved/
│       │   │   ├── route.ts                         # GET / POST saved articles
│       │   │   └── [id]/route.ts                    # PATCH / DELETE saved article
│       │   └── dismiss/route.ts                     # POST dismiss article
│       ├── settings/
│       │   └── keys/
│       │       └── tavily/route.ts                  # GET / POST / DELETE Tavily key
│       └── onboarding/
│           └── tavily-prompt/dismiss/route.ts       # POST dismiss existing user prompt
├── components/
│   ├── explore/
│   │   ├── ExploreFeedView.tsx                      # Main explore client container
│   │   ├── ArticleCard.tsx                          # Article card with summary & actions
│   │   ├── TopicChipsBar.tsx                        # Topic chips with credit badges
│   │   ├── TopicEditModal.tsx                       # Add/edit topic modal
│   │   ├── SavedArticlesView.tsx                    # Bookmarked articles list
│   │   ├── QuotaEstimateBadge.tsx                   # Tavily credits / quota preview badge
│   │   ├── TavilyKeyPromptCard.tsx                  # One-time dismissible banner
│   │   └── SearchBox.tsx                            # Ad-hoc topic search input
│   ├── onboarding/
│   │   └── TavilyKeyStep.tsx                        # Onboarding Tavily key step
│   └── settings/
│       └── TavilyKeySettingsCard.tsx                # Settings Tavily key manager
├── lib/
│   ├── db/
│   │   ├── schema.ts                                # topics, articles, savedArticles schemas
│   │   └── migrations/
│   │       └── 0009_explore_tavily.sql              # Additive migration
│   ├── search/
│   │   ├── provider.ts                              # SearchProvider interface & types
│   │   ├── tavily-adapter.ts                        # Tavily API adapter implementation
│   │   ├── rss-adapter.ts                           # Curated RSS/Atom news feed fallback
│   │   ├── pipeline.ts                              # SearchPipelineService fallback chain
│   │   └── url-normalizer.ts                        # Tracking parameter stripper
│   ├── agent-engine/
│   │   ├── agents/
│   │   │   ├── topic-planner.ts                     # Topic Planner agent runner
│   │   │   └── researcher.ts                        # Researcher agent runner
│   │   └── prompts/
│   │       ├── topic-planner.v1.md                  # Topic Planner prompt
│   │       ├── researcher.v1.md                     # Researcher ranking prompt
│   │       ├── writer.v3.md                         # Writer prompt with <source_article>
│   │       └── critic.v3.md                         # Critic prompt with source verification
│   └── explore/
│       ├── explore-service.ts                       # Feed aggregation, caching & storage
│       ├── quota-guard.ts                           # Credit tracking, daily & monthly caps
│       └── schemas.ts                               # Zod schemas for topics, articles, keys
tests/
├── unit/
│   ├── tavily-key.test.ts                           # Key validation & AES encryption
│   ├── topic-planner.test.ts                        # Topic planner prompt & parsing
│   ├── explore-feed.test.ts                         # Snippet isolation & canonical URLs
│   ├── explore-writer.test.ts                       # Post creation & attribution rules
│   └── quota-guard.test.ts                          # Credit guard & daily limits
├── integration/
│   ├── tavily-onboarding.test.ts                    # Onboarding step & settings lifecycle
│   ├── search-fallback.test.ts                      # Fallback from Tavily 429 to RSS feeds
│   ├── explore-post-creation.test.ts                # Article -> Post drafting -> Critic
│   └── saved-articles.test.ts                       # Save, note, and deduplication flow
├── security/
│   ├── search-privacy.test.ts                       # 0% profile leakage in search requests
│   └── web-snippet-injection.test.ts                # Hostile snippet isolation tests
└── e2e/
    ├── explore-a11y.spec.ts                         # axe-core WCAG AA & RTL Arabic audits
    └── explore-user-journey.spec.ts                 # Full onboarding -> explore -> post flow
```

---

## Complexity Tracking

*No constitution violations. All architectural choices strictly conform to Principles 1 through 8.*
