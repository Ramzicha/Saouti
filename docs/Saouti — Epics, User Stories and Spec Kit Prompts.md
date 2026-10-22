# Saouti — Epics, User Stories and Spec Kit Prompts

Oct 22, 2026 · @Ramzi

Ten epics take Saouti from an empty repository to a launched MVP on Hostinger. Each epic is one Spec Kit feature: its stories become the spec's prioritised user stories, and its prompts are ready to paste into your AI coding agent.

## 1. How to Run an Epic with Spec Kit

**One-time setup**

```
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init saouti --ai <your-agent>
```

The agent flag has changed name between Spec Kit versions (newer ones use --integration). Run `specify init --help` and check the installed version first. After init, your agent should expose /speckit.constitution, specify, clarify, plan, tasks, analyze, checklist and implement.

**The loop for every epic**

1. `/speckit.specify` with the epic's prompt. It describes what and why only, never the tech stack. Spec Kit creates the feature branch and spec.md.
2. `/speckit.clarify`. Answer its questions and push the focus areas listed in the epic.
3. `/speckit.checklist` (optional): a quality check of the requirements.
4. `/speckit.plan` with the epic's plan prompt. Technology choices live here.
5. `/speckit.tasks`, then `/speckit.analyze`, using the standard prompts below.
6. `/speckit.implement`. Review, run the tests, merge, and only then start the next epic.

**Rules**

- One epic = one feature spec = one branch. Do not start an epic before the previous one meets the Definition of Done.
- Stories are independently testable and ordered by priority. P1 first; P2 can slip.
- Change principles only through `/speckit.constitution`.
- Keep implementation detail out of specs. It belongs in plans.

**Standard prompts (identical for every epic)**

```
/speckit.tasks Break the plan into small, independently testable tasks grouped by user story in priority order. Put test tasks before the implementation they cover. Mark tasks that can run in parallel.

/speckit.analyze Check that every acceptance criterion maps to a task and a test, that the plan respects the constitution, and list any gap or contradiction before implementation starts.

/speckit.implement Implement the tasks in order, one user story at a time. After each story run its tests, then stop and summarise what changed and what to review.
```

**Definition of Done (every epic)**

- Acceptance criteria pass as automated tests.
- Lint, type-check, tests and build pass in CI.
- Any UI works in light and dark modes and in Arabic right-to-left.
- No secrets, API keys or personal content in the repository or the logs.
- The feature quickstart is current and each story traces to its PRD requirement IDs.

**Story format.** Each story reads As a / I want / so that, followed by acceptance criteria. IDs are E\<epic>-S\<story>. PRD references use the requirement IDs (AUTH, PROF, GEN, AGT, LIB, IMG, SET).

## 2. Epic Map

| Epic                              | Goal                                                       | Depends on | PRD references              |
| --------------------------------- | ---------------------------------------------------------- | ---------- | --------------------------- |
| E0 Project foundation             | Repository, Spec Kit, constitution, app skeleton, CI       | None       | Section 8                   |
| E1 Design system and app shell    | Themes, RTL, localisation, layout, agent UI component      | E0         | Section 11, AGT-1 to AGT-3  |
| E2 Accounts and authentication    | Sign up, verify, log in, reset, delete                     | E0, E1     | AUTH-1 to AUTH-4            |
| E3 API keys and provider layer    | Bring-your-own-key, Gemini adapter, rate-limit handling    | E2         | SET-1 to SET-5, section 7.5 |
| E4 Voice Profile onboarding       | Profile, samples, platforms, AI interview                  | E3         | PROF-1 to PROF-8            |
| E5 Agent engine and live activity | Pipeline, prompts, job queue, event stream                 | E3, E4     | Section 7, AGT-1 to AGT-8   |
| E6 Generation workspace           | Composer, post cards, edit, regenerate                     | E5         | GEN-1 to GEN-7              |
| E7 Post library                   | Save, copy, filter, search, versions                       | E6         | LIB-1 to LIB-6              |
| E8 Images                         | Image prompts, optional image generation                   | E7         | IMG-1 to IMG-3              |
| E9 Deployment and launch          | Hostinger VPS, HTTPS, backups, monitoring, security review | All        | Sections 8, 10, 12          |

## Epic 0 — Project Foundation

**Goal:** a working, tested, documented skeleton that every later epic builds on. **Depends on:** nothing. **PRD:** section 8.

**E0-S1 · Repository initialised with Spec Kit (P1)** As the product owner, I want the repository initialised with Spec Kit and a committed constitution, so that every epic follows the same rules.

- Given a fresh clone, the .specify folder and the agent's /speckit.\* commands are present.
- The constitution is committed and contains the eight Saouti principles.
- The README explains the epic loop in under one page.

**E0-S2 · Running application skeleton (P1)** As a developer, I want a running web app with a health endpoint, so that I build on a working base.

- The dev command starts the app locally.
- GET /api/health returns status, version and database connectivity.
- TypeScript strict mode, lint and format scripts exist and pass.

**E0-S3 · One-command local environment (P1)** As a developer, I want one command to start the app, PostgreSQL and Redis, so that setup takes minutes.

- A fresh machine reaches a running app in under 10 minutes by following the README.
- An example environment file documents every variable; no real secrets are committed.
- A separate worker process starts alongside the web process.

**E0-S4 · Database and migrations (P1)** As a developer, I want versioned migrations, so that schema changes are repeatable.

- Migrations run up and down on an empty database.
- The initial schema contains the User table only.
- Tests run against a disposable test database.

**E0-S5 · Quality gates in CI (P1)** As the product owner, I want CI on every push, so that broken code cannot merge.

