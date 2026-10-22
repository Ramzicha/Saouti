<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial ratification)

Added sections:
  - Principle 1: Spec-First Governance
  - Principle 2: Security and Privacy First
  - Principle 3: Test Discipline
  - Principle 4: Provider Independence
  - Principle 5: Transparency
  - Principle 6: Accessibility and Localisation
  - Principle 7: Simplicity
  - Principle 8: Quality Gates
  - Section 9: Governance (amendment procedure, versioning policy, compliance review)
  - Section 10: Glossary

Modified principles: N/A (first version)
Removed sections: N/A (first version)

Templates requiring updates:
  ✅ .agent/skills/speckit.plan/templates/plan-template.md
     → "Constitution Check" gates now enumerate all 8 principles.
  ✅ .agent/skills/speckit.specify/templates/spec-template.md
     → Must include an "Accessibility & Localisation" requirements section
       and a "Test Plan" stub with Given/When/Then per user story.
  ✅ .agent/skills/speckit.tasks/templates/tasks-template.md
     → Task categories must include: security-review, a11y-check,
       i18n-check, quality-gate tasks (lint, type-check, test, build).

Deferred TODOs:
  - TODO(HOSTING_LEGAL_REVIEW): Algerian personal-data protection law review
    before launch (PRD §10).
-->

# Saouti — Project Constitution

**Version:** 1.0.0
**Ratification date:** 2026-10-22
**Last amended:** 2026-10-22
**Owner:** Ramzi
**Status:** Active

---

## Preamble

Saouti (Arabic: *sawti*, "my voice") is a free, bring-your-own-key web platform
that writes social media posts in a professional's authentic voice, using a
transparent, visible multi-agent pipeline. This constitution is the source of
law for every engineering, design, and governance decision made on the project.
It supersedes personal preference, convenience, and the defaults of any tool or
framework. Amendments require an explicit impact note (see §9).

---

## Principle 1 — Spec-First Governance

**Name:** Spec-First Governance

Every epic and feature MUST pass through the full speckit pipeline —
**Specify → Clarify → Plan → Tasks → Analyze** — before any production code is
written or merged.

- No work item reaches a code branch without a completed `spec.md` that has been
  reviewed for clarity gaps (`/03-speckit.clarify`).
- No implementation begins without a signed-off `plan.md` and `tasks.md`.
- No PR is opened without a linked spec and a passing `/06-speckit.analyze`
  consistency report.
- Exploratory spikes and proof-of-concept branches are exempt, but their
  findings MUST be folded into a formal spec before adoption into production.

**Rationale:** Saouti's domain — AI orchestration, encryption, real-time
streaming, multi-language RTL UI — is complex enough that undocumented
assumptions compound quickly. Spec-first discipline catches scope creep and
contradictions before they cost hours of refactoring.

---

## Principle 2 — Security and Privacy First

**Name:** Security and Privacy First

Security and privacy are non-negotiable constraints applied at every layer,
not a phase added before release.

- User API keys MUST be encrypted at rest using a server-side master key
  (AES-256-GCM or equivalent). They MUST NOT appear in logs, error messages,
  HTTP responses, or browser-side state — not even partially beyond the last
  four characters displayed in the UI.
- User-supplied content (voice profile, voice samples, pasted text, URLs) MUST
  be treated as **data**, never as **instructions**. It MUST be passed to the
  model inside tagged, clearly delimited blocks (`<profile>`, `<brief>`, etc.)
  and MUST be validated against prompt-injection patterns before forwarding.
- Every database query MUST be scoped to the authenticated user's id. There MUST
  be no cross-user data leakage path.
- Passwords MUST be hashed with Argon2id (preferred) or bcrypt. Plaintext
  passwords MUST never be logged or stored.
- All transport MUST be HTTPS. Cookies MUST be Secure, HttpOnly, and SameSite.
- Auth endpoints and generation endpoints MUST be rate-limited.
- Structured logs MUST NOT include prompt text, user content, or API keys.
- Data deletion (AUTH-4) MUST remove all personal data including stored keys,
  posts, profile, and voice samples within one synchronous request flow or a
  guaranteed async job with user-visible confirmation.
- Before launch, legal obligations under Algerian personal-data protection law
  MUST be reviewed and addressed (TODO: HOSTING_LEGAL_REVIEW).

**Rationale:** BYOK means user API keys are high-value secrets. A single logging
mistake or XSS vulnerability could expose thousands of dollars of AI quota and
personal data. Security cannot be retrofitted.

---

## Principle 3 — Test Discipline

**Name:** Test Discipline

Each user story in a feature spec MUST have automated tests derived directly
from its acceptance criteria. Tests MUST be written before or alongside the
implementation code — never after.

- Every `spec.md` MUST include acceptance scenarios in Given/When/Then format
  per user story. These scenarios are the direct source for test cases.
