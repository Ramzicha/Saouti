# Feature Specification: AI Provider Keys and Provider Abstraction Layer

**Feature Branch**: `004-ai-provider-keys`  
**Created**: 2026-10-23  
**Status**: Draft  
**Input**: User description: "Let each Saouti user bring their own AI provider key; the platform never supplies one. A user can add a Gemini key, which is validated with a minimal test call before saving, stored encrypted, and shown only as its last four characters. They can replace or delete it. A step-by-step guide in English, French and Arabic helps users create a free key and explains that free-tier data handling may differ from paid; it links to the provider's current terms. Without a valid key, any generation attempt sends the user to key setup, and new accounts see key setup first. All AI calls go through one provider-independent layer offering text, schema-validated structured output and image generation, with Gemini as the first provider, model names in configuration and provider errors normalised into a few user-friendly types. Temporary quota or rate-limit responses are retried with backoff and every wait is reported as an event. Lower priority: usage indicator and per-task model choice. Out of scope: payments, other providers."

---

## Assumptions & Clarifications

Based on project constitution (Principles 2, 4, 5, 6, 7) and `docs/Saouti — Epics, User Stories and Spec Kit Prompts.md` (Epic 3), the following domain constraints and defaults apply:

1. **Key Validation Minimal Cost Model**:
   - The key validation check performs a lightweight connectivity verification using a minimal token ping (or model availability check) via the provider SDK configured for the default fast model (e.g. `gemini-2.0-flash`, `maxOutputTokens: 1`). This confirms authentication and active quota with negligible or zero cost, without generating unnecessary content.
2. **Key Security & Encryption at Rest (Principle 2)**:
   - User API keys are stored encrypted at rest using AES-256-GCM with a server-side master key and a unique per-record initialization vector (nonce).
   - Decryption occurs strictly inside the server environment at the moment an AI request is initiated.
   - Plaintext keys never reach client responses, client storage, structured server logs, error objects, or telemetry.
   - UI displays only the last 4 characters (e.g., `••••••••••••••Ab12`) and provider metadata (provider name, date added).
3. **Provider Independence (Principle 4)**:
   - All AI calls are dispatched through a unified provider-agnostic interface:
     - `generateText(prompt, options)`
     - `generateStructured(prompt, schema, options)`
     - `generateImage(prompt, options)`
   - Model identifiers (e.g., `gemini-2.0-flash`, `imagen-3.0`) reside in configuration files or runtime environment settings, never hardcoded in orchestration logic.
4. **Normalized Error Mapping**:
   - Provider errors are mapped into standardized, user-facing error types:
     - `INVALID_API_KEY`: Authentication failed or revoked.
     - `QUOTA_EXHAUSTED`: Rate limit or billing quota exceeded.
     - `CONTENT_SAFETY_BLOCKED`: Provider safety filter flagged prompt or output.
     - `PROVIDER_UNAVAILABLE`: Upstream 5xx service outage.
     - `REQUEST_TIMEOUT`: Upstream call exceeded duration limit.
5. **No Key, No Generation**:
   - The platform never supplies a fallback or shared system key.
   - New accounts landing in the workspace shell without a registered key are directed immediately to the Key Setup guide.
   - Any composer submission or generation trigger without a valid key halts gracefully and routes the user to Key Setup.
6. **Accessibility & Trilingual Support (Principle 6)**:
   - Guided walkthroughs, key input dialogs, status messages, and error alerts are fully localized in English (`en`), French (`fr`), and Arabic (`ar`, with native right-to-left mirroring).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add and Validate Gemini API Key (Priority: P1) 🎯 MVP

As a professional using Saouti, I want to securely add my personal Gemini API key and have it validated before saving, so that I know my setup is functioning and ready to power generations without risking key exposure.

**Why this priority**: Core prerequisite for all AI features. Without a validated user-supplied key, no agent generation can take place in Saouti.