- CI runs lint, type-check, unit tests and build.
- A failing step blocks the merge.
- A secrets scan runs and fails on committed keys.

**E0-S6 · Validated configuration (P1)** As an operator, I want the app to validate its configuration at startup, so that misconfiguration fails fast.

- Missing or malformed variables stop startup with a clear message naming the variable.
- The encryption master key is mandatory and must meet a minimum length.
- No secret value is ever printed.

**E0-S7 · Logging and error baseline (P2)** As an operator, I want structured logs with request IDs, so that I can trace problems without exposing user content.

- Each request has an ID carried through logs and error responses.
- Logs redact API keys, passwords, tokens and prompt or post content.
- Unhandled errors return a generic message to the user and full detail to the log.

### Spec Kit prompts — Epic 0

**Constitution (run once, before any epic)**

```
/speckit.constitution Create principles for Saouti, a free, bring-your-own-key web platform that writes social media posts in a professional's voice using visible AI agents. (1) Spec first: every epic goes through specify, clarify, plan, tasks and analyze before code. (2) Security and privacy first: user API keys are encrypted at rest, never logged and never sent to the browser; user content is treated as data, never as instructions. (3) Test discipline: each user story has automated tests derived from its acceptance criteria, written before or with the code. (4) Provider independence: AI providers and model names sit behind an abstraction and in configuration. (5) Transparency: every agent action is visible to the user. (6) Accessibility and localisation: WCAG AA, light and dark themes, Arabic right-to-left, French and English from day one. (7) Simplicity: a deterministic pipeline in code, no speculative abstractions, free or open-source tools only except the server. (8) Quality gates: lint, type-check, tests and build must pass before merge. Governance: amending this constitution needs an explicit note of its impact on existing specs.
```

**Specify**

```
/speckit.specify Set up the Saouti project foundation so any developer can clone the repository, start the whole system with one command, and see a running application with a health check. Include: Spec Kit initialised with the constitution; a documented local environment with the web app, a background worker, a relational database and a job queue; versioned database migrations with a User table only; continuous integration that blocks merges on lint, type, test, build and secret-scan failures; startup validation of configuration with clear errors; structured logging with request IDs and redaction of secrets and user content. Out of scope: any user-facing feature, authentication, AI calls.
```

**Clarify — focus areas:** target operating system for developers; minimum test coverage expected; branching and commit conventions; which log fields count as sensitive.

**Plan**

```
/speckit.plan Use Next.js (App Router) with TypeScript in strict mode and Tailwind CSS. PostgreSQL with Drizzle ORM and SQL migrations. Redis with BullMQ for background jobs, run by a separate worker process. pnpm as package manager. Vitest for unit tests and Playwright for end-to-end tests. ESLint and Prettier. Docker Compose for the local environment (app, worker, PostgreSQL, Redis). GitHub Actions for CI. Zod for environment validation. Pino for structured logging with a redaction list. Keep a single repository with web and worker sharing one codebase. Document each choice and rejected alternative in research.md.
```

**Tasks hint:** order the tasks so that the constitution, the repository and the CI gate come first, because every later task depends on them.

## Epic 1 — Design System and App Shell

**Goal:** the visual and structural foundation, built from the Saouti Design System canvas, so every later screen is consistent. **Depends on:** E0. **PRD:** section 11, AGT-1 to AGT-3.

**E1-S1 · Light and dark themes (P1)** As a user, I want light and dark modes, so that the app is comfortable in any setting.

- The app follows the system setting by default and the user can switch manually; the choice persists.
- The page never flashes the wrong theme on load.
- All text and controls meet WCAG AA contrast in both themes.
- Colours come from design tokens matching the Design System tokens board.

**E1-S2 · Application shell (P1)** As a user, I want a consistent layout with a sidebar, a main workspace and a bottom composer, so that I always know where I am.

- Desktop shows the sidebar, workspace and composer as in the design.
- Below 760 px wide the sidebar becomes a drawer opened by a button.
- Every interactive element is reachable by keyboard with a visible focus ring.

**E1-S3 · Core component library (P1)** As a developer, I want reusable components, so that screens are built quickly and look the same.

- Buttons (primary, secondary), chips, tags, cards, inputs, toasts and list rows exist.
- A gallery page shows every component in both themes and in right-to-left.
- Components are accessible: real buttons and links, labels on inputs, names on icon-only controls.

**E1-S4 · Localisation and right-to-left (P1)** As a user, I want the interface in Arabic, French or English, so that I can work in my language.

- A language switcher changes all interface text; the choice persists.
- Arabic mirrors the layout and handles mixed Arabic and Latin text correctly.
- Inter, Instrument Serif Italic and Noto Sans Arabic load with sensible fallbacks.
- Missing translations fall back to English and are reported in development.

**E1-S5 · Agent presence component (P1)** As a user, I want to see which agent is working and what it is doing, so that I trust the process.

- An agent chip shows the agent's name, colour dot and a one-line status.
- A timeline lists agents with states: done, working, waiting, paused or failed, plus durations.
- The working dot pulses and stops pulsing when the user prefers reduced motion.
- The component is driven by a plain event list so the real event stream can replace mock data later.

### Spec Kit prompts — Epic 1

**Specify**

```
/speckit.specify Build the visual foundation and layout of Saouti from the Saouti Design System. Users get light and dark themes that follow their system setting and can be switched manually, without a flash on load. The app has a left sidebar (navigation and recent runs), a main workspace and a bottom composer, with the sidebar becoming a drawer on narrow screens. Provide a reusable set of components shown on a gallery page in both themes. The interface is available in English, French and Arabic, with full right-to-left mirroring for Arabic and correct mixed-direction text. Include an agent presence component: an agent chip with a status line and a timeline of agents with states (done, working, waiting, paused, failed) and durations, fed by a simple list of events. Everything must meet WCAG AA contrast and be fully keyboard accessible. Out of scope: real data, authentication, AI calls.
```

