# Implementation Plan: 002-visual-foundation

**Branch**: `002-visual-foundation` | **Date**: 2026-10-23 | **Spec**: [specs/002-visual-foundation/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/002-visual-foundation/spec.md)
**Input**: Feature specification from `specs/002-visual-foundation/spec.md`

## Summary

Build the visual foundation, core component library, and responsive application shell for Saouti based directly on `docs/design-system/design.md`. The technical approach uses semantic CSS custom properties (`--bg`, `--surface`, `--accent`, `--border`, agent tokens, etc.) defined in `globals.css` and mapped into Tailwind CSS utility classes. The theme (`dark`, `light`, or `system`) and locale (`en`, `fr`, `ar`) preferences are persisted in HTTP-accessible cookies so Next.js 15 App Router server-side renders the root `<html>` tag with explicit `data-theme` and `dir`/`lang` attributes, eliminating any visual flash of unstyled theme or wrong layout direction. Multilingual localization is provided via `next-intl` (App Router structure) with localized message catalogs (`en.json`, `fr.json`, `ar.json`) and bidirectional layout via CSS logical properties (`margin-inline`, `padding-inline`, `border-inline-start`, `text-align: start`). Web fonts (`Inter`, `Instrument Serif`, `Noto Sans Arabic`) are loaded with zero layout shift via `next/font/google`. An interactive component gallery (`/design`) documents all core primitives, agent presence chips, and agent timeline states across both themes and both text directions. All components meet WCAG AA contrast, include visible 2px `--accent` focus rings, and support full keyboard navigability.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode, noImplicitAny, strictNullChecks, no `any`)  
**Primary Dependencies**: Next.js 15 (App Router), React 19, Tailwind CSS 3.4, `next-intl` 3.x, `@tabler/icons-react` (or `lucide-react`) for SVG icons, `clsx` + `tailwind-merge`  
**Storage**: Client cookies (`saouti-theme`, `saouti-locale`) for zero-flash SSR persistence; no database entities needed for Epic 1  
**Testing**: Vitest 3.x + `@testing-library/react` + `@testing-library/jest-dom` for unit and component accessibility testing; Playwright 1.49+ for automated visual regression & axe-core accessibility checks  
**Target Platform**: Modern evergreen desktop and mobile browsers (Chrome, Firefox, Safari, Edge); responsive breakpoint at 760px  
**Project Type**: Next.js 15 App Router web application (in monorepo root alongside background worker)  
**Performance Goals**: First Contentful Paint (FCP) < 0.8s on fast 3G; 0ms flash of unstyled theme (zero FOIT/FOUT/FOUC); 60 FPS transitions  
**Constraints**: Zero raw hex colors in component files; all text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large); animations disabled when `prefers-reduced-motion: reduce`; strictly offline/mock event data (no external AI calls, real data, or user auth)  
**Scale/Scope**: 5 core component categories (Buttons, Chips, Cards, Inputs, Toasts), 2 full page views (`/` App Shell and `/design` Component Gallery), 3 locales (`en`, `fr`, `ar`), 2 themes (`dark`, `light`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle                        | Gate question                                                                                                                                                                        | Status                                                                                                                                    |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Spec-First Governance**        | Does this feature have a completed `spec.md` reviewed by `/03-speckit.clarify` and a consistency report from `/06-speckit.analyze`?                                                  | ✅ Pass (spec.md approved and ready for planning)                                                                                         |
| 2   | **Security & Privacy First**     | Are API keys encrypted at rest and never exposed to the browser/logs? Is all user content passed as tagged data blocks, not instructions? Are queries scoped by user id?             | ✅ Pass (No API keys or DB mutations in Epic 1; mock events only)                                                                         |
| 3   | **Test Discipline**              | Does every user story have Given/When/Then acceptance scenarios? Are test tasks listed before or alongside implementation tasks in `tasks.md`?                                       | ✅ Pass (acceptance scenarios defined for E1-S1 through E1-S5; Vitest + Playwright scheduled)                                             |
| 4   | **Provider Independence**        | Are model names and provider IDs in config only? Does all AI communication go through the provider abstraction interface?                                                            | ✅ Pass (No live LLM calls; UI driven by plain event list)                                                                                |
| 5   | **Transparency**                 | Are all agent events streamed via SSE? Is the activity timeline accurate for the deterministic pipeline steps in this feature?                                                       | ✅ Pass (Agent presence chip and timeline accurately display the 5 deterministic pipeline states: done, working, waiting, paused, failed) |
| 6   | **Accessibility & Localisation** | Are all new UI strings externalised to locale files? Is RTL layout handled for Arabic? Do components meet WCAG AA in both themes?                                                    | ✅ Pass (next-intl for en/fr/ar, dir="rtl" + CSS logical properties, WCAG AA contrast checked)                                            |
| 7   | **Simplicity**                   | Are all new dependencies free/OSS? Is any new abstraction solving a present, concrete problem (not speculative)? Is extra infrastructure justified in the Complexity Tracking table? | ✅ Pass (All libraries are OSS; next-intl and Tailwind plugins solve immediate requirements)                                              |
| 8   | **Quality Gates**                | Will lint → type-check → tests → a11y → build all pass? Are there no unsuppressed lint/TS errors?                                                                                    | ✅ Pass (Clean build, zero lint errors, 80%+ test coverage standard)                                                                      |

## Project Structure

### Documentation (this feature)

```text
specs/002-visual-foundation/
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Requirements verification checklist
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Technical research & architectural choices
├── data-model.md        # UI models, theme/locale schemas, and agent event contracts
├── quickstart.md        # Developer setup, component gallery guide, and test runs
└── contracts/
    └── agent-events.json # JSON schema specification for agent presence event logs
```

### Source Code (repository root)

```text
messages/
├── en.json
├── fr.json
└── ar.json

src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Root HTML with data-theme, lang, dir attributes
│   │   ├── page.tsx                # Main application shell (sidebar + workspace + composer)
│   │   └── design/
│   │       └── page.tsx            # Component Gallery showcasing all tokens, components, agent presence
│   ├── api/
│   │   └── health/
│   │       └── route.ts            # Retained from Foundation
│   ├── globals.css                 # CSS variables (:root[data-theme="dark|light"]), font definitions
│   └── favicon.ico
├── components/
│   ├── ui/
│   │   ├── Button.tsx              # Primary, secondary, icon button variants
│   │   ├── Chip.tsx                # Filter, selection, and status chip variants
│   │   ├── Card.tsx                # PostCard and surface card containers
│   │   ├── Input.tsx               # Accessible form controls & composer input
│   │   ├── Toast.tsx               # Accessible toast notification container
│   │   └── Modal.tsx               # Accessible dialog container (for drawer/popovers)
│   ├── layout/
│   │   ├── AppHeader.tsx           # 56px header with title & active-agent chip
│   │   ├── Sidebar.tsx             # 240px navigation sidebar & mobile drawer (<760px)
│   │   └── Composer.tsx            # Bottom pinned composer input with agent/model chips & send button
│   ├── agent/
│   │   ├── AgentChip.tsx           # Header active-agent chip with middle-dot format
│   │   └── ActivityTimeline.tsx    # Ordered agent timeline rows (done, working, waiting, paused, failed)
│   └── common/
│       ├── ThemeToggle.tsx         # Light / Dark / System toggle with cookie sync
│       └── LocaleSwitcher.tsx      # Language selector (en / fr / ar)
├── i18n/
│   ├── routing.ts                  # next-intl routing configuration
│   ├── request.ts                  # next-intl request configuration
│   └── navigation.ts               # Localized Link, useRouter, usePathname
├── lib/
│   ├── fonts.ts                    # Inter, Instrument Serif, Noto Sans Arabic via next/font/google
│   ├── theme.ts                    # Theme cookie reader & client state hook
│   └── agent-events.ts             # Agent event types, state parsers & mock timeline fixtures
├── middleware.ts                   # Combines x-request-id tracing with next-intl locale negotiation
└── tests/
    ├── unit/
    │   ├── theme.test.ts           # Cookie resolution and theme state logic
    │   ├── components.test.tsx     # Testing Library renders for core components
    │   └── agent-timeline.test.tsx # Agent presence states and duration formatting
    └── e2e/
        ├── a11y.spec.ts            # Playwright + axe-core accessibility audits in dark & light
        └── visual.spec.ts          # Shell responsiveness, drawer toggle, and RTL mirroring
```

**Structure Decision**: Next.js 15 App Router localized pattern using `src/app/[locale]` layout structure supported by `next-intl` middleware and cookie-based theme hydration to guarantee zero-flash SSR and bidirectional rendering.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because                                |
| --------- | ---------- | ------------------------------------------------------------------- |
| _None_    | N/A        | All architectural choices adhere strictly to simplicity principles. |