**Independent Test**: Enter a valid Gemini API key into the key management dialog; the system validates the key against Google GenAI with a lightweight check, encrypts it with AES-256-GCM, stores it in the database, and renders the masked key (`••••••••••••••WXYZ`) with a success confirmation. Submitting an invalid key displays a specific validation error and refuses to save.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Key Setup or Settings page, **When** they paste a valid Gemini key and click "Verify & Save", **Then** the system executes a minimal test call, encrypts and persists the key, and displays the masked key showing only the last 4 characters.
2. **Given** an invalid or revoked Gemini key, **When** the user attempts to save it, **Then** the validation call fails, no key record is saved, and a clear error message is displayed (e.g., "The provided Gemini key is invalid or inactive").
3. **Given** a successfully saved key, **When** inspecting API network responses, server logs, and DOM elements, **Then** the plaintext key is completely absent and only the masked format is present.
4. **Given** the key setup form, **When** viewed in Arabic, French, or English, **Then** all labels, helper text, and validation states render cleanly in the respective language and text direction.

**Test Plan** *(Principle 3 — required)*:
- Unit: Validation schema for key format, AES-256-GCM encryption/decryption round-trip, key masking utility.
- Integration: `POST /api/settings/keys` with mock provider returning 200 (valid key saved) and 401/403 (invalid key rejected).
- Security path covered: [x] Yes (AES-256-GCM encryption, zero-leak logging, masked display).

---

### User Story 2 — Guided Key Creation & Free-Tier Notice (Priority: P1)

As a user who does not already have an AI API key, I want a step-by-step visual guide in my language explaining how to get a free Gemini key and how free-tier data handling works, so that I can easily obtain a key and understand privacy implications.

**Why this priority**: Removes adoption friction for non-technical users while fulfilling privacy transparency obligations regarding third-party provider terms.

**Independent Test**: Open the "Get a Free Key" guide in English, French, or Arabic; follow the step-by-step walkthrough detailing Google AI Studio navigation, verify the free-tier data disclaimer links to Google's official terms, and confirm acknowledgment before entering the key.

**Acceptance Scenarios**:

1. **Given** a user on the Key Setup screen, **When** they view the key creation guide, **Then** they see step-by-step instructions with clear screenshots/instructions for Google AI Studio in their active locale (`en`, `fr`, or `ar`).
2. **Given** the free-tier notice, **When** viewed by the user, **Then** it clearly explains that Google may process prompt and output data on free-tier keys in accordance with provider terms, provides a direct link to Google's current API terms of service, and requires an explicit acknowledgment checkbox ("I understand that free-tier API keys may permit Google to review and use data per their terms") before the save button becomes active.
3. **Given** an Arabic-speaking user, **When** viewing the guide, **Then** the walkthrough and external link indicators display with proper right-to-left layout and cultural terminology.

**Test Plan** *(Principle 3 — required)*:
- Unit: Locale dictionary checks ensuring all guide steps and notice strings exist across `en`, `fr`, `ar`.
- Integration: E2E navigation test through the guided key dialog across desktop and mobile drawer viewports.
- Security path covered: [ ] N/A

---

### User Story 3 — Replace or Remove API Key (Priority: P1)

As a user, I want to rotate an existing key with a new one or permanently delete my stored key, so that I retain full sovereignty over my API credentials and quota.

**Why this priority**: Security hygiene, credential rotation, and user autonomy over their external provider quotas.

**Independent Test**: Replace an existing key with a new valid key -> old key is cleanly overwritten after successful validation. Delete an existing key -> encrypted key is purged from the database, UI reflects no key present, and composer blocks further runs until a new key is added.

**Acceptance Scenarios**:

1. **Given** an existing configured key, **When** the user clicks "Replace Key" and enters a new valid key, **Then** the new key is validated first; upon successful validation, the existing key is replaced and a confirmation toast appears.
2. **Given** a replacement attempt with an invalid key, **When** validation fails, **Then** the existing valid key is retained and remains active.
3. **Given** a stored key, **When** the user clicks "Delete Key" and confirms the modal prompt, **Then** the key record is permanently deleted from the database and the UI reverts to the "Add Key" empty state.
4. **Given** an in-flight generation run, **When** the user deletes or replaces their API key mid-run, **Then** the in-flight background worker detects the key change at the next agent step, halts execution gracefully, saves all partial step outputs, and updates the run status to "Generation stopped: API key was removed."