**Clarify — focus areas:** which pages exist in the shell at this stage; default language rule; which motion is allowed; how the agent colours are named in the tokens.

**Plan**

```
/speckit.plan Use CSS variables for design tokens, defined once for light and dark and mapped into Tailwind. Use next-intl for localisation with message files for en, fr and ar and logical CSS properties for right-to-left. Load Inter, Instrument Serif and Noto Sans Arabic through next/font. Persist the theme in a cookie so the server can render the right theme without a flash. Build components as accessible React components with Storybook or a /design gallery route. Test components with Vitest and Testing Library, and run automated accessibility checks and visual checks in Playwright for both themes and both directions.
```

**Tasks hint:** tokens and theme switching first, then the shell, then components, then localisation, then the agent component.

## Epic 2 — Accounts and Authentication

**Goal:** secure sign up, login and account deletion with strict per-user data isolation. **Depends on:** E0, E1. **PRD:** AUTH-1 to AUTH-4.

**E2-S1 · Sign up (P1)** As a new professional, I want to create an account with my email and a password, so that my work is saved.

- A valid email and a password of at least 10 characters create an unverified account.
- A duplicate email shows a clear message without revealing whether the email exists on other forms.
- Passwords are stored only as strong salted hashes.
- The form is available in all three languages and both themes.

**E2-S2 · Email verification (P1)** As a user, I want to verify my email, so that the account is mine.

- A verification email with a single-use link is sent on sign up; the link expires after 24 hours.
- An unverified user cannot reach the app and can request a new link.
- Verifying signs the user in and sends them to onboarding.

**E2-S3 · Log in and log out (P1)** As a user, I want to log in and out, so that I control access to my account.

- Correct credentials create a secure session cookie (HTTP-only, secure, same-site).
- Wrong credentials show one generic message, whichever field was wrong.
- Repeated failures are rate limited per account and per address.
- Logging out ends the session on the server.

**E2-S4 · Password reset (P1)** As a user, I want to reset a forgotten password, so that I can regain access.

- Requesting a reset always shows the same confirmation message.
- The reset link is single-use and expires after one hour.
- A successful reset ends all other sessions.

**E2-S5 · Delete account (P1)** As a user, I want to delete my account and all my data, so that I stay in control of my information.

- Deletion requires the current password and a typed confirmation.
- All profile data, posts, runs and stored API keys are permanently removed.
- The user receives a confirmation email and the session ends.

**E2-S6 · Route protection and data isolation (P1)** As a user, I want my data to be visible only to me, so that my content stays private.

- Unauthenticated visitors are redirected to the login page for every private route and API.
- Every data query is scoped by the signed-in user's ID.
- Automated tests prove that user A cannot read or change user B's records.

**E2-S7 · Google sign-in (P2)** As a user, I want to sign in with Google, so that I skip password management.

- A Google account can create or sign in to a Saouti account.
- An existing email account can be linked after confirmation.

### Spec Kit prompts — Epic 2

**Specify**

```
/speckit.specify Add accounts and authentication to Saouti. A professional can sign up with email and password, verify the email through a single-use link that expires after 24 hours, log in and out, reset a forgotten password through a single-use link that expires after one hour, and permanently delete the account with all associated data after confirming the password. Login failures show one generic message and are rate limited. Password resets never reveal whether an email exists. All private pages and data are accessible only to the signed-in owner, and tests must prove that one user can never access another user's data. All screens work in English, French and Arabic and in both themes. Optional (lower priority): Google sign-in. Out of scope: teams, roles, payments.
```

**Clarify — focus areas:** password rules and breached-password checks; session length and idle timeout; email sender address and templates in three languages; what exactly is deleted and whether any backup retention applies; behaviour of unverified accounts after seven days.

**Plan**

```
/speckit.plan Use Auth.js or a small in-house session layer on the existing Next.js app with PostgreSQL-backed sessions and HTTP-only secure cookies. Hash passwords with Argon2id. Send email through the Hostinger SMTP mailbox using Nodemailer, with templates for en, fr and ar. Store only hashed single-use tokens. Rate limit with Redis. Enforce data isolation with a data-access layer that requires a user ID on every query and add tests that try cross-user access. Add the User, Session and Token tables with migrations. Document the threat model in research.md.
```

**Tasks hint:** write the cross-user isolation tests before the data-access layer.

## Epic 3 — API Keys and Provider Layer

**Goal:** every user brings their own AI key, and all model calls go through one provider-independent layer. **Depends on:** E2. **PRD:** SET-1 to SET-5, section 7.5.

**E3-S1 · Add my Gemini key (P1)** As a user, I want to add my own Gemini API key, so that Saouti can write with my quota.

- The key is validated with a minimal test call before it is saved; an invalid key shows a clear reason.
- The key is encrypted at rest and never returned to the browser; only the last four characters are shown.
- The key never appears in logs, errors or analytics.

**E3-S2 · Guided key creation (P1)** As a user without a key, I want a step-by-step guide to create a free key, so that I can start in minutes.

- The guide walks through creating a key in Google AI Studio and pasting it back.
- It states plainly that free-tier usage may be handled differently from paid usage by the provider, and links to the provider's current terms.
- It is available in English, French and Arabic.

**E3-S3 · Replace or remove my key (P1)** As a user, I want to replace or delete my key, so that I can rotate it or stop using it.

