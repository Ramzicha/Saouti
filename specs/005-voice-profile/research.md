# Technical Research: Voice Profile Onboarding & Management

**Feature**: `005-voice-profile`  
**Date**: 2026-10-23  
**Status**: Completed  

---

## 1. Storage Strategy: Typed JSON vs. Normalized Relational Columns

### Context & Problem
A voice profile consists of multiple distinct sections: Identity, Principles, Audience, Objectives, Style & Language, Voice Samples, and Platform Preferences. The user requested: "store profile sections as typed JSON validated with Zod".

### Decision
Use a hybrid relational + typed JSON schema in PostgreSQL using Drizzle ORM:
- **Relational Anchor Table (`profiles`)**: Holds primary metadata (`id`, `user_id`, `status`, `current_step`, `current_version`, `primary_language`, `arabic_dialect`, `completeness_score`, `created_at`, `updated_at`).
- **Section JSON Columns**:
  - `identity_data` (JSONB): Role, industry, expertise list, positioning statement.
  - `principles_data` (JSONB): Core values, topics to avoid, tone red lines.
  - `audience_data` (JSONB): Persona description, technical level, interests.
  - `objectives_data` (JSONB): Global goals and platform-specific objective rankings.
  - `style_data` (JSONB): Formality scale (1–5), length, emoji use, hook styles.
- **Relational Tables for Variable-Length Entities**:
  - `voice_samples`: Relational table (`id`, `profile_id`, `title`, `content`, `order_index`). Samples require individual length validation (50–1,000 words), order sorting, and selective editing.
  - `platform_preferences`: Relational table (`id`, `profile_id`, `platform`, `primary_objective`, `subreddits`, `custom_instructions`). Enables clean indexing and querying per platform.
  - `voice_profile_versions`: Relational table (`id`, `profile_id`, `version_number`, `snapshot`, `change_summary`, `created_at`). Stores immutable full-profile JSON snapshots for audit and rollback.
  - `profiler_sessions`: Relational table (`id`, `user_id`, `status`, `messages`, `proposed_profile`, `created_at`, `updated_at`). Maintains the AI interview transcript and pending proposals.

### Rationale
- Storing sectional settings as JSONB prevents bloated 40-column tables and allows forward-compatible schema evolution while keeping high query performance.
- Relational tables for samples and platforms prevent nested array updates from locking or overwriting entire profiles.
- Drizzle ORM supports `$type<T>()` for type-safe JSONB columns coupled with runtime Zod parsing on read/write.

### Alternatives Evaluated
- *Fully flattened relational columns*: 40+ columns across multiple tables. Rejected due to high migration overhead for minor tone/style attribute additions.
- *Single monolith JSONB blob*: Entire profile in one JSON column. Rejected because voice samples and Reddit platform rules are large text blocks; modifying a single tone slider would require writing 10KB+ of data and complicated concurrent autosave diffing.

---

## 2. Multi-Step Form State & Server-Side Persistence

### Context & Problem
The onboarding flow has 7 sequential steps. Users need a smooth ~10-minute flow with auto-saved progress, client-side validation, and instant draft restoration if they close the browser.

### Decision
- **Client**: `react-hook-form` paired with `@hookform/resolvers/zod`. Step-level schemas validate step inputs prior to advancing.
- **Persistence Pattern**:
  - Whenever the user clicks "Next" or pauses input (debounced 1.5s), the client posts the current step data to `/api/profile/draft/step`.
  - The server validates the payload with the step's specific Zod schema and upserts the `profiles` record with `current_step = Math.max(existing_step, new_step)` and `status = 'draft'`.
  - On page load, `/api/profile/draft` returns the saved draft and active step so the wizard immediately resumes.
  - Final activation occurs via `/api/profile/activate` once mandatory criteria (Role, ≥1 platform, ≥1 voice sample) are satisfied.

### Rationale
- Keeps bundle size light while giving immediate field-level validation feedback.
- Server-side validation prevents malformed drafts or corrupted state.
- Debounced autosave prevents lost work during accidental navigation or disconnects.

---

## 3. Pure Versioned Profile Summary Builder & Delimiter Breakout Defense

