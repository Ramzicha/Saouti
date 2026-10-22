# Feature Specification: Visual Foundation and Application Shell

**Feature Branch**: `002-visual-foundation`  
**Created**: 2026-10-23  
**Status**: Draft  
**Input**: User description: "Build the visual foundation and layout of Saouti from the Saouti Design System. Users get light and dark themes that follow their system setting and can be switched manually, without a flash on load. The app has a left sidebar (navigation and recent runs), a main workspace and a bottom composer, with the sidebar becoming a drawer on narrow screens. Provide a reusable set of components shown on a gallery page in both themes. The interface is available in English, French and Arabic, with full right-to-left mirroring for Arabic and correct mixed-direction text. Include an agent presence component: an agent chip with a status line and a timeline of agents with states (done, working, waiting, paused, failed) and durations, fed by a simple list of events. Everything must meet WCAG AA contrast and be fully keyboard accessible. Out of scope: real data, authentication, AI calls."

---

## Assumptions & Clarifications

Based on `docs/design-system/design.md` and `docs/Saouti — Epics, User Stories and Spec Kit Prompts.md`, the clarification focus areas are documented as follows:

1. **Pages in scope for the shell**:
   - The primary application route (`/`) hosting the shell layout: sidebar, main workspace canvas (empty state / placeholder), and bottom pinned composer.
   - The component showcase gallery route (`/design`) presenting all core components, variants, agent presence elements, and interactive controls in light, dark, LTR, and RTL modes.
2. **Default language and detection**:
   - Language defaults to the user's browser setting (`Accept-Language`), matching one of `en`, `fr`, or `ar`. If no match, defaults to `en`.
   - The user can explicitly switch language via a persistent control in the sidebar. The choice is stored in a cookie (`NEXT_LOCALE`) to enable zero-flash server-rendered localization.
3. **Allowed motion & accessibility**:
   - The only continuous animation permitted is the working-agent dot pulse (1.2 s ease-in-out, scale 1.0 to 1.35, opacity 1.0 to 0.45).
   - Under `prefers-reduced-motion: reduce`, all pulsing and transitions cease immediately.
4. **Agent semantic tokens**:
   - Agent colors are mapped directly to their tokens:
     - Writer: `--agent-writer`
     - Critic: `--agent-critic`
     - Art Director: `--agent-art`
     - Profiler: `--agent-profiler`
     - Strategist: `--agent-strategist`
   - Agent colors are never shown alone; they must always be accompanied by the agent's name.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Light and Dark Themes (Priority: P1)

As a user, I want the application to automatically match my operating system theme (light or dark) and allow me to manually switch it at any time, so that the interface is comfortable to read in any environment without ever flashing the wrong theme upon page refresh.

**Why this priority**: Theme support is a core visual requirement and must be established before building or styling downstream components. Preventing theme flash is essential for professional visual polish.

**Independent Test**: Load the application with system theme set to dark; verify dark mode renders on the very first paint. Toggle manual switch to light mode; refresh page; verify light mode renders immediately with zero transition flash.

**Acceptance Scenarios**:

1. **Given** a user with OS preference set to dark mode, **When** they navigate to any page, **Then** the page renders with dark theme variables (`--bg: #0B0B0C`, `--surface: #131314`) on the initial paint with no visible white flash.
2. **Given** a user viewing the app, **When** they activate the theme toggle control, **Then** the entire interface switches between light and dark modes instantaneously, and the preference is saved in a cookie.
3. **Given** a user who has manually selected a theme, **When** they reload the page or navigate between routes, **Then** the chosen theme persists and renders server-side without flashing.
4. **Given** both light and dark themes, **When** inspected with an automated accessibility tool, **Then** all foreground-to-background text and control contrast ratios meet or exceed WCAG AA standards (≥ 4.5:1 for body text, ≥ 3:1 for large display text).

**Test Plan** _(Principle 3 — required)_:

- Unit: Theme cookie parser and initial theme resolver helper functions.
- Integration/E2E: Playwright automated test loading page under dark and light emulation, asserting `data-theme` attribute and absence of style mutation flash on reload; automated contrast audit.
- Security path covered: N/A.

---

### User Story 2 — Responsive Application Shell (Priority: P1)

As a user, I want a consistent, responsive 3-section layout featuring a left navigation sidebar with recent runs, a central workspace, and a bottom composer container, so that I always know where I am and have immediate access to generation tools across both desktop and mobile viewports.