- The `tasks.md` for any feature MUST include explicit test tasks (unit,
  integration, or contract) for each user story, tagged with the story ID.
- Test tasks MUST appear before or alongside implementation tasks in the task
  list. Tests MUST be verified to fail before the implementation code is written.
- The test suite MUST cover: API key storage and retrieval (encrypted, never
  exposed), prompt-injection resistance (user content treated as data), agent
  pipeline determinism, RTL rendering of Arabic, accessibility (automated WCAG AA
  checks), and provider adapter contract.
- Test coverage for core security paths (encryption, auth, prompt handling) MUST
  be at or above 90% branch coverage.
- Golden-profile regression tests (5–10 curated profiles with fixed briefs) MUST
  be run on every prompt version change before release.

**Rationale:** The multi-agent pipeline, encryption layer, and RTL support are
all areas where defects are hard to spot in manual review. Acceptance-criteria-
driven tests make the spec executable and prevent regressions silently breaking
voice quality, security, or accessibility.

---

## Principle 4 — Provider Independence

**Name:** Provider Independence

AI providers, model names, and quota parameters MUST be treated as external
configuration — never hardcoded in application logic.

- All AI provider communication MUST go through a single internal provider
  abstraction: `generate(prompt)`, `generateStructured(prompt, schema)`,
  `generateImage(prompt)`. No application code outside the adapter layer MAY
  reference a provider SDK directly.
- Model names (e.g., `gemini-2.0-flash`) and rate-limit thresholds MUST reside
  in environment configuration or a runtime-editable config table — NOT in source
  code or compiled constants.
- Adding a new AI provider MUST require only: a new adapter implementing the
  interface, and a configuration entry. It MUST NOT require changes to pipeline,
  orchestration, or UI code.
- Prompt construction MUST use only standard patterns (system-instruction field,
  JSON schemas, tagged blocks) — no provider-specific extensions that would break
  on another provider.
- Provider adapters MUST implement exponential backoff with jitter on 429
  responses, and MUST surface retry state to the UI via SSE agent events.

**Rationale:** Free-tier model lineups and quotas change without notice. Gemini
is the default, but users may bring keys for other providers. Coupling the
codebase to one SDK would make provider migration a large refactor and break the
BYOK promise.

---

## Principle 5 — Transparency

**Name:** Transparency

Every action taken by an AI agent MUST be visible to the user in real time.

- The UI MUST always display the name, icon, and a one-line status of the
  currently active agent (AGT-1).
- A collapsible activity timeline MUST record every agent step with: agent name,
  task label, duration, and status — pass, revise, or error (AGT-2).
- Agent hand-offs MUST be displayed with the reason in plain language (AGT-3,
  AGT-4).
- Errors and rate-limit states MUST be shown as named agent states
  (e.g., "Writer · Paused, quota reached, retrying in 20 s") — not as generic
  spinners or silent failures (AGT-6).
- The model and provider used by each agent MUST be available to the user on
  request (AGT-5).
- Agent events MUST be streamed to the browser over Server-Sent Events (SSE).
  The backend MUST NOT buffer results and deliver them all at once.
- The activity display MUST remain accurate under the deterministic pipeline
  (see Principle 7); no speculative or fabricated step labels are permitted.

**Rationale:** Trust is the product's core differentiator. Users who can see
exactly which agent is working, why a revision was requested, and what model was
used are more likely to trust the output and engage with the system. Hiding AI
activity is antithetical to the product's premise.

---

## Principle 6 — Accessibility and Localisation

**Name:** Accessibility and Localisation

The platform MUST be accessible and fully localised in Arabic, French, and
English from the first public release.

- All UI components MUST meet **WCAG 2.1 Level AA** in both light and dark
  themes. This includes: colour contrast ratios ≥ 4.5:1 for normal text,
  keyboard navigation for all interactive elements, visible focus indicators,
  and respect for the OS `prefers-reduced-motion` setting.
- Arabic MUST render in full right-to-left layout: mirrored navigation, reversed
  flex/grid flows, and correct bidirectional text in mixed-direction content.
  RTL MUST be tested on each release.
- All user-facing strings MUST be externalised to locale files; no hardcoded
  English strings in components. Adding a fourth language MUST require only
  adding a locale file.
- Light, dark, and system-default themes MUST be supported from day one (SET-6).
- The default interface language MUST be configurable per user (SET-7).
- Image prompts and alt text generated by the Art Director agent MUST be
  produced in the content language of the post.
- Automated accessibility tests (axe-core or equivalent) MUST be part of the
  CI pipeline and MUST block merge on violations.

**Rationale:** Saouti's target market includes Arabic-speaking professionals,
particularly in Algeria and the wider Francophone North-African region. Treating
RTL and i18n as afterthoughts would exclude the primary audience. WCAG AA is a
baseline legal and ethical obligation, not an optional enhancement.

---