- Replacing validates the new key before the old one is discarded.
- Deleting removes the encrypted value permanently.
- Runs in progress finish or stop with a clear message.

**E3-S4 · Provider abstraction (P1)** As a developer, I want one internal interface for text, structured output and images, so that providers can change without touching features.

- The interface offers generate, generateStructured (schema-validated) and generateImage.
- Gemini is implemented as the first adapter; model names come from configuration.
- Provider errors are normalised into a small set of Saouti error types (invalid key, quota, timeout, unavailable, content blocked).
- A fake provider exists for tests.

**E3-S5 · Rate-limit and quota handling (P1)** As a user, I want temporary limits handled gracefully, so that a busy moment does not lose my work.

- Quota or rate-limit responses trigger retries with exponential backoff and jitter, up to a configured maximum.
- Each wait is reported as an event so the interface can say, for example, Writer paused, retrying in 20 seconds.
- After the maximum, the run stops with a clear message and keeps its partial results.

**E3-S6 · No key, no generation (P1)** As a user, I want a clear prompt to add a key when I have none, so that I am never stuck on an unexplained error.

- Any generation attempt without a valid key redirects to key setup.
- A new account sees key setup as the first onboarding step.
- No shared platform key exists anywhere in the system.

**E3-S7 · Usage and quota indicator (P2)** As a user, I want to see my recent usage and errors, so that I understand my limits.

- Settings shows requests and quota errors for today and the last seven days.

**E3-S8 · Model choice per task (P2)** As a user, I want to choose the model for writing, critique and images, so that I balance quality and quota.

- Each task type has a default and a list of models the provider currently offers.

### Spec Kit prompts — Epic 3

**Specify**

```
/speckit.specify Let each Saouti user bring their own AI provider key; the platform never supplies one. A user can add a Gemini key, which is validated with a minimal test call before saving, stored encrypted, and shown only as its last four characters. They can replace or delete it. A step-by-step guide in English, French and Arabic helps users create a free key and explains that free-tier data handling may differ from paid; it links to the provider's current terms. Without a valid key, any generation attempt sends the user to key setup, and new accounts see key setup first. All AI calls go through one provider-independent layer offering text, schema-validated structured output and image generation, with Gemini as the first provider, model names in configuration and provider errors normalised into a few user-friendly types. Temporary quota or rate-limit responses are retried with backoff and every wait is reported as an event. Lower priority: usage indicator and per-task model choice. Out of scope: payments, other providers.
```

**Clarify — focus areas:** what the validation call costs and which model it uses; maximum retries and total wait time; what happens to a run when the key is removed mid-run; wording of the free-tier data notice.

**Plan**

```
/speckit.plan Encrypt keys with AES-256-GCM using a master key from the environment and a per-record nonce; decrypt only inside the server process at call time. Provider interface in TypeScript with a Gemini adapter using the official Google GenAI SDK, Zod schemas for structured output, and a fake adapter for tests. Retry logic with exponential backoff and jitter in a shared wrapper, emitting events to the run's event emitter. Model names in a configuration file, never hard-coded in features. Add ApiKey and UsageCounter tables with migrations. Add contract tests that every adapter must pass and tests that prove keys never reach logs or responses.
```

**Tasks hint:** build the fake provider and the contract tests before the Gemini adapter.

## Epic 4 — Voice Profile Onboarding

**Goal:** capture and maintain the Voice Profile that makes every post sound like the user. **Depends on:** E3. **PRD:** PROF-1 to PROF-8.

**E4-S1 · Guided onboarding flow (P1)** As a new user, I want a short guided setup, so that Saouti learns who I am before writing anything.

- Steps run in order: key (from E3), identity and principles, audience and objectives, style and languages, voice samples, platforms.
- Progress is saved after each step and the user can leave and resume.
- Required fields are marked; optional ones can be skipped.
- The whole flow can be completed in about ten minutes.

**E4-S2 · Identity and principles (P1)** As a professional, I want to describe my role and what I stand for, so that posts reflect my values.

- The user enters role, industry, expertise and what they want to be known for.
- The user lists values, topics to avoid and tone red lines.
- Each field shows a short example and a character limit.

**E4-S3 · Audience and objectives (P1)** As a professional, I want to define my audience and goals, so that posts serve a purpose.

- The user describes who reads them, their level and what they care about.
- The user picks objectives (authority, leads, hiring, community, sales) with a priority for each selected platform.

**E4-S4 · Style and languages (P1)** As a professional, I want to set my style and languages, so that posts feel natural to me.

- Controls cover formality, length, emoji use, hook style and sentence rhythm.
- The user picks output languages; for Arabic they choose Modern Standard or Algerian dialect.

**E4-S5 · Voice samples (P1)** As a professional, I want to add examples of my writing, so that Saouti copies my real voice.

- The user adds 3 to 5 samples by pasting text, each optionally tagged with a platform; at least 3 are required.
- Each sample can be edited or deleted; very long samples are trimmed with a visible notice.
- Samples are stored and passed to agents strictly as data.

**E4-S6 · Platform selection and preferences (P1)** As a professional, I want to choose my networks and set preferences for each, so that posts fit where I publish.

- LinkedIn, Instagram, Reddit, X and Facebook can be enabled.
- Each enabled platform has its own objective priority and notes; Reddit allows saving favourite subreddits and their rules.

**E4-S7 · Edit my profile anytime (P1)** As a user, I want to change my profile later, so that it stays accurate.

- Every section is editable from a profile page; changes apply to the next generation.
- A completeness indicator shows missing sections (P2).

