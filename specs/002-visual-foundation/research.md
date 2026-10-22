# Technical Research & Architecture Decisions: 002-visual-foundation

**Branch**: `002-visual-foundation` | **Date**: 2026-10-23

This document records technical research, evaluation criteria, and architectural decisions made for the visual foundation, theming, design system tokens, typography, localization, and agent presence components.

---

## 1. Design Tokens and Theme Switching Architecture

### Decision

Define all semantic color tokens as CSS custom properties (`--bg`, `--surface`, `--surface-raised`, `--border`, `--text`, `--muted`, `--accent`, `--accent-soft`, `--button`, `--on-button`, `--success`, `--danger`, and agent colors) under `:root[data-theme="dark"]` and `:root[data-theme="light"]` in `src/app/globals.css`. Map them into Tailwind CSS via `tailwind.config.ts`. Persist the active theme in an HTTP cookie (`saouti-theme="dark|light"`) with client-side fallback to `window.matchMedia('(prefers-color-scheme: dark)')`.

### Rationale

1. **Zero-Flash Paint (No FOUC)**: If theme storage is limited to `localStorage`, the server has no way of knowing the user's theme during HTML generation. The page would render in light mode and then flip to dark mode on client hydration, producing an intolerable visual flash. Reading an HTTP cookie during server rendering enables setting `<html data-theme="...">` synchronously before initial HTML delivery.
2. **System Theme Support**: An inline blocking script in the `<head>` checks `prefers-color-scheme` if the cookie is set to `system` (or unset), immediately applying the system preference attribute before the body is parsed.
3. **Strict Design Tokens**: By configuring Tailwind to reference `var(--...)`, components never reference hardcoded hex colors or arbitrary utility colors (like `bg-zinc-900`), enforcing Design System compliance.

### Alternatives Considered

- **Tailwind `class` strategy (`.dark`)**: Requires conditional class branching on every component (e.g. `bg-white dark:bg-black text-black dark:text-white`). This violates the single source of truth principle and introduces immense code bloat. CSS variables swap palettes automatically without altering component class lists.
- **CSS-in-JS (Emotion / styled-components)**: Incompatible with Next.js Server Components and introduces significant runtime overhead.
- **Client-only `localStorage` (e.g. basic `next-themes` without cookie header)**: Causes visible theme flash on initial page load.

---

## 2. Localization (i18n) and Right-to-Left (RTL) Bidirectionality

### Decision

Use `next-intl` (version 3.x) with Next.js 15 App Router standard layout structure (`src/app/[locale]/...`). Store localized messages in `messages/en.json`, `messages/fr.json`, and `messages/ar.json`. Enforce bidirectional layouts using **CSS Logical Properties** exclusively (`margin-inline`, `padding-inline`, `border-inline-start`, `text-align: start`, `inset-inline-start`).

### Rationale

1. **Official Next.js App Router Integration**: `next-intl` provides first-class support for React Server Components, client components, and static rendering with minimal bundle footprint.
2. **Strict RTL Compliance**: Setting `<html dir="rtl" lang="ar">` enables modern browser layout engines to flip horizontal flow automatically when CSS logical properties are used.
3. **Mixed Direction Text**: Arabic sentences containing English model names (e.g., "GPT-4o") or hashtags must preserve reading order without punctuation corruption. Applying `unicode-bidi: isolate` and `dir="auto"` on dynamic text containers prevents bidirectional text bleeding.
4. **Selective Icon Mirroring**: Directional icons (back/forward chevrons, arrows) mirror using `.rtl\:rotate-180`, while logos, status dots, numbers, and brand icons remain unmirrored per Design System rule §9.

### Alternatives Considered

- **`i18next` / `react-i18next`**: Heavy client runtime footprint, more complex SSR hydration setup in Next.js 15 App Router.
- **Physical CSS classes (`left-4`, `right-4`, `mr-2`)**: Requires duplicating classes with `rtl:ml-2 rtl:mr-0`, error-prone and tedious compared to `me-2` / `ms-2` (margin-inline-end / start).

---

## 3. Web Typography & Font Optimization

### Decision

Use `next/font/google` in `src/lib/fonts.ts` to load:

1. **Inter**: Weights 400, 500, 600 (`--font-inter`) for the interface.
2. **Instrument Serif**: Weight 400, italic (`--font-serif`) for the single accent word per headline.
3. **Noto Sans Arabic**: Weights 400, 600 (`--font-arabic`) for all Arabic typography.

### Rationale

1. **Zero Layout Shift (CLS = 0)**: `next/font` automatically self-hosts Google Fonts at build time, generates CSS size-adjust fallback declarations, and eliminates external network requests to Google servers at runtime (enhancing privacy and offline development).
2. **Arabic Serif Exception Rule**: Instrument Serif has no Arabic italic glyphs. Per Design System §3, in Arabic headlines the accent word is rendered with weight 600 without italics (`font-semibold not-italic`).

### Alternatives Considered

- **Standard `<link href="fonts.googleapis.com">`**: Violates privacy guidelines (exposing user IPs to third-party CDNs), blocks initial page paint, and risks layout shifts.
- **Self-hosting manual `.woff2` files**: Requires manual font subsetting, maintenance, and custom CSS `@font-face` configuration without the automated fallbacks provided by `next/font`.

---

## 4. Agent Presence & Activity Timeline Architecture

### Decision

Model agent events as an immutable, append-only stream of discrete state entries. The `ActivityTimeline` component consumes a typed event list:

```typescript
export interface AgentStep {
  id: string;
  agent: 'writer' | 'critic' | 'art' | 'profiler' | 'strategist';
  action: string; // e.g. "drafting the LinkedIn version"
  state: 'done' | 'working' | 'waiting' | 'paused' | 'failed';
  durationSeconds?: number;
  pauseCountdownSeconds?: number;
  failureReason?: string;
}
```

Represent the active agent in the header using `AgentChip`, formatted as `[Agent Name] · [action in lower case]`.

### Rationale

1. **Deterministic Representation**: Supports the 5 states specified in Design System §6 with distinct visual treatments:
   - **Done**: Solid agent color dot, default border, duration text (e.g., `4.2s`).
   - **Working**: Solid pulsing dot (1.2s ease-in-out), `--accent` border, `Working` label.
   - **Waiting**: Hollow 2px ring in agent color, default border, `Next` label.
   - **Paused**: Solid dot, default border, countdown label (e.g., `Paused, retrying in 20s`).
   - **Failed**: Solid `--danger` dot, `--danger` border, plain language failure explanation.
2. **Accessible Motion Compliance**: The pulse animation is wrapped with `@media (prefers-reduced-motion: reduce)` to disable pulse scaling and opacity transitions when users have requested reduced motion.
3. **Decoupled Contract**: A mock event sequence drives the timeline now, allowing drop-in connection to Server-Sent Events (SSE) in subsequent epics without refactoring the UI presentation layer.

---

## 5. Component Gallery Architecture (`/design`)

### Decision

Create a dedicated route at `src/app/[locale]/design/page.tsx` displaying all design system tokens, typography scales, buttons, chips, tags, inputs, composer shell, and agent timelines. The page includes interactive controls to toggle between themes (`light`/`dark`) and languages (`en`/`fr`/`ar`) on demand.

### Rationale

1. **Instant Visual Verification**: Allows developers and designers to verify contrast, spacing, and RTL mirroring across all components on a single canvas without navigating multiple sub-flows.
2. **Automated E2E Target**: Serves as the primary fixture for Playwright visual regression snapshots and automated axe-core accessibility compliance checks.
3. **No Heavy External Dependencies**: Avoids installing Storybook (which introduces large Webpack/Babel dependencies and slows down build pipelines) while fulfilling all gallery showcase requirements directly within the Next.js App Router.

---

## 6. Testing Strategy

### Decision

1. **Unit & Component Testing**: Use Vitest + `@testing-library/react` + `@testing-library/jest-dom` to test theme resolution, locale switching, component prop variations, and keyboard accessibility (Enter/Space on chips and buttons).
2. **Automated A11y & E2E Testing**: Use Playwright with `@axe-core/playwright` to scan `/` and `/design` in both themes and both text directions (`dir="ltr"` and `dir="rtl"`), validating WCAG AA compliance with 0 violations.