**Test Plan** *(Principle 3 — required)*:
- Unit: Key replacement transactional logic, key deletion cascading logic.
- Integration: `DELETE /api/settings/keys` and `PUT /api/settings/keys` endpoints verifying state transitions in DB.
- Security path covered: [x] Yes (Permanent crypto-erasure of key from DB).

---

### User Story 4 — Provider-Independent Generation Layer (Priority: P1)

As a platform developer and agent architect, I want all AI interactions to go through a single provider-agnostic interface with Gemini as the initial implementation, so that agent workflows never couple directly to vendor SDKs.

**Why this priority**: Enforces Principle 4 (Provider Independence) and Principle 7 (Simplicity), allowing seamless provider swaps and contract-tested multi-agent operations.

**Independent Test**: Execute text generation, schema-validated structured output, and image generation requests against a test fake adapter and the Gemini adapter; both return normalized result envelopes and throw identical normalized exception types.

**Acceptance Scenarios**:

1. **Given** a text prompt request, **When** called through `generateText`, **Then** the adapter delegates to the configured model and returns a standardized response containing text and usage metadata.
2. **Given** a structured data request with a Zod schema, **When** called through `generateStructured`, **Then** the adapter enforces JSON mode/grammar on the provider and returns fully validated typed data matching the schema.
3. **Given** an image prompt request, **When** called through `generateImage`, **Then** the adapter communicates with the image model and returns image assets/data or reports unsupported capability if the key lacks image permissions.
4. **Given** upstream provider failures (e.g. invalid key, quota, timeout, content blocked), **When** caught by the adapter, **Then** they are converted into normalized Saouti error types (`INVALID_API_KEY`, `QUOTA_EXHAUSTED`, `CONTENT_SAFETY_BLOCKED`, `PROVIDER_UNAVAILABLE`, `REQUEST_TIMEOUT`).

**Test Plan** *(Principle 3 — required)*:
- Unit: Contract tests verifying `FakeProviderAdapter` and `GeminiAdapter` conform to the unified provider interface.
- Integration: Provider error normalizer tests mapping Google GenAI error responses to Saouti domain errors.
- Security path covered: [x] Yes (Schema-enforced output sanitization, prompt delimiter isolation).

---

### User Story 5 — Graceful Rate-Limit Backoff & Real-Time Event Reporting (Priority: P1)

As a user running an agent pipeline, I want temporary quota or rate-limit responses to be retried automatically with clear real-time status updates, so that brief limits don't lose my work and I always know why the system is waiting.

**Why this priority**: Free-tier Gemini keys have strict RPM (Requests Per Minute) limits; automatic backoff with transparent UI feedback (Principle 5) prevents unnecessary job crashes.

**Independent Test**: Mock a provider returning 429 quota exhaustion on attempt 1 and 2, followed by success on attempt 3; verify exponential backoff with jitter occurs, retry SSE events are emitted to the client, and the final generation completes.

**Acceptance Scenarios**:

1. **Given** a temporary 429 rate-limit response from the provider, **When** encountered during an agent step, **Then** the system retries with exponential backoff and jitter, emitting an agent status event (e.g., "Writer · Quota limit reached, retrying in 12s").
2. **Given** sustained 429 errors that exceed the retry policy (maximum 3 retries, up to 45 seconds cumulative wait time), **When** the retry budget is exhausted, **Then** the run halts gracefully, saves all partial step outputs, and marks the agent state as paused/failed with a user-friendly quota notice.
3. **Given** a client connected via SSE, **When** rate-limit delays occur, **Then** every waiting interval is reported with an updated countdown timer.

**Test Plan** *(Principle 3 — required)*:
- Unit: Backoff calculation with jitter, retry wrapper limit enforcement.
- Integration: End-to-end retry pipeline simulation testing SSE event emissions during 429 events.
- Security path covered: [ ] N/A

---

### User Story 6 — Gatekeeper: No Key, No Generation (Priority: P1)

As a user without an API key, I want the interface to guide me directly to key setup whenever I attempt a generation or land in a new account, so that I never encounter ambiguous failures.

**Why this priority**: Guarantees that the BYOK model is strictly enforced and user expectations are clear from first login.

