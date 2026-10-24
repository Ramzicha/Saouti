# Technical Research: Explore (with Tavily Search)

**Feature**: `011-explore`  
**Date**: 2026-10-24  
**Status**: Completed  
**Prerequisites**: [spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/011-explore/spec.md), [11-explore.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/docs/11-explore.md)

---

## 1. Key Vault Generalization for Multi-Provider Keys

### Context
In Epic 3/4 (`004-ai-provider-keys`), API keys were stored in the `api_keys` table strictly for Gemini AI. Epic 11 introduces Tavily as an external search provider. We must support both `gemini` and `tavily` keys under the user's ownership without breaking existing production keys.

### Decision
- Add an additive `provider` column to `api_keys` (`varchar(50) NOT NULL DEFAULT 'gemini'`).
- Add a unique index on `(user_id, provider)` to allow at most one active key per provider per user.
- Existing Gemini rows automatically default to `provider = 'gemini'`, requiring zero data migration downtime.
- Reuse the server-side master key with AES-256-GCM encryption (`encryptKey` / `decryptKey` in `src/lib/crypto/key-encryption.ts`).
- Tavily keys are validated before saving via a lightweight HTTP ping to Tavily's endpoint (`https://api.tavily.com/search` with a minimal 1-token query or dedicated key check endpoint).
- Key retrieval returns only `{ provider, lastFour, isConfigured, status, updatedAt }`. Raw keys are never sent to the browser or logged.

### Alternatives Considered
- *Separate table `search_api_keys`*: Rejected because it duplicates the AES-256-GCM encryption logic, audit fields, and key lifecycle management. A discriminator column in `api_keys` is cleaner, adheres to Principle 7 (Simplicity), and scales to future providers.

---

## 2. Search Provider Abstraction & Fallback Chain

### Context
Per Principle 4 (Provider Independence) and Story E11-S12, web search must never be hardcoded to Tavily SDK calls throughout application code. Furthermore, users without a Tavily key, or whose keys run out of monthly credits, must fall back to curated free RSS/Atom news feeds without encountering broken UI or blank screens.

### Decision
Create a unified `SearchProvider` interface in `src/lib/search/provider.ts`:
```typescript
export interface SearchQueryOptions {
  query: string;
  topic?: string | undefined;
  freshness?: 'day' | 'week' | 'month' | undefined;
  maxResults?: number | undefined;
  language?: string | undefined;
  signal?: AbortSignal | undefined;
}

export interface SearchResultItem {
  title: string;
  url: string;
  sourceDomain: string;
  snippet: string;
  publishedDate?: string | undefined;
  score?: number | undefined;
}

export interface SearchProvider {
  search(options: SearchQueryOptions, apiKey?: string): Promise<SearchResultItem[]>;
  validateKey(apiKey: string): Promise<boolean>;
}
```

Implementations:
1. `TavilySearchAdapter`: Dispatches HTTP `POST https://api.tavily.com/search` using `search_depth: "basic"` (costs 1 credit), `include_answer: false`, `include_raw_content: false`. Maps HTTP 401 to `InvalidKeyError` and HTTP 429 to `QuotaExceededError`.
2. `RssFeedSearchAdapter`: Curated RSS and Atom feed aggregator (filtering major tech, business, and industry news feeds). Evaluates topic phrase matching across headline and description text. Enforces strict timeouts (4s) and domain allow-lists.
3. `FakeSearchAdapter`: Deterministic in-memory fixture provider used for unit and integration testing.
4. `SearchPipelineService`: Implements the fallback chain:
   ```
   Tavily (if key exists & credits remaining)
     └─> Fallback: RSS/Atom Curated Feeds (always available, free)
   ```

### Alternatives Considered
- *Gemini Search Grounding as primary*: Tavily is purpose-built for clean search snippets with predictable 1-credit costs, whereas Gemini Google Search grounding incurs metered per-prompt billing with uncertain free-tier stability and mandatory Google Search Suggestions display obligations. Tavily is therefore primary, with RSS as resilient free fallback.

---

## 3. Privacy Boundary & Query Isolation

### Context
Saouti's core promise is data sovereignty and privacy (Principle 2). External search engines must never learn the user's real name, employer, confidential clients, or Voice Profile parameters.