**Why this priority**: The application shell is the structural frame housing all future workflows (auth, profiles, generation, library).

**Independent Test**: Open the application at desktop viewport (≥ 760 px) and verify fixed 240 px sidebar, 56 px header with active agent chip, and bottom composer. Resize viewport below 760 px; verify sidebar collapses into a drawer accessible via a header menu button.

**Acceptance Scenarios**:

1. **Given** a desktop screen width (≥ 760 px), **When** viewing the app, **Then** a fixed 240 px sidebar is visible on the inline-start, the main workspace is centered (max 876 px), and the composer is pinned to the bottom (max 820 px).
2. **Given** a narrow screen width (< 760 px), **When** viewing the app, **Then** the inline sidebar collapses off-canvas and a header menu button appears.
3. **Given** the collapsed drawer on mobile, **When** the user taps the menu button, **Then** the sidebar slides open as an accessible drawer with a backdrop overlay, trapping focus inside until closed.
4. **Given** any interactive element in the shell (nav items, buttons, composer input), **When** navigating with the keyboard, **Then** every item is reachable via `Tab` with a visible 2 px `--accent` focus ring and 2 px offset.

**Test Plan** _(Principle 3 — required)_:

- Unit: Breakpoint utility and responsive state hooks.
- Integration/E2E: Playwright tests for desktop layout dimensions, mobile drawer opening/closing, focus trap behavior, and keyboard navigation traversal.
- Security path covered: N/A.

---

### User Story 3 — Core Component Library & Design Gallery (Priority: P1)

As a developer building future features, I want a standardized, reusable set of design components demonstrated on a dedicated `/design` gallery route, so that all screens maintain uniform styling, spacing, typography, and interactive behaviors.

**Why this priority**: Standardized components prevent stylistic fragmentation and ensure all accessibility primitives are solved once.

**Independent Test**: Navigate to `/design`; verify interactive display of primary buttons, secondary buttons, round send icon buttons, chips, status tags, cards, inputs, and toast notifications in both light and dark themes.

**Acceptance Scenarios**:

1. **Given** the `/design` route, **When** visited in the browser, **Then** a component catalog displays all design system primitives grouped by category (Buttons, Chips, Tags, Cards, Inputs, Toast, Typography).
2. **Given** primary and secondary buttons, **When** rendered, **Then** primary buttons use neutral fills (`--button` / `--on-button`) without accent fill, secondary buttons use `--surface-raised`, and icon buttons are 44 px circles with `aria-label`.
3. **Given** chips and tags, **When** rendered, **Then** interactive chips provide a minimum 36 px touch target, selected chips display `--accent-soft` background with `--accent` border/text, and status tags display Ready (`--success`) and In Review (`--agent-critic`).
4. **Given** a toast trigger, **When** activated, **Then** a toast notification appears at bottom-center with `role="status"` and auto-dismisses after 4 seconds.

**Test Plan** _(Principle 3 — required)_:

- Unit: Component rendering tests validating DOM elements, ARIA attributes, variant classes, and event callbacks.
- Integration/E2E: Playwright visual snapshots and axe-core accessibility checks on `/design`.
- Security path covered: N/A.

---

### User Story 4 — Multilingual Support & Right-to-Left (RTL) Layout (Priority: P1)

As an Arabic, French, or English speaker, I want the complete interface available in my chosen language, with full right-to-left layout mirroring and correct bidirectional text handling for Arabic, so that I can comfortably interact in my native language.

**Why this priority**: Principle 6 mandates Arabic RTL, French, and English from day one. Retrofitting RTL after building LTR UI causes significant architectural friction.

**Independent Test**: Switch language to Arabic (`ar`) via the language selector. Verify that the sidebar moves to the right, text aligns to the right, navigation items mirror, and Latin model/agent names inside Arabic sentences render in correct bidirectional order.

**Acceptance Scenarios**:

1. **Given** the application in English or French, **When** the user switches language to Arabic (`ar`), **Then** the `html` element updates to `dir="rtl"` and `lang="ar"`, and all layout regions mirror horizontally using logical CSS properties (`inset-inline-start`, `border-inline-end`, etc.).
2. **Given** the Arabic interface, **When** text includes Latin acronyms, brand names, or model codes (e.g., "Gemini 1.5", "LinkedIn"), **Then** `dir="auto"` or bidirectional isolation prevents text punctuation distortion.
3. **Given** the typography stack, **When** viewing English or French, **Then** Inter and Instrument Serif Italic load; **When** viewing Arabic, **Then** Noto Sans Arabic loads and accent words are emphasized with font weight 600 instead of italic.
4. **Given** a translation key missing in French or Arabic, **When** rendered, **Then** the text falls back gracefully to English without breaking layout, emitting a development console warning.