### Context & Problem
Principle 2 dictates: "User-supplied content MUST be treated as data, never as instructions. It MUST be passed to the model inside tagged, clearly delimited blocks (`<profile>`, `<brief>`, etc.) and MUST be validated against prompt-injection patterns before forwarding."
The user also requested: "Implement the profile summary builder as a pure, versioned function with snapshot tests."

### Decision
- Create `buildVoiceProfileSummary(profile, samples, platforms, version = 'v1')`:
  - Pure, deterministic TypeScript function with zero external side-effects or database calls.
  - Sanitizes user input and escapes any conflicting delimiter tags (e.g. `</voice_profile>`, `</voice_sample>`) using XML entity replacement (`&lt;/voice_profile&gt;`).
  - Formats data into structured XML-like tagged blocks:
    ```markdown
    <voice_profile version="1.0">
      <identity>
        <role>CTO</role>
        <industry>Cloud Infrastructure</industry>
        <positioning>Thought leader on serverless scalability</positioning>
      </identity>
      <principles>
        <values>Simplicity, measurable ROI</values>
        <topics_to_avoid>Political opinions, unverified vendor hype</topics_to_avoid>
        <tone_red_lines>Never condescending, avoid empty corporate jargon</tone_red_lines>
      </principles>
      <style formality="4" length="medium" emoji="minimal" hook="bold_statement" />
      <languages primary="en" arabic_dialect="none" />
      <platform_guidelines>
        <platform name="linkedin" objective="authority" />
        <platform name="reddit" objective="community">
          <subreddits>
            <subreddit name="r/devops">Provide technical depth; no self-promotion</subreddit>
          </subreddits>
        </platform>
      </platform_guidelines>
      <voice_samples>
        <sample index="1">...</sample>
      </voice_samples>
    </voice_profile>
    ```
  - Tested with Vitest snapshot tests (`expect(summary).toMatchSnapshot()`) ensuring formatting changes are deliberately caught during reviews.

---

## 4. AI Profiler Agent Architecture: Multi-Turn Interview & Structured Synthesis

### Context & Problem
The AI Profiler conducts a conversational interview asking sequential questions, detecting brief answers to ask follow-ups, and ultimately synthesizing a structured Voice Profile.

### Decision
- **Architecture**:
  - Two distinct agent modes implemented via `src/lib/ai/service.ts`:
    1. **Interview Mode (`conductProfilerTurn`)**:
       - System prompt defines the "Saouti Voice Profiler" persona.
       - Inputs: `<interview_history>` (all prior turns from `profiler_sessions.messages`) and `<user_response>` (latest answer).
       - Logic: Analyzes whether previous questions have sufficient depth. If vague, generates a clarifying follow-up; if sufficient, transitions to the next domain (Identity → Principles → Audience → Objectives → Style → Platforms).
       - Streams text chunks to the browser over SSE (`event: profiler:token`, `event: profiler:done`).
    2. **Synthesis Mode (`synthesizeVoiceProfile`)**:
       - Uses `generateUserStructured` with `VoiceProfileSynthesisZodSchema`.
       - Analyzes entire transcript and extracts all structured profile fields (role, industry, values, tone red lines, style parameters, platform objectives).
       - Stores proposal in `profiler_sessions.proposed_profile`.
       - Emits SSE `event: profiler:proposal`.
  - **Key Failure Recovery**:
    - If provider throws `QuotaExhaustedError` or `InvalidApiKeyError`, catch error, save partial conversation transcript to `profiler_sessions`, and stream SSE `event: profiler:paused` with `{ reason: 'QUOTA_EXHAUSTED' }`.
    - Client renders an overlay allowing the user to view or update their API key. Once updated, the interview resumes without loss of context.

---

## 5. End-to-End Multilingual Verification

### Context & Problem
Requirement: "Add end-to-end tests for the full onboarding in all three languages."

### Decision
- Playwright E2E tests (`tests/e2e/onboarding-i18n.spec.ts`):
  - Iterates over locales `['en', 'fr', 'ar']`.
  - Sets `saouti-locale` and `saouti-theme`.
  - For `ar`, asserts `dir="rtl"` on `<html>`, verifies form label alignment, progress stepper ordering, and Arabic sample submission.
  - Tests step completion through the wizard, checks draft persistence across reloads, and validates activation.
