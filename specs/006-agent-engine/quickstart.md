# Quickstart & Developer Testing Guide: 006 — Agent Engine & Live Activity

This guide describes how to run, test, and evaluate the Saouti Agent Engine pipeline both locally with fake providers and on-demand with live Gemini keys.

---

## 1. Local Development Setup

Ensure Docker containers for PostgreSQL and Redis are active:
```bash
docker compose up -d
```

Apply migrations to create `runs` and `agent_steps` tables:
```bash
pnpm drizzle-kit migrate
```

Start the web application and worker:
```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: BullMQ background worker
pnpm worker
```

---

## 2. Running Automated Tests

### Run Unit and Contract Tests
```bash
# Run all agent engine unit tests
pnpm vitest run tests/unit/agent-engine

# Run event contract tests
pnpm vitest run tests/contract/agent-events.contract.test.ts
```

### Run Fake-Adapter Pipeline Integration Test (CI Suite)
Runs the complete state machine pipeline with the `FakeAiProviderAdapter` simulating Writer, Critic revision, Art Director, and Redis event stream emission with zero API charges:
```bash
pnpm vitest run tests/integration/agent-pipeline.test.ts
```

### Run Golden-Profile Evaluation Suite (Live API)
To test voice-matching fidelity, strict factual placeholder compliance (`[YOUR NUMBER]`), and Critic scoring against the real Gemini 2.0 Flash API:
```bash
# Requires valid Gemini API key
SAOUTI_EVAL_KEY="your-gemini-api-key" pnpm test:eval
```

### Run Adversarial Prompt Injection Test
Tests that jailbreak attempts (e.g., text trying to break out of XML data tags and redirect output) are strictly neutralized:
```bash
pnpm vitest run tests/security/prompt-injection.test.ts
```

---

## 3. Manual Verification Steps

1. **Verify Live Stream**:
   - Navigate to `/` (Workspace).
   - Enter a brief and select **LinkedIn** and **Reddit**.
   - Click "Generate Posts".
   - Confirm the Agent Presence chip transitions through Writer, Critic, and Art Director with live duration timers.
2. **Verify Page Reload Survival**:
   - Start a generation run.
   - During the Critic step, hit `Ctrl+R` to reload the page.
   - Verify the timeline rehydrates immediately and continues streaming remaining steps to completion.
3. **Verify Cancellation**:
   - Start a run.
   - Click "Cancel Run" on the timeline.
   - Verify the run halts within 1.5 seconds and indicates "Cancelled".