**Test Plan** _(Principle 3 — required)_:

- Unit: Translation loading, fallback resolution, and locale switching helpers.
- Integration/E2E: Playwright tests verifying `dir="rtl"` attribute, mirror layout verification, and font family application in Arabic mode.
- Security path covered: N/A.

---

### User Story 5 — Transparent Agent Presence & Timeline (Priority: P1)

As a user, I want to see which AI agent is actively working, what action it is performing, and inspect a timeline of all completed, in-progress, waiting, paused, or failed agent steps with durations, so that the AI writing process is completely visible and trustworthy.

**Why this priority**: Principle 5 (Transparency) requires that every agent action is visible to the user. This component is the primary interface through which users observe the multi-agent pipeline.

**Independent Test**: Feed the agent presence component a list of mock agent events; verify that the header status chip displays the active agent with color dot and status line, while the timeline displays each agent step with correct state dot (solid, pulsing, hollow, danger) and duration.

**Acceptance Scenarios**:

1. **Given** an active agent event, **When** the agent presence chip renders, **Then** it shows the agent's designated color dot, capitalised name, middle dot, and status line (e.g., "Critic · checking voice and platform rules") with `role="status"`.
2. **Given** an agent in the "Working" state, **When** animation is enabled, **Then** its color dot pulses over 1.2 seconds (scale 1.0 to 1.35, opacity 1.0 to 0.45), and the row displays an `--accent` border.
3. **Given** a user with OS setting `prefers-reduced-motion: reduce`, **When** an agent is in the "Working" state, **Then** the dot remains solid and static without pulsing.
4. **Given** a chronological list of agent states, **When** the activity timeline renders, **Then** each row displays the agent's color dot, agent name (minimum 104 px width), description in `--muted`, and end status (duration in seconds for Done, "Working", "Next" for Waiting, retry countdown for Paused, and reason for Failed).

**Test Plan** _(Principle 3 — required)_:

- Unit: Agent state mapping, duration formatting, and mock event reducer tests.
- Integration/E2E: Playwright component tests asserting state rendering, reduced-motion compliance, and DOM accessibility attributes (`role="status"`, `aria-live`).
- Security path covered: N/A.

---

## Edge Cases

- **System theme changes while app is open**: If the user has NOT manually set an override, an OS theme change listener (`prefers-color-scheme`) automatically updates the theme dynamically without page refresh.
- **Corrupt or invalid theme/locale cookie**: If the cookie contains an unknown value (e.g., `theme=blue` or `locale=es`), the application falls back safely to system preference and `en` without throwing an error.
- **Mixed direction content in composer**: When a user inputs Arabic text into the composer while using the English interface (or English text in the Arabic interface), the input field applies `dir="auto"` so cursor positioning and text flow adapt to the input language.
- **Agent step failure with long error message**: If an agent step fails, the timeline row displays `--danger` border, solid danger dot, and wraps error text gracefully without overflowing or clipping the timeline row.
- **Very narrow mobile screens (< 360 px)**: Layout controls in the composer wrap into two lines gracefully without overlapping buttons or obscuring the send trigger.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST define CSS custom properties for all design tokens listed in Section 2 of `docs/design-system/design.md` for both light and dark themes.
- **FR-002**: The application MUST support light, dark, and system themes, defaulting to system and permitting manual user override via an accessible toggle.
- **FR-003**: The selected theme MUST be persisted in a cookie and applied on the root `<html>` element prior to first paint to guarantee zero flash of wrong theme.
- **FR-004**: The application shell MUST render a left sidebar (240 px fixed on desktop), top header (56 px fixed), centered main workspace (max 876 px), and bottom pinned composer (max 820 px).
- **FR-005**: On viewport widths below 760 px, the sidebar MUST collapse into an accessible drawer opened by a header menu button and closed via close button, backdrop tap, or Escape key.
- **FR-006**: The composer container MUST provide a transparent multiline text input, active-agent chip, platform selector chips, model chip, and round 44 px send button.
- **FR-007**: A reusable component library MUST be created containing: Button (Primary, Secondary, Icon), Chip (Default, Selected, Status), Tag (Ready, In Review), Card, Input, and Toast.
- **FR-008**: A `/design` gallery page MUST display every core component and variant in both themes and in both LTR and RTL orientations.
- **FR-009**: The interface MUST support English (`en`), French (`fr`), and Arabic (`ar`), selectable via a persistent language switch control.
- **FR-010**: Selecting Arabic MUST set `dir="rtl"` and `lang="ar"` on `<html>` and mirror all layout margins, paddings, and directional icons using CSS logical properties.
- **FR-011**: Inter, Instrument Serif (italic), and Noto Sans Arabic fonts MUST be loaded with optimized fallbacks. Headlines in English/French MUST permit at most one word in Instrument Serif Italic; in Arabic, emphasized words MUST use font weight 600 without italics.
- **FR-012**: The agent presence component MUST display an active status chip showing the agent color dot, capitalised name, and status line.
- **FR-013**: The activity timeline MUST render agent steps across 5 states: `done` (with duration), `working` (pulsing dot, accent border), `waiting` (hollow ring, "Next"), `paused` (retry countdown), and `failed` (danger color and reason).
- **FR-014**: The working agent pulsing animation MUST immediately deactivate when the user's browser enables `prefers-reduced-motion`.
- **FR-015**: All interactive elements MUST provide a visible 2 px `--accent` focus ring with 2 px offset under `:focus-visible`.
- **FR-016**: The agent component MUST be feedable via a standard event list structure so it can connect to mock data in this epic and real event streams in subsequent epics.