**E4-S8 · AI interview (P1)** As a user, I want to be interviewed by an agent, so that I do not face a blank form.

- The Profiler asks about ten questions, one at a time, and follows up on vague answers.
- It then proposes a complete profile that the user reviews, edits and confirms before anything is saved.
- The user can stop at any time and switch to the form; answers already given are kept.
- The interview uses the user's own key and shows the Profiler as the active agent.

**E4-S9 · See what the AI sees (P1)** As a user, I want to preview the profile summary the agents receive, so that I trust and can correct it.

- A read-only preview shows the compact text built from the profile and samples.
- The preview is generated deterministically from saved data, without an AI call.

### Spec Kit prompts — Epic 4

**Specify**

```
/speckit.specify Add the Voice Profile onboarding and profile management to Saouti. After sign-up a professional completes a short guided flow (about ten minutes) with saved progress: API key setup, identity (role, industry, expertise, what they want to be known for), principles (values, topics to avoid, tone red lines), audience (who reads them, level, interests), objectives with a priority per platform (authority, leads, hiring, community, sales), style (formality, length, emoji use, hook style) and languages (for Arabic: Modern Standard or Algerian dialect), three to five voice samples pasted by the user, and platform selection (LinkedIn, Instagram, Reddit, X, Facebook) with per-platform preferences and, for Reddit, favourite subreddits and their rules. Everything can be edited later. As an alternative to the form, an AI Profiler interviews the user with about ten one-at-a-time questions, follows up on vague answers, proposes a complete profile and saves it only after the user confirms. A read-only preview shows the exact profile summary that agents receive. Lower priority: completeness indicator. Out of scope: generating posts, multiple profiles per account.
```

**Clarify — focus areas:** which fields are mandatory; limits on sample length; how the interview behaves when the key fails mid-way; whether profile history is kept; default language for new users.

**Plan**

```
/speckit.plan Add Profile, VoiceSample and PlatformPreference tables with migrations; store profile sections as typed JSON validated with Zod. Build the onboarding as a multi-step form with server-side saving after each step and React Hook Form on the client. Implement the profile summary builder as a pure, versioned function with snapshot tests. Implement the Profiler as an agent using the provider layer from Epic 3: interview mode keeps a transcript in the database and asks one question per turn, synthesis mode returns schema-validated profile JSON. Stream the interview turns to the browser. Add end-to-end tests for the full onboarding in all three languages.
```

**Tasks hint:** build the summary builder and its tests first; the interview comes last because it needs the agent presence component and the provider layer.

## Epic 5 — Agent Engine and Live Activity

**Goal:** the multi-agent pipeline, the prompt system and the real-time activity stream. **Depends on:** E3, E4. **PRD:** section 7, AGT-1 to AGT-8.

**E5-S1 · Deterministic pipeline (P1)** As the product owner, I want a fixed Writer, Critic, revision, Art Director pipeline run by code, so that cost and behaviour are predictable.

- One run executes: Writer (all platforms in one structured call), Critic, at most one revision, Art Director.
- The orchestrator is application code; no agent decides which agent runs next.
- A typical run uses three to four model calls regardless of the number of platforms.

**E5-S2 · Layered, versioned prompts (P1)** As a developer, I want prompts assembled from layers and versioned, so that I can improve them safely.

- Each call combines role prompt, profile summary, voice samples, platform rules and task.
- Role prompts live in the repository with a version identifier recorded on every agent step.
- User content is wrapped in tagged blocks and treated as data.
- The Writer, Critic and Art Director prompts follow section 7.8 of the PRD.

**E5-S3 · Schema-validated outputs (P1)** As a developer, I want agent outputs validated against schemas, so that malformed responses never reach users.

- Invalid output is retried once with the validation error, then the step fails with a clear status.
- The Critic's verdict, scores, issues and status text are parsed fields.

**E5-S4 · Background execution that survives reloads (P1)** As a user, I want my run to continue if I refresh or lose connection, so that I never lose work.

- Runs execute in the worker through the job queue.
- Reopening the page shows the run's current state and replays past steps.

**E5-S5 · Live agent activity stream (P1)** As a user, I want to see which agent is working and what it is doing in real time, so that I trust the process.

- The server streams events: run started, agent started, progress, hand-off, completed, error, run completed, run cancelled.
- The agent presence component from Epic 1 renders these events.
- The stream reconnects automatically and resumes from the last event received.

**E5-S6 · Cancel a run (P1)** As a user, I want to cancel a running generation, so that I stay in control and save quota.

- Cancelling stops further model calls and marks the run cancelled; completed steps are kept.

**E5-S7 · Quota and errors as agent states (P1)** As a user, I want problems explained where the agent is shown, so that I know what to do.

- Rate limits show the agent as paused with a retry countdown.
- Invalid key, blocked content and provider outages show plain-language messages with the next step.

**E5-S8 · Run and step records (P1)** As a developer, I want every run and step stored, so that I can debug and measure quality.

- Each AgentStep stores agent, task, model, prompt version, status, duration and error code.
- Prompt text and user content are not written to general logs.

**E5-S9 · Revision reasons and optional Critic (P2)** As a user, I want to see why a draft was revised and optionally skip the Critic, so that I understand and save quota.

- The hand-off from Critic to Writer shows the reason in plain language.
- A setting disables the Critic; the activity display reflects this.

**E5-S10 · Prompt-injection resistance (P1)** As a user, I want pasted content to be unable to hijack the agents, so that my posts stay safe.

- A test set of adversarial samples and briefs (for example, text telling the agent to ignore its rules) never changes agent behaviour.

### Spec Kit prompts — Epic 5

