# Quickstart: Explore (with Tavily Search)

**Feature**: `011-explore`  
**Date**: 2026-10-24  
**Status**: Ready  

---

## 1. Prerequisites & Database Migrations

Ensure database containers and background services are active:
```bash
# 1. Apply additive database migrations for Explore tables (topics, articles, saved_articles, etc.)
pnpm drizzle-kit generate
pnpm db:migrate

# 2. Run background worker daemon
pnpm worker
```

---

## 2. Running Test Suites

Verify search provider contracts, query privacy, topic generation, and fallback logic:
```bash
# 1. Verify key encryption and Tavily format validation
pnpm test tests/unit/tavily-key.test.ts

# 2. Verify search query privacy: 0% profile leakage to external APIs
pnpm test tests/security/search-privacy.test.ts

# 3. Verify Researcher prompt and XML untrusted snippet isolation
pnpm test tests/unit/explore-feed.test.ts

# 4. Verify search provider fallback chain (Tavily 429/401 -> RSS Feeds)
pnpm test tests/integration/search-fallback.test.ts

# 5. Verify full test suite
pnpm test
```

---

## 3. Manual Testing Workflow

### Scenario A: Tavily Onboarding & Settings Setup
1. Register a new user or open `/onboarding`.
2. Notice the new **Step 2: Search Key (Tavily)** directly after the Gemini AI key step.
3. Review the multilingual guide (EN, FR, AR).
4. Enter a test Tavily key (`tvly-...`) and click **Save and Continue** (or click **Skip for now**).
5. Open `/settings/keys` -> confirm Tavily key is displayed with its last 4 characters and validation badge.

### Scenario B: Personalized Topics & Explore Feed
1. Navigate to `/explore` from the sidebar.
2. If first visit, observe the Topic Planner agent proposing 5 to 8 topics derived from your Voice Profile.
3. Pin, add, or delete topics using the interactive chips.
4. Click **Refresh**; observe the Researcher agent's active live status in the activity stream.
5. Review the discovered article cards: verify source domain, date, concise summary (≤40 words), and "Why it matches" badge.

### Scenario C: Create Post from Article
1. On any article card, click **Create Post**.
2. Observe that the workspace opens with the article attached as a `<source_article>` reference and a pre-populated brief.
3. Generate a post; verify the Writer attributes the source publisher by name and stays grounded in the article facts.

### Scenario D: Save & Private Notes
1. Click the **Save** bookmark on an article card.
2. Open `/explore/saved` -> verify the article is listed.
3. Add a private note; refresh the page to confirm persistence.
4. Remove the saved article.