### Key Entities

- **ThemeState**: Represents active theme choice (`system`, `light`, `dark`), resolved theme (`light` or `dark`), and persistence mechanism.
- **LocaleState**: Represents active language (`en`, `fr`, `ar`), text direction (`ltr` or `rtl`), and localized string bundle.
- **AgentStep**: Represents an individual agent execution event in the timeline. Key attributes: `agentId` (writer, critic, art, profiler, strategist), `name` (string), `state` (`done`, `working`, `waiting`, `paused`, `failed`), `actionText` (string), `durationSec` (optional number), `errorMessage` (optional string).

---

## Accessibility & Localisation _(mandatory — Principle 6)_

- **A11Y-001**: All buttons, links, inputs, and chips MUST be keyboard-focusable with visible focus indicator (`outline: 2px solid var(--accent); outline-offset: 2px`).
- **A11Y-002**: Color contrast for text and interactive controls MUST meet WCAG 2.1 AA standards (minimum 4.5:1 for standard text, 3:1 for large text) across both light and dark themes.
- **A11Y-003**: The working agent dot pulse animation MUST respect `prefers-reduced-motion: reduce` and stop animating.
- **A11Y-004**: Automated accessibility checks using axe-core MUST pass with 0 critical or serious violations on `/` and `/design`.
- **I18N-001**: All user interface text MUST be externalized in message catalogs (`messages/en.json`, `messages/fr.json`, `messages/ar.json`).
- **I18N-002**: Full right-to-left layout mirroring MUST be implemented and tested for Arabic, including bidirectional isolation (`dir="auto"`) for mixed language strings.
- **I18N-003**: Agent status lines and timeline labels MUST be localized into the selected language (English, French, Arabic).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Page loads and refreshes show zero flash of wrong theme (0 milliseconds of mismatched background/text color), verified by visual testing.
- **SC-002**: Viewport resizing across the 760 px breakpoint transitions cleanly between desktop sidebar and mobile drawer without horizontal scrollbars.
- **SC-003**: The `/design` gallery route displays 100% of defined components (buttons, chips, tags, cards, inputs, toasts, agent presence) in both light and dark themes.
- **SC-004**: 100% of user-facing UI strings switch dynamically between English, French, and Arabic upon selecting a language.
- **SC-005**: In Arabic mode, the shell layout, sidebar position, and timeline content mirror to RTL with zero layout clipping or inverted directional icons.
- **SC-006**: 100% of interactive elements are operable via keyboard alone (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`), with focus trapped correctly within the mobile drawer.
- **SC-007**: Automated accessibility audits (axe-core / Playwright) report 0 WCAG AA contrast or ARIA violations across both themes and all 3 languages.
- **SC-008**: The agent presence component renders simulated event lists through all 5 lifecycle states (`done`, `working`, `waiting`, `paused`, `failed`) with proper color dots and status typography.