**Specify**

```
/speckit.specify Build the Saouti agent engine. When a user asks for posts, a run executes a fixed pipeline: the Writer produces one platform-native version per selected platform in a single call, the Critic reviews each version for voice match, principles, audience, platform fit, specificity and factual safety and passes it or asks for one revision with at most three concrete issues, the Writer revises once if needed, and the Art Director writes one image prompt and alt text per post. Agents must never invent facts, statistics or quotes and must use clear placeholders instead. Everything the user supplied is treated as data, never as instructions. The user watches the run live: which agent is working, a one-line status, hand-offs with the reason for any revision, durations, and plain-language states for waiting on quota, errors and cancellation. Runs continue if the page is reloaded and can be cancelled. Every run and step is recorded with agent, model, prompt version, status and duration. Lower priority: option to skip the Critic. Out of scope: Strategist, Researcher, image generation, publishing.
```

**Clarify — focus areas:** quality threshold that triggers a revision; behaviour when the revision still fails the Critic; maximum run time; what the user sees if one platform fails and others succeed; how long run history is kept.

**Plan**

```
/speckit.plan Implement the orchestrator as a TypeScript state machine in the worker, using BullMQ jobs and the provider layer from Epic 3. Store prompts as versioned files in the repository and assemble them with a pure builder that wraps user content in tagged blocks. Validate every agent output with Zod schemas and retry once on invalid output. Emit events to Redis streams and expose them to the browser through a Server-Sent Events route that supports resuming from a last event ID; keep Nginx or Caddy buffering off for that route. Add Run and AgentStep tables with migrations. Add a golden-profile evaluation suite with five to ten profiles that runs against the fake provider in CI and against a real key on demand, plus an adversarial prompt-injection test set. Document the event contract in contracts/.
```

**Tasks hint:** define the event contract and the fake-provider pipeline test first, then the prompts, then the streaming route.

## Epic 6 — Generation Workspace

**Goal:** the screen where a user asks for posts and works with the results. **Depends on:** E5. **PRD:** GEN-1 to GEN-7.

**E6-S1 · Ask for posts (P1)** As a professional, I want to give an idea and pick my platforms, so that I get posts for each network.

- The composer accepts a topic, idea or rough text, platform chips and an output language.
- A pasted link is kept as plain reference text and is not fetched in this epic.
- Submitting starts a run and shows the live agent activity beside the results.

**E6-S2 · Platform-native result cards (P1)** As a professional, I want one card per platform, so that each post fits its network.

- Each card shows the platform, a status tag (in review, ready), the post text and its image prompt.
- Length, structure and hashtags follow that platform's rules.
- Cards appear as soon as the Writer finishes and update after the Critic and any revision.

**E6-S3 · Edit in place (P1)** As a professional, I want to edit any post directly, so that the final words are mine.

- Edits are saved automatically within seconds and survive a reload.
- Line breaks and formatting are preserved.

**E6-S4 · Regenerate with an instruction (P1)** As a professional, I want to ask for a change such as shorter or more direct, so that I refine without starting over.

- Regeneration works for one platform or for all, with a free-text instruction.
- The previous version is kept and can be restored.
- Regeneration runs the same visible agent pipeline.

**E6-S5 · Language and direction per post (P1)** As a professional, I want to choose the language of each post, so that I reach each audience in its language.

- Arabic posts render right to left with correct punctuation and mixed text.
- The language and Arabic register come from the profile by default and can be changed per request.

**E6-S6 · Placeholder safety (P1)** As a professional, I want unfinished placeholders highlighted, so that I never publish a post that still says \[YOUR NUMBER\].

- Placeholders written by the Writer are highlighted in the card.
- Copying a post with placeholders shows a warning and lets the user continue or fix them.

**E6-S7 · Several variants (P2)** As a professional, I want three alternative hooks, so that I choose the strongest opening.

- One action produces up to three variants per platform, each selectable.

**E6-S8 · First-run suggestions (P2)** As a new user, I want example prompts, so that I know what to ask.

- The empty workspace offers three clickable suggestions that pre-fill the composer.

### Spec Kit prompts — Epic 6

**Specify**

```
/speckit.specify Build the Saouti generation workspace. A professional types an idea or rough text, picks one or more platforms and an output language, and starts a run; the live agent activity is shown next to the results. A pasted link is stored as plain reference text and is not fetched. Results appear as one card per platform with a status tag, the post text, highlighted placeholders and the image prompt. The user can edit any post in place with automatic saving, regenerate one or all posts with a free-text instruction while keeping previous versions, and copy a post with a warning if placeholders remain. Arabic posts render right to left correctly. Lower priority: up to three hook variants per platform, and clickable first-run suggestions. Out of scope: fetching or summarising links, scheduling, publishing, image generation.
```

**Clarify — focus areas:** maximum input length; what happens to unsaved edits during regeneration; how many versions are kept per post; whether the same idea can be run again for different platforms later.

**Plan**

```
/speckit.plan Add Post and PostVersion tables with migrations. Build the workspace as a client component that subscribes to the Epic 5 event stream and renders cards from run results. Use a lightweight rich-text-free editor (plain text area with line-break preservation) with debounced autosave through a server action. Regeneration creates a new run linked to the post and stores the result as a new version. Detect placeholders with a pattern defined once and shared between server and client. Use the Epic 1 components and tokens. Add Playwright tests for the full flow in English and Arabic using the fake provider.
```

**Tasks hint:** build the cards and autosave against a stored run first; connect the live stream afterwards.

## Epic 7 — Post Library

**Goal:** a searchable, reliable home for every post, with one-click copy. **Depends on:** E6. **PRD:** LIB-1 to LIB-6.

