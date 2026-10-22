# Developer Quickstart: 002-visual-foundation

**Branch**: `002-visual-foundation` | **Feature**: Visual Foundation & App Shell

This guide explains how to start the development environment, navigate the design system components, switch themes and languages, and execute accessibility and visual tests.

---

## 1. Running the Local Environment

Start the local Next.js dev server:

```bash
pnpm dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

---

## 2. Navigating the Views

### 2.1 Main Application Shell (`/`)

- Navigating to `/` displays the 3-pane application shell:
  - **Left Sidebar**: 240px wide, contains navigation items (`New run`, `Drafts`, `Settings`), recent runs list, and user profile. Below `760px` viewport width, the sidebar turns into a collapsible drawer with an accessible trigger button.
  - **Main Workspace**: Centered max-876px column with header showing active page title and top-right **Active Agent Chip** (`Critic · checking voice and platform rules`).
  - **Bottom Composer**: Pinned composer container with textarea, agent chip, platform selection chips (`LinkedIn`, `Twitter/X`, `Threads`), and circular send button.

### 2.2 Component Gallery (`/design`)

- Navigate to [http://localhost:3000/design](http://localhost:3000/design) to inspect the complete Saouti Design System showcase:
  - **Theme & Language Toolbar**: Toggle between Dark / Light / System and English / Français / العربية on the fly.
  - **Color Tokens Palette**: Visual swatch grid of all semantic tokens (`--bg`, `--surface`, `--accent`, `--border`, agent tokens).
  - **Typography Scale**: Display (with one Instrument Serif italic word), Heading, Body, Caption, and Arabic typography.
  - **Buttons & Chips**: Primary, secondary, icon button variants, selectable platform chips, and status chips.
  - **Form Controls**: Input fields, composer preview, and toast container.
  - **Post Cards**: Formatted post cards with status tags (`Ready`, `In review`) and action buttons.
  - **Agent Presence**: Active-agent chips and the complete `ActivityTimeline` demonstrating all 5 states (`done`, `working` with pulse animation, `waiting`, `paused`, `failed`).

---

## 3. Verifying Zero-Flash Themes

1. Open DevTools Application tab -> Cookies.
2. Note the `saouti-theme` cookie set to `dark` or `light`.
3. Reload the page with network throttling ("Slow 3G") enabled.
4. Verify that the initial HTML document payload received from the server contains `<html data-theme="dark">` (or light) and renders immediately in the correct palette without a momentary white/black flash.

---

## 4. Testing RTL (Right-to-Left) Arabic

1. In the header or `/design` toolbar, click the language switcher and select **العربية**.
2. Verify:
   - `<html dir="rtl" lang="ar">` is applied.
   - The navigation sidebar smoothly moves to the right-hand side.
   - The timeline and post card texts align to the physical right (`text-align: start`).
   - Mixed Arabic and Latin text (e.g., "نص تجريبي مع Saouti و LinkedIn") maintains correct punctuation and word ordering without bi-directional bleeding.
   - Chevrons and back/forward arrows mirror horizontally, while logos and agent status dots do not flip.

---

## 5. Running Tests

```bash
# Run unit and component tests (Vitest)
pnpm test

# Run type check
pnpm type-check

# Run linter
pnpm lint

# Run accessibility & Playwright visual tests
pnpm test:e2e
```