### Decision
- **Strict Query Sanitization**: Outgoing search queries contain *strictly* topic phrases (e.g., `"algorithmic trading models"`, `"fintech regulation in Europe"`).
- Automated security unit test `tests/security/search-privacy.test.ts` executes regex scans across all outgoing search HTTP payloads to guarantee zero occurrence of `user.name`, `user.email`, `user.id`, `identityData.positioning`, or approved facts.
- **Untrusted Web Text Isolation**: All external text returned by Tavily or RSS feeds is treated as raw data, never instructions. Snippets are wrapped in XML tags `<search_results>` and passed through `escapeXmlEntities` before entering the Researcher agent.

---

## 4. Researcher Agent & Topic Planner Architecture

### Context
Search results from Tavily or RSS feeds are raw snippets. We need to rank, filter, summarize (≤40 words in Saouti's own words), and synthesize a "Why it matches" explanation for each article.

### Decision
- **Separation of Search and AI**: Code executes the web search directly via HTTP fetch. The raw snippets are formatted into an isolated XML block `<search_results>`.
- **Topic Planner Agent** (`src/lib/agent-engine/prompts/topic-planner.v1.md`): Takes `<profile>` and `<approved_facts>` as untrusted data and generates 5 to 8 topic phrases with relevance rationale.
- **Researcher Agent** (`src/lib/agent-engine/prompts/researcher.v1.md`): Takes `<search_results>`, `<topic>`, `<profile>`, and `<already_seen>` to select the top 5 to 10 articles, returning structured JSON validated against `ResearcherExtractionOutputSchema`.
- **Deterministic Token Budget**: By having the agent summarize in ≤40 words and extract structured metadata, we keep Gemini input/output tokens low (~500 tokens per topic summary).

---

## 5. Quota Guard, Caching & Budget Transparency

### Context
Tavily free tier provides 1,000 credits/month (resetting monthly, no rollover). Users must not exhaust their monthly credits or Gemini rate limits.

### Decision
- **Caching**: Search results are cached in the PostgreSQL `articles` table per topic and user with `cached_until` set to `now() + 24 hours`. Re-visiting `/explore` serves cached articles instantly without consuming Tavily credits or Gemini calls.
- **Daily Search Limit**: Default 15 search queries per day per user recorded in `search_usage_counters`.
- **Monthly Credit Guard**: Default 800 credits (80% of 1,000 credit free tier) read from `config.tavilyMonthlyCreditGuard`. When reached, Explore gracefully defaults to RSS feeds and shows: `"Monthly credit guard reached (800/1000). Switched to free news feeds to preserve credits."`
- **Cost Preview**: The UI refresh button displays a tooltip/subtext preview: `"Refresh will use ~5 Tavily credits"`.
- **Task Prioritization**: In the BullMQ worker, post generation jobs (`generate-post-run`) run with higher priority (`priority: 1`) than Explore refresh background jobs (`priority: 5`).

---

## 6. Article-to-Post Bridge & Source Attribution

### Context
Users should turn an article into a drafted social media post in one click, with factual grounding and source attribution enforced.

### Decision
- "Create Post" navigates to the generation workspace with query params `?articleId=...` or opens the composer with the article summary attached as reference.
- **Writer Agent Prompt v3**: Adds `<source_article>` block. When present, the Writer must use only facts from the article summary and `<approved_facts>`, formulate a custom thought-leadership angle, and include an attribution line (e.g., `Source: TechCrunch`).
- **Critic Agent Prompt v3**: Verifies that every factual claim is grounded in either `<source_article>` or `<approved_facts>`. Flags ungrounded claims and missing source attribution as safety failures.
- **Regression Testing**: Golden profile evaluation suite will be executed with prompt versions v1, v2, and v3 to verify zero degradation in voice profile fidelity.

---

## 7. Storage, Deduplication & GDPR Erasure

### Context
Users can bookmark articles into `/explore/saved` and attach private notes. Copyright dictates we never store full web pages.

### Decision
- **No Full-Text Storage**: Store only `canonical_url`, `title`, `source_domain`, `published_at`, `summary` (≤40 words), `match_reason`, and `private_note`.
- **URL Canonicalization**: Strip tracking query parameters (`utm_*`, `fbclid`, `gclid`, `ref`, `mc_eid`) and trailing slashes to prevent duplicate saves of the same link.
- **GDPR Account Erasure**: In `src/app/api/auth/delete-account/route.ts`, cascade deletion purges `topics`, `saved_articles`, `article_dismissals`, `search_usage_counters`, and Tavily `api_keys`.