**E7-S1 · Automatic saving (P1)** As a professional, I want every generated post saved automatically, so that nothing is lost.

- Each post appears in the library as soon as it is generated and keeps its edits.

**E7-S2 · One-click copy (P1)** As a professional, I want to copy a post exactly as I will paste it, so that formatting survives.

- Copy preserves line breaks, emoji and hashtags for the target platform.
- Success is confirmed with a toast; the post can be marked as posted from the same place.

**E7-S3 · Browse and filter (P1)** As a professional, I want to filter by platform, status, date and tag, so that I find posts quickly.

- Filters combine; results are sorted newest first.
- Status values are draft, ready and posted.

**E7-S4 · Search (P1)** As a professional, I want to search post text, so that I can reuse old ideas.

- Search matches words in any of the user's languages, including Arabic.

**E7-S5 · Mark as posted (P1)** As a professional, I want to record that I published a post, so that I track what is live.

- The user sets status to posted and may add the post's link and date.

**E7-S6 · Version history (P1)** As a professional, I want to see and restore earlier versions, so that I can undo changes.

- Each version shows its source (agent or user edit) and time; restoring creates a new version.

**E7-S7 · Delete with undo (P1)** As a professional, I want to delete posts safely, so that mistakes are reversible.

- Deleting asks for confirmation and offers undo for 10 seconds; permanent deletion follows.

**E7-S8 · Export (P2)** As a professional, I want to export my posts as text or Markdown, so that I keep my own copy.

- Export covers selected posts or the whole library.

### Spec Kit prompts — Epic 7

**Specify**

```
/speckit.specify Add the post library to Saouti. Every generated post is saved automatically with its edits and can be copied in one click exactly as it should be pasted, preserving line breaks, emoji and hashtags. Users browse their posts with combined filters (platform, status of draft, ready or posted, date range, tag), search post text in any language including Arabic, mark posts as posted with an optional link and date, view and restore earlier versions, and delete posts with a ten-second undo. Lower priority: export of selected posts or the whole library as text or Markdown. Out of scope: scheduling, publishing, analytics, sharing posts with other users.
```

**Clarify — focus areas:** how many versions to keep; whether deleted posts can be recovered after the undo window; tag creation and limits; pagination size.

**Plan**

```
/speckit.plan Reuse the Post and PostVersion tables from Epic 6 and add Tag and a status column. Use PostgreSQL full-text search with a configuration that supports Arabic, French and English, backed by indexes. Implement copy with the browser Clipboard API with a text fallback. Paginate with cursor-based queries. Cover filters, search and version restore with integration tests against the test database, and add end-to-end tests for copy and mark-as-posted.
```

**Tasks hint:** write search and filter tests with Arabic data before the queries.

**Milestone:** after Epic 7 the product is a usable alpha: a user can sign up, add a key, define a voice, generate posts with visible agents and keep them in a library.

## Epic 8 — Images

**Goal:** image prompts for every post and, where the user's key allows it, generated images. **Depends on:** E7. **PRD:** IMG-1 to IMG-3.

**E8-S1 · Editable image prompts (P1)** As a professional, I want each post to carry an image prompt I can edit and copy, so that I can create visuals anywhere.

- The prompt, aspect ratio and alt text from the Art Director are shown on the card and in the library.
- The user can edit and copy them.

**E8-S2 · Generate an image with my key (P1)** As a professional, I want to generate the image inside Saouti, so that the post is complete.

- A Generate image action calls the provider through the user's key.
- If the provider or the user's tier does not support image generation, the action explains this and the prompt remains available.
- Progress and errors appear as Art Director states.

**E8-S3 · Store, attach and download (P1)** As a professional, I want generated images saved with the post, so that I can download them later.

- Images are stored privately, attached to the post, and downloadable.
- Deleting a post deletes its images.

**E8-S4 · Regenerate an image (P2)** As a professional, I want to adjust an image with an instruction, so that it matches my idea.

- A free-text instruction creates a new image; earlier images stay available.

### Spec Kit prompts — Epic 8

**Specify**

```
/speckit.specify Add images to Saouti posts. Each post shows an editable, copyable image prompt, aspect ratio and alt text written by the Art Director. Where the user's own provider key supports image generation, the user can generate the image inside Saouti; if it does not, the interface says so plainly and the prompt remains the result. Generated images are stored privately, attached to the post, downloadable, and deleted with the post. Progress and errors are shown as Art Director states. Lower priority: regenerating an image with an instruction while keeping earlier images. Out of scope: image editing tools, branded templates, carousels, video.
```

**Clarify — focus areas:** which image models and sizes are supported per platform; maximum file size and retention; what the user sees when image generation is rate limited.

**Plan**

```
/speckit.plan Extend the provider interface generateImage method and implement it in the Gemini adapter with model names from configuration and capability detection that fails gracefully. Store images on a local volume behind an abstraction that can later point to S3-compatible storage, served only to the owning user through authenticated routes. Add an Image table with migration. Add tests with the fake provider for success, unsupported tier, rate limit and deletion cascade.
```

**Tasks hint:** build the graceful-failure path first, because free-tier image support is unstable.

## Epic 9 — Deployment and Launch on Hostinger

**Goal:** a secure, monitored, recoverable production system and a controlled beta. **Depends on:** all previous epics. **PRD:** sections 8, 10 and 12.

**E9-S1 · Hardened server baseline (P1)** As an operator, I want a hardened VPS, so that the system starts from a safe base.

- Key-only SSH, a non-root deploy user, a firewall allowing only ports 80, 443 and SSH, and automatic security updates.