**Independent Test**: Log in with a fresh verified account without an API key; workspace immediately displays the Key Setup onboarding banner/modal and disables the composer prompt until a key is added.

**Acceptance Scenarios**:

1. **Given** a newly registered user who has verified their email, **When** they first enter the workspace, **Then** they are presented with the Key Setup screen before any post generation can be initiated.
2. **Given** an existing user who deletes their key, **When** they navigate to the composer workspace, **Then** the composer input is disabled with a prominent prompt: "Add your Gemini API key to start writing".
3. **Given** an unauthenticated or keyless direct API call to `/api/generate`, **When** received, **Then** the endpoint immediately rejects the request with HTTP 400 and an error code `MISSING_API_KEY`.

**Test Plan** *(Principle 3 — required)*:
- Unit: Middleware/route gatekeeper logic checking key existence before processing generation jobs.
- Integration: Composer UI test asserting disabled state and banner presence when `hasKey === false`.
- Security path covered: [x] Yes (No platform fallback key; zero unauthorized computation).

---

### User Story 7 — Usage and Quota Indicator (Priority: P2)

As a user, I want to see my recent request counts and quota errors in Settings, so that I understand my provider usage and limits.

**Why this priority**: Enhances transparency for users managing free or paid tiers, helping diagnose why rate limits occur.

**Independent Test**: Trigger several test calls; navigate to Key Settings to inspect the 7-day usage chart displaying total requests, token counts (if returned by provider), and rate-limit error counts.

**Acceptance Scenarios**:

1. **Given** completed or failed AI calls, **When** viewing Key Settings, **Then** the user sees daily request tallies and quota error counts for today and the last 7 days.
2. **Given** a day with zero activity, **When** viewed, **Then** the chart displays zero requests without layout breakage.

**Test Plan** *(Principle 3 — required)*:
- Unit: Aggregation logic for daily usage counters.
- Integration: `GET /api/settings/keys/usage` endpoint test.
- Security path covered: [ ] N/A

---

### User Story 8 — Per-Task Model Configuration (Priority: P2)

As an advanced user, I want to choose which model is used for writing, critique, and images, so that I can balance speed, quality, and quota consumption.

**Why this priority**: Gives power users flexibility while keeping defaults simple for mainstream users.

**Independent Test**: Change the Writer model to `gemini-1.5-pro` and Critic model to `gemini-2.0-flash` in Settings; verify subsequent generation runs invoke the specified models per task type.

**Acceptance Scenarios**:

1. **Given** the Model Selection settings, **When** the user selects a supported model for Writer, Critic, or Art Director, **Then** the preferences are saved and applied to future runs.
2. **Given** an invalid or retired model selection, **When** initiated, **Then** the system falls back safely to configured default models.

**Test Plan** *(Principle 3 — required)*:
- Unit: Model preference validation schema and configuration fallback resolver.
- Integration: Pipeline run verifying model selection metadata passed into adapter requests.
- Security path covered: [ ] N/A

---

## Edge Cases