## Principle 7 — Simplicity

**Name:** Simplicity

The pipeline MUST be deterministic and implemented in plain application code.
Speculative abstractions, premature generalisation, and non-free or proprietary
tools MUST be avoided.

- The agent orchestration pipeline is a fixed, sequential TypeScript function
  with one bounded revision loop (Writer → Critic → optional Writer revision →
  Art Director). It is NOT a meta-agent deciding what to do next. Changes to the
  pipeline MUST go through the spec-first workflow.
- New abstractions (interfaces, base classes, design patterns) are permitted only
  when they solve a concrete, present problem and MUST be justified in the plan.
  Abstractions that "might be useful later" MUST be rejected.
- All libraries, frameworks, and tooling MUST be free and open-source, with two
  explicit exceptions: the Hostinger VPS server (paid, necessary compute) and
  users' own API keys (external, user-controlled).
- The number of services, databases, and infrastructure components MUST be kept
  to the minimum required for correctness and the non-functional requirements.
  Adding a component requires justification in the plan's Complexity Tracking
  table.
- Configuration MUST be preferred over code for: model names, platform rules,
  rate-limit parameters, and prompt versions.
- Each new dependency MUST be evaluated against: licence compatibility,
  maintenance activity, bundle size impact, and whether the same result could be
  achieved with a few lines of application code.

**Rationale:** Saouti is a solo/small-team project that must remain maintainable
and auditable. Complexity accumulates quietly; the simplicity principle is the
primary defence against architectural debt that would slow delivery and obscure
security issues.

---

## Principle 8 — Quality Gates

**Name:** Quality Gates

Lint, type-check, automated tests, and build MUST all pass before any code is
merged to the main branch.

- The CI pipeline MUST enforce, in order: lint → type-check → unit tests →
  integration tests → accessibility tests → build. Any failure MUST block merge.
- No `// @ts-ignore`, `eslint-disable`, or equivalent suppression comment is
  permitted without a linked issue and a brief justification comment explaining
  why the suppression is temporary.
- The `main` branch MUST always be in a deployable state.
- Dependency updates MUST not bypass the quality gate. Automated update PRs
  MUST pass all gates before auto-merge is enabled.
- Performance budgets (first agent event ≤ 1 s; full generation ≤ 30 s on a
  healthy quota) MUST be validated in the staging environment before a release
  is tagged.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) MUST be verified in CI
  using a header-check tool.

**Rationale:** A pipeline that can be broken silently is no pipeline at all.
Quality gates make "the build passes" a meaningful, trustworthy signal that
protects the main branch and prevents the accumulation of silent regressions
across security, type safety, and accessibility.

---

## 9. Governance

### Amendment Procedure

1. Any amendment to this constitution MUST be proposed as a named change with:
   - The principle(s) being modified, added, or removed.
   - The reason the change is needed.
   - An **explicit impact note** listing every existing `spec.md`, `plan.md`,
     and `tasks.md` that is affected, and the nature of the impact (breaking,
     additive, clarification).
2. Before the amendment is ratified, all affected artifacts MUST be updated or
   tagged with a `TODO(CONSTITUTION-vX.Y.Z)` marker for deferred updates.
3. `CONSTITUTION_VERSION` MUST be incremented per the versioning policy below.
4. `LAST_AMENDED_DATE` MUST be updated to the ISO date of ratification.
5. The Sync Impact Report HTML comment at the top of this file MUST be updated.

### Versioning Policy

- **MAJOR**: A principle is removed or redefined in a backward-incompatible way
  (e.g., removing the spec-first gate, changing the security model).
- **MINOR**: A new principle or significant sub-rule is added.
- **PATCH**: Wording clarifications, typo fixes, or non-semantic refinements.

### Compliance Review

- Every `/06-speckit.analyze` run MUST check that the feature's plan and tasks
  are consistent with all 8 principles.
- Before each release, a manual constitution compliance review MUST be performed
  by the owner, verifying: encryption is in place, no hardcoded model names
  exist, RTL tests pass, and the quality gate is green.

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **BYOK** | Bring Your Own Key — users supply their own AI provider API key; Saouti neither provides nor pays for AI usage. |
| **Epic** | A large body of related work, decomposed into features and user stories. |
| **Provider abstraction** | The internal interface (`generate`, `generateStructured`, `generateImage`) that decouples the pipeline from any specific AI provider SDK. |
| **Speckit pipeline** | The ordered workflow: Specify → Clarify → Plan → Tasks → Analyze → Implement. |
| **Golden profile** | A curated, fixed user profile and brief used for prompt regression testing. |
| **RTL** | Right-to-left text direction, required for Arabic. |
| **Quality gate** | The CI checks (lint, type-check, tests, build) that MUST all pass before merge. |
| **Voice Profile** | The persistent user record capturing identity, principles, audience, objectives, style, languages, and voice samples. |