**E9-S2 · Domain and HTTPS (P1)** As a user, I want the app on my own domain over HTTPS, so that my data is protected in transit.

- DNS points to the server and certificates renew automatically.
- Security headers are set and the event-stream route is not buffered by the proxy.

**E9-S3 · Repeatable deployment and rollback (P1)** As an operator, I want deployment to be one repeatable action with a rollback, so that releases are low risk.

- Production and staging environments run the same containers with different configuration.
- A failed release can be rolled back to the previous version in minutes.
- Migrations run safely as part of release.

**E9-S4 · Secrets on the server (P1)** As an operator, I want secrets kept outside the repository with strict permissions, so that a leak of the code does not leak the system.

- Environment files are readable only by the service user.
- The procedure to back up and restore the encryption master key is documented and tested.

**E9-S5 · Backups and restore (P1)** As an operator, I want nightly backups stored off the server, so that I can recover from failure.

- The database and stored images are backed up nightly with a retention policy.
- A full restore on a clean server is performed and timed at least once before launch.

**E9-S6 · Monitoring and alerts (P1)** As an operator, I want to be alerted when something breaks, so that I react before users complain.

- Uptime checks, error tracking, and alerts for disk, memory and failed jobs are active.
- Logs rotate and contain no secrets or user content.

**E9-S7 · Security review (P1)** As the product owner, I want a security review before launch, so that known risks are closed.

- Dependencies are audited and critical findings fixed.
- A checklist covers authentication, session handling, rate limits, cross-user access, key handling and prompt injection, with evidence for each item.

**E9-S8 · Privacy notice and legal review (P1)** As the product owner, I want clear legal pages, so that users know how their data is handled.

- Privacy notice, terms and the free-tier data notice are published in three languages.
- Data export and deletion are available to users.
- A legal review against Algerian personal-data rules is completed or explicitly accepted as a risk.

**E9-S9 · Performance check (P2)** As the product owner, I want measured performance, so that I know the chosen server fits the beta.

- The first agent event appears within one second and a typical generation finishes within thirty seconds on a healthy quota.
- A load test with the expected number of beta users passes on the chosen VPS size.

**E9-S10 · Private beta (P1)** As the product owner, I want to launch to a small group first, so that I learn before opening up.

- Five to ten professionals are invited and onboarded.
- Feedback, errors and the PRD success metrics are collected for at least two weeks.
- The golden-profile suite passes on the production prompt versions.

### Spec Kit prompts — Epic 9

**Specify**

```
/speckit.specify Prepare Saouti for a controlled private beta in production. The system runs on a single hardened Hostinger virtual server on the project's own domain over HTTPS, with separate staging and production environments, repeatable deployment with rollback, secrets kept outside the repository, nightly off-server backups of the database and stored images with a tested restore, uptime and error monitoring with alerts, rotated logs without secrets or user content, a completed security review checklist, published privacy notice, terms and free-tier data notice in English, French and Arabic, user data export and deletion, measured performance targets (first agent event within one second, typical generation within thirty seconds), and a beta with five to ten invited professionals and two weeks of feedback. Out of scope: public marketing site, payments, scaling beyond one server.
```

**Clarify — focus areas:** the server size and region; the backup retention period; who receives alerts; the legal review owner and deadline; beta success criteria.

**Plan**

```
/speckit.plan Run the web app, worker, PostgreSQL and Redis with Docker Compose on a Hostinger VPS running Ubuntu LTS. Put Caddy in front for automatic HTTPS and an unbuffered route for Server-Sent Events. Deploy from GitHub Actions over SSH with image tags and a one-command rollback. Keep environment files outside the repository with restricted permissions. Take nightly pg_dump backups plus image archives, copy them to a second provider, and document and rehearse the restore. Use Uptime Kuma or a hosted free uptime check, Sentry or an equivalent for errors, and log rotation. Use ufw for the firewall and fail2ban for SSH. Write the runbook and the security checklist in the feature folder.
```

**Tasks hint:** rehearse a full restore and a rollback on staging before touching production.

## 3. Execution Order and Checkpoints

| Checkpoint          | After  | What you can demonstrate                                                        |
| ------------------- | ------ | ------------------------------------------------------------------------------- |
| M1 Foundation       | E0, E1 | Running app in light, dark and Arabic with the agent component on mock data     |
| M2 Access and keys  | E2, E3 | Sign up, verify, log in, add a Gemini key, provider layer tested                |
| M3 Voice and agents | E4, E5 | Onboarding, profile summary and a live multi-agent run with the activity stream |
| M4 Usable alpha     | E6, E7 | Full flow from idea to saved, copyable posts                                    |
| M5 Public beta      | E8, E9 | Images, secure production on Hostinger, private beta                            |

## 4. After the MVP: Backlog Epics

| Epic                                   | Goal                                                                         | PRD phase |
| -------------------------------------- | ---------------------------------------------------------------------------- | --------- |
| E10 Learning from edits                | Store the difference between generated and edited posts and adapt the Writer | V2        |
| E11 Idea bank and calendar             | Save ideas, plan content pillars and a posting calendar                      | V2        |
| E12 Strategist agent                   | Choose angles and formats per platform and objective                         | V2        |
| E13 Branded templates and carousels    | Quote cards and carousels that need no generative model                      | V2        |
| E14 Document upload and retrieval      | Use uploaded brand material with your own retrieval layer                    | V3        |
| E15 Scheduling and LinkedIn publishing | Official-API publishing, starting with LinkedIn                              | V3        |
| E16 Researcher agent and analytics     | URL and trend research, performance-informed suggestions                     | V3        |
