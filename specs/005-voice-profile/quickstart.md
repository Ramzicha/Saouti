# Developer Quickstart: Voice Profile Onboarding & Management

**Feature**: `005-voice-profile`  
**Date**: 2026-10-23  

---

## 1. Setup & Migration

```bash
# Generate the migration for new profile tables
pnpm db:generate

# Apply migrations to local PostgreSQL database
pnpm db:migrate
```

---

## 2. Running Unit & Integration Tests

```bash
# Run pure snapshot tests for profile summary builder
pnpm test tests/unit/profile-summary.test.ts

# Run multi-step draft persistence tests
pnpm test tests/integration/profile-draft.test.ts

# Run AI Profiler interview & synthesis contract tests (using FakeProviderAdapter)
pnpm test tests/integration/profiler-agent.test.ts

# Run all tests with coverage
pnpm test:coverage
```

---

## 3. End-to-End Multilingual Verification

Ensure your local dev stack or Docker compose is running:

```bash
# Run Playwright E2E tests for onboarding across EN, FR, and AR (RTL)
pnpm test:e2e tests/e2e/onboarding-i18n.spec.ts
```

---

## 4. Manual Verification Walkthrough

1. **Sign Up a New Account**:
   - Navigate to `http://localhost:3000/en/signup`.
   - Log in and notice the workspace composer is disabled, directing you to add your Gemini API Key in Settings or begin Onboarding.
2. **Launch Onboarding Flow**:
   - Go to `http://localhost:3000/en/onboarding`.
   - Fill in Step 1 (Role & Positioning), click Next.
   - Refresh the page to verify Step 1 values are restored automatically from draft state.
   - Advance through the steps, paste at least 1 voice sample (50–1,000 words), select target platforms.
   - Click "Activate Profile" and observe transition to workspace.
3. **Test the AI Profiler**:
   - Alternatively, select "Interview with AI Profiler" on the onboarding welcome card.
   - Answer the conversational questions. Test providing a short answer ("I do tech") to trigger a smart follow-up.
   - Complete the interview, view the structured proposal, and click "Accept and Save".
4. **Inspect Agent View & Revision History**:
   - Navigate to `/settings/profile`.
   - Open the "Agent View" tab to verify the exact delimited `<voice_profile>` XML/markdown text.
   - Edit a tone red line and save; inspect the "Revision History" tab to see Version 2 created, and click "Roll Back to Version 1" to verify state restoration.