- **Key Expired / Revoked Externally**: If a user deletes their key in Google AI Studio, the next generation call catches a 401/403, normalizes it to `INVALID_API_KEY`, updates the key status to invalid in the database, and prompts the user to re-validate or replace the key.
- **Provider Outage (503/500)**: Upstream Google outages are caught and classified as `PROVIDER_UNAVAILABLE`; the UI advises the user to wait or check Google Cloud Status, rather than blaming user input.
- **Safety / Policy Blocks**: If a user's brief or topic triggers Google's safety filters, the adapter extracts the safety block reason and reports `CONTENT_SAFETY_BLOCKED` with guidance to adjust the prompt.
- **Concurrent Requests on Free Tier**: Free-tier Gemini keys have low concurrency limits (e.g. 5–15 RPM). Simultaneous agent steps are scheduled sequentially or queued with backoff to prevent self-inflicted rate limiting.
- **Accidental Extra Whitespace in Key**: Pasted keys often have leading/trailing spaces or line breaks; the client and server must automatically sanitize and trim whitespace before validation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add an API key for Google Gemini, validating it via a minimal test call prior to storage.
- **FR-002**: System MUST encrypt API keys at rest using AES-256-GCM with a server-side master key and unique initialization vector.
- **FR-003**: System MUST NEVER return plaintext API keys to the browser, log them in structured logs, or include them in error traces; keys displayed in UI MUST show only their last four characters.
- **FR-004**: System MUST allow users to replace an existing key (validating the new key before replacing) or delete an existing key permanently.
- **FR-005**: System MUST provide a step-by-step visual creation guide in English, French, and Arabic detailing how to obtain a free key from Google AI Studio.
- **FR-006**: System MUST display a clear notice regarding provider free-tier data handling policies with a direct link to the provider's terms.
- **FR-007**: System MUST intercept any generation attempt when no valid key exists and redirect the user to Key Setup.
- **FR-008**: System MUST route all AI interactions through a unified provider-independent abstraction providing `generateText`, `generateStructured`, and `generateImage`.
- **FR-009**: System MUST read model names and provider parameters from external configuration rather than hardcoded strings in application code.
- **FR-010**: System MUST normalize all provider error responses into standard Saouti error categories (`INVALID_API_KEY`, `QUOTA_EXHAUSTED`, `CONTENT_SAFETY_BLOCKED`, `PROVIDER_UNAVAILABLE`, `REQUEST_TIMEOUT`).
- **FR-011**: System MUST retry rate-limited (HTTP 429) requests using exponential backoff with jitter and emit real-time status events for each retry pause.
- **FR-012**: System MUST provide a fake provider adapter for deterministic offline unit and integration testing.
- **FR-013**: System MUST record daily usage and quota error tallies per user for the last 7 days (P2).
- **FR-014**: System MUST allow per-task model overrides from a configured list of supported models (P2).

---

### Key Entities

- **ApiKey**: Represents a user's encrypted credentials for an external AI provider.
  - Attributes: `id`, `userId`, `provider` (e.g. 'gemini'), `encryptedKey`, `nonce`, `authTag`, `lastFour`, `status` ('active', 'invalid', 'quota_exceeded'), `lastValidatedAt`, `createdAt`, `updatedAt`.
  - Scoping: Strictly scoped to `userId` with cascade deletion when the user account is purged.
- **ProviderConfig**: Static configuration specifying available models, token limits, rate-limit retry thresholds, and task mappings.
- **ApiUsageDaily**: Aggregated usage tracking per user.
  - Attributes: `id`, `userId`, `provider`, `date`, `requestCount`, `errorCount`, `quotaErrorCount`, `updatedAt`.

---

## Accessibility & Localisation *(mandatory — Principle 6)*

- **A11Y-001**: Key input forms, guided steps, and confirmation modals MUST be fully keyboard-navigable with visible focus outlines meeting WCAG 2.1 AA.
- **A11Y-002**: Password/key visibility toggles (if showing masked state) and copy/paste helpers MUST have explicit `aria-label` attributes in the current locale.
- **A11Y-003**: Error banners and retry countdown notifications MUST use `role="status"` or `aria-live="polite"` so screen readers announce backoff states without interrupting.
- **A11Y-004**: Color contrast for status chips (Active, Invalid, Quota Limit) in both light and dark themes MUST meet or exceed 4.5:1.
- **I18N-001**: All guide copy, privacy notices, button labels, and error messages MUST be externalized to locale files (`en.json`, `fr.json`, `ar.json`).
- **I18N-002**: In Arabic (`ar`), the key guide, steps, input groups, and icons MUST mirror properly in right-to-left layout, while keeping the API key input itself in LTR (`dir="ltr"`) for correct cryptographic character entry.
- **I18N-003**: Provider error explanations and retry status notices MUST be presented in the user's selected interface language.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can complete adding and validating a Gemini API key within 3 minutes using the guided walkthrough.
- **SC-002**: 100% of stored API keys are encrypted at rest with zero occurrences of plaintext keys in server logs, API payloads, or client storage.
- **SC-003**: Temporary rate-limit (429) spikes recover automatically via backoff without user intervention in ≥ 80% of transient throttling incidents.
- **SC-004**: Key validation test calls complete in under 2.5 seconds under normal network conditions.
- **SC-005**: 100% of unauthenticated or keyless generation requests are blocked with zero shared platform key leakage.
